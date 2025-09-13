import { NextApiResponse } from 'next';
import { withAuth, AuthenticatedRequest } from '@/utils/auth';

interface StatusResponse {
  success: boolean;
  batchId?: string;
  status?: 'processing' | 'completed' | 'failed';
  results?: Array<{
    email: string;
    status: 'success' | 'failed';
    messageId?: string;
    error?: string;
  }>;
  totalSent?: number;
  totalFailed?: number;
  progress?: number;
  message?: string;
}

// Use the same global batch storage as send.ts
declare global {
  var batchResults: Map<string, {
    results: Array<{
      email: string;
      status: 'success' | 'failed';
      messageId?: string;
      error?: string;
    }>;
    status: 'processing' | 'completed' | 'failed';
    totalSent: number;
    totalFailed: number;
    createdAt: Date;
  }> | undefined;
}

const batchResults = globalThis.batchResults ?? new Map();

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<StatusResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { batchId } = req.query;

    if (!batchId || typeof batchId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Batch ID is required'
      });
    }

    console.log(`Status endpoint: Looking for batch ${batchId}`);
    console.log(`Status endpoint: Total batches stored: ${batchResults.size}`);
    const batch = batchResults.get(batchId);
    console.log(`Status endpoint: Found batch:`, batch ? 'YES' : 'NO');

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found or expired'
      });
    }

    const totalRecords = batch.results.length;
    const completedRecords = batch.results.filter((r: any) => r.status === 'success' || r.status === 'failed').length;
    const progress = totalRecords > 0 ? Math.round((completedRecords / totalRecords) * 100) : 0;

    res.status(200).json({
      success: true,
      batchId,
      status: batch.status,
      results: batch.results,
      totalSent: batch.totalSent,
      totalFailed: batch.totalFailed,
      progress,
      message: `Batch ${batch.status}. ${batch.totalSent} sent, ${batch.totalFailed} failed.`
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get batch status'
    });
  }
}

export default withAuth(handler);