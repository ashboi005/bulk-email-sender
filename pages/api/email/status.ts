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

// Import the shared batch results directly
async function getBatchResultsFromSend(batchId: string) {
  try {
    // Dynamic import to avoid circular dependency issues
    const sendModule = await import('./send');
    return sendModule.getBatchResults(batchId);
  } catch (error) {
    console.error('Error importing send module:', error);
    return null;
  }
}

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

    const batch = await getBatchResultsFromSend(batchId);

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