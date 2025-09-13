// Shared batch storage for email sending status
interface EmailResult {
  email: string;
  status: 'success' | 'failed';
  messageId?: string;
  error?: string;
}

interface BatchData {
  results: EmailResult[];
  status: 'processing' | 'completed' | 'failed';
  totalSent: number;
  totalFailed: number;
  createdAt: Date;
}

// Store batch results in memory (in production, use Redis or database)
const batchResults = new Map<string, BatchData>();

export function setBatchResults(batchId: string, data: BatchData) {
  console.log(`Setting batch ${batchId}:`, data.status);
  batchResults.set(batchId, data);
  console.log(`Total batches stored: ${batchResults.size}`);
}

export function getBatchResults(batchId: string): BatchData | null {
  console.log(`Getting batch ${batchId}, total stored: ${batchResults.size}`);
  const batch = batchResults.get(batchId);
  console.log(`Found batch: ${batch ? 'YES' : 'NO'}`);
  if (!batch) return null;

  return {
    ...batch,
    results: batch.results,
  };
}

export function updateBatchResults(batchId: string, updates: Partial<BatchData>) {
  const existing = batchResults.get(batchId);
  if (existing) {
    batchResults.set(batchId, { ...existing, ...updates });
  }
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