import { NextApiResponse } from 'next';
import { Resend } from 'resend';
import { withAuth, AuthenticatedRequest } from '@/utils/auth';
import { replaceVariables } from '@/utils/emailHelpers';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailRecord {
  email: string;
  [key: string]: any;
}

interface SendEmailRequest {
  recipients: EmailRecord[];
  subject: string;
  htmlContent: string;
  textContent?: string;
  fromName?: string;
}

interface EmailResult {
  email: string;
  status: 'success' | 'failed';
  messageId?: string;
  error?: string;
}

interface SendResponse {
  success: boolean;
  message?: string;
  results?: EmailResult[];
  totalSent?: number;
  totalFailed?: number;
  batchId?: string;
}

// Store batch results in memory (in production, use Redis or database)
const batchResults = new Map<string, {
  results: EmailResult[];
  status: 'processing' | 'completed' | 'failed';
  totalSent: number;
  totalFailed: number;
  createdAt: Date;
}>();

const sendEmailBatch = async (
  emails: Array<{
    to: string;
    subject: string;
    html: string;
    text?: string;
  }>,
  fromEmail: string,
  fromName?: string
): Promise<EmailResult[]> => {
  const results: EmailResult[] = [];
  
  try {
    // Log the configuration for debugging
    console.log('Sending batch with config:', {
      fromEmail,
      fromName,
      emailCount: emails.length,
      sampleEmail: emails[0]?.to
    });

    // Resend batch API - send up to 100 emails at once
    const emailPayloads = emails.map(email => {
      const fromField = fromName ? `${fromName} <${fromEmail}>` : fromEmail;
      console.log('From field being sent:', fromField);
      return {
        from: fromField,
        to: [email.to],
        subject: email.subject,
        html: email.html,
        text: email.text,
      };
    });
    
    const response = await resend.batch.send(emailPayloads);

    console.log('Resend API response:', {
      success: response.data ? 'true' : 'false',
      dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
      error: response.error,
      responseData: response.data // Log the actual data structure
    });

    // Handle successful response
    if (response.data && !response.error) {
      if (Array.isArray(response.data)) {
        // Handle array response
        response.data.forEach((result, index) => {
          if (result.id) {
            results.push({
              email: emails[index].to,
              status: 'success',
              messageId: result.id,
            });
          } else {
            results.push({
              email: emails[index].to,
              status: 'failed',
              error: 'No message ID returned',
            });
          }
        });
      } else if (response.data.data && Array.isArray(response.data.data)) {
        // Handle nested data array
        response.data.data.forEach((result: any, index: number) => {
          if (result.id) {
            results.push({
              email: emails[index].to,
              status: 'success',
              messageId: result.id,
            });
          } else {
            results.push({
              email: emails[index].to,
              status: 'failed',
              error: 'No message ID returned',
            });
          }
        });
      } else {
        // Handle single result object
        const result = response.data as any;
        if (result.id) {
          results.push({
            email: emails[0].to,
            status: 'success',
            messageId: result.id,
          });
        } else {
          results.push({
            email: emails[0].to,
            status: 'failed',
            error: 'No message ID returned',
          });
        }
      }
    } else {
      // If batch failed, mark all as failed
      console.error('Resend batch send failed:', response.error);
      emails.forEach(email => {
        results.push({
          email: email.to,
          status: 'failed',
          error: response.error?.message || 'Batch send failed',
        });
      });
    }

  } catch (error) {
    console.error('Batch send error:', error);
    // Mark all emails in this batch as failed
    emails.forEach(email => {
      results.push({
        email: email.to,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    });
  }

  return results;
};

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<SendResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const {
      recipients,
      subject,
      htmlContent,
      textContent,
      fromName
    }: SendEmailRequest = req.body;

    const fromEmail = process.env.FROM_EMAIL || process.env.NEXT_PUBLIC_FROM_EMAIL;
    
    // Ensure the fromEmail is a complete email address, not just a domain
    const completeFromEmail = fromEmail?.includes('@') ? fromEmail : `noreply@${fromEmail}`;

    // Validation
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Recipients array is required and cannot be empty'
      });
    }

    if (!subject || !htmlContent) {
      return res.status(400).json({
        success: false,
        message: 'Subject and HTML content are required'
      });
    }

    if (!fromEmail) {
      return res.status(400).json({
        success: false,
        message: 'FROM_EMAIL environment variable is required'
      });
    }

    console.log('Email configuration:', {
      originalFromEmail: fromEmail,
      completeFromEmail,
      fromName
    });

    if (recipients.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 1000 recipients allowed per batch'
      });
    }

    // Generate batch ID
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Initialize batch tracking
    batchResults.set(batchId, {
      results: [],
      status: 'processing',
      totalSent: 0,
      totalFailed: 0,
      createdAt: new Date(),
    });

    // Process emails asynchronously
    processBatchAsync(batchId, recipients, subject, htmlContent, textContent, completeFromEmail, fromName);

    res.status(200).json({
      success: true,
      message: `Email batch initiated with ${recipients.length} recipients`,
      batchId,
    });

  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}

async function processBatchAsync(
  batchId: string,
  recipients: EmailRecord[],
  subject: string,
  htmlContent: string,
  textContent: string = '',
  fromEmail: string,
  fromName?: string
) {
  try {
    const batch = batchResults.get(batchId);
    if (!batch) return;

    const BATCH_SIZE = 100; // Resend's batch limit
    const allResults: EmailResult[] = [];

    // Process in chunks of 100
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      const chunk = recipients.slice(i, i + BATCH_SIZE);
      
      // Prepare emails for this chunk
      const emails = chunk.map(recipient => {
        const personalizedSubject = replaceVariables(subject, recipient);
        const personalizedHtml = replaceVariables(htmlContent, recipient);
        const personalizedText = replaceVariables(textContent, recipient);

        return {
          to: recipient.email,
          subject: personalizedSubject,
          html: personalizedHtml,
          text: personalizedText,
        };
      });

      // Send this batch
      const chunkResults = await sendEmailBatch(emails, fromEmail, fromName);
      allResults.push(...chunkResults);

      // Add delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }
    }

    // Update batch results
    const totalSent = allResults.filter(r => r.status === 'success').length;
    const totalFailed = allResults.filter(r => r.status === 'failed').length;

    batchResults.set(batchId, {
      results: allResults,
      status: 'completed',
      totalSent,
      totalFailed,
      createdAt: batch.createdAt,
    });

    console.log(`Batch ${batchId} completed: ${totalSent} sent, ${totalFailed} failed`);

  } catch (error) {
    console.error(`Batch ${batchId} failed:`, error);
    const batch = batchResults.get(batchId);
    if (batch) {
      batchResults.set(batchId, {
        ...batch,
        status: 'failed',
      });
    }
  }
}

// Export function to get batch results (used by status endpoint)
export function getBatchResults(batchId: string) {
  const batch = batchResults.get(batchId);
  if (!batch) return null;

  return {
    ...batch,
    results: batch.results,
  };
}

// Cleanup old batches (call this periodically)
export function cleanupOldBatches() {
  const now = new Date();
  const cutoff = 24 * 60 * 60 * 1000; // 24 hours

  batchResults.forEach((batch, batchId) => {
    if (now.getTime() - batch.createdAt.getTime() > cutoff) {
      batchResults.delete(batchId);
    }
  });
}

export default withAuth(handler);