import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle, XCircle, Clock, Download, RotateCcw, Users, Mail, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';

interface EmailResult {
  email: string;
  status: 'success' | 'failed';
  messageId?: string;
  error?: string;
}

interface BatchStatus {
  batchId: string;
  status: 'processing' | 'completed' | 'failed';
  results: EmailResult[];
  totalSent: number;
  totalFailed: number;
  progress: number;
  message: string;
}

interface StatusTrackerProps {
  batchId: string;
  onReset: () => void;
}

export default function StatusTracker({ batchId, onReset }: StatusTrackerProps) {
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failed'>('all');

  const fetchStatus = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setIsRefreshing(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/email/status?batchId=${batchId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setBatchStatus(result);
        setIsLoading(false);
      } else {
        toast.error(result.message || 'Failed to fetch status');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  }, [batchId]);

  // Auto-refresh while processing
  useEffect(() => {
    fetchStatus();
    
    const interval = setInterval(() => {
      if (batchStatus?.status === 'processing') {
        fetchStatus();
      }
    }, 2000); // Refresh every 2 seconds while processing

    return () => clearInterval(interval);
  }, [batchId, batchStatus?.status, fetchStatus]);

  const exportResults = () => {
    if (!batchStatus?.results) return;

    const csvContent = [
      ['Email', 'Status', 'Message ID', 'Error'].join(','),
      ...batchStatus.results.map(result => [
        result.email,
        result.status,
        result.messageId || '',
        result.error || ''
      ].map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-results-${batchId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Results exported successfully');
  };

  const filteredResults = batchStatus?.results?.filter(result => {
    if (filterStatus === 'all') return true;
    return result.status === filterStatus;
  }) || [];

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
        <p className="text-gray-600">Loading batch status...</p>
      </div>
    );
  }

  if (!batchStatus) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
        <p className="text-gray-600">Failed to load batch status</p>
        <button onClick={() => fetchStatus()} className="btn-primary mt-4">
          Retry
        </button>
      </div>
    );
  }

  const successRate = batchStatus.totalSent + batchStatus.totalFailed > 0 
    ? Math.round((batchStatus.totalSent / (batchStatus.totalSent + batchStatus.totalFailed)) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-full ${
              batchStatus.status === 'completed' ? 'bg-green-100' :
              batchStatus.status === 'failed' ? 'bg-red-100' :
              'bg-blue-100'
            }`}>
              {batchStatus.status === 'completed' ? (
                <CheckCircle className="h-8 w-8 text-green-600" />
              ) : batchStatus.status === 'failed' ? (
                <XCircle className="h-8 w-8 text-red-600" />
              ) : (
                <Clock className="h-8 w-8 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {batchStatus.status === 'completed' ? 'Sending Complete!' :
                 batchStatus.status === 'failed' ? 'Sending Failed' :
                 'Sending in Progress...'}
              </h2>
              <p className="text-gray-600">{batchStatus.message}</p>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => fetchStatus(true)}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 border rounded-lg transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            
            {batchStatus.status === 'completed' && (
              <button
                onClick={exportResults}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export Results</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress and Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Progress */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Progress</h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Completion</span>
              <span>{batchStatus.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${batchStatus.progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Total Emails */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Users className="h-6 w-6 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Total</h3>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {batchStatus.totalSent + batchStatus.totalFailed}
          </div>
          <div className="text-sm text-gray-600">emails processed</div>
        </div>

        {/* Successful */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3 mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h3 className="font-semibold text-gray-900">Sent</h3>
          </div>
          <div className="text-3xl font-bold text-green-600">
            {batchStatus.totalSent}
          </div>
          <div className="text-sm text-gray-600">{successRate}% success rate</div>
        </div>

        {/* Failed */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-3 mb-4">
            <XCircle className="h-6 w-6 text-red-600" />
            <h3 className="font-semibold text-gray-900">Failed</h3>
          </div>
          <div className="text-3xl font-bold text-red-600">
            {batchStatus.totalFailed}
          </div>
          <div className="text-sm text-gray-600">
            {batchStatus.totalFailed > 0 ? 'click to see details' : 'no failures'}
          </div>
        </div>
      </div>

      {/* Detailed Results */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Detailed Results</h3>
            <div className="flex items-center space-x-4">
              {/* Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'success' | 'failed')}
                className="text-sm border rounded px-3 py-1"
              >
                <option value="all">All ({batchStatus.results.length})</option>
                <option value="success">Successful ({batchStatus.totalSent})</option>
                <option value="failed">Failed ({batchStatus.totalFailed})</option>
              </select>
              
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {showDetails ? 'Hide' : 'Show'} Details
              </button>
            </div>
          </div>
        </div>

        {showDetails && (
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Message ID
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Error
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredResults.slice(0, 100).map((result, index) => (
                    <tr key={index} className={result.status === 'failed' ? 'bg-red-50' : ''}>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {result.status === 'success' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                        {result.email}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {result.messageId || '-'}
                      </td>
                      <td className="px-4 py-2 text-sm text-red-600">
                        {result.error || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredResults.length > 100 && (
                <div className="text-center py-4 text-gray-600">
                  Showing first 100 results. Export CSV for complete data.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Batch ID: <code className="bg-gray-100 px-2 py-1 rounded font-mono">{batchId}</code>
          </div>
          
          <div className="flex space-x-3">
            {batchStatus.status === 'completed' && batchStatus.totalFailed > 0 && (
              <button
                onClick={() => toast('Retry functionality coming soon')}
                className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Retry Failed</span>
              </button>
            )}
            
            <button
              onClick={onReset}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              <span>Send New Campaign</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}