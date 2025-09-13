import { useState } from 'react';
import { ChevronDown, ChevronUp, Mail, AlertTriangle, CheckCircle, Users } from 'lucide-react';

interface EmailData {
  data: Array<{ email: string; [key: string]: any }>;
  headers: string[];
  totalRecords: number;
  validEmails: number;
  invalidEmails: number;
}

interface DataPreviewProps {
  data: EmailData;
  onContinue: () => void;
}

export default function DataPreview({ data, onContinue }: DataPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = Math.min(startIndex + recordsPerPage, data.data.length);
  const currentRecords = data.data.slice(startIndex, endIndex);
  const totalPages = Math.ceil(data.data.length / recordsPerPage);

  const validEmailsCount = data.data.filter(record => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(record.email);
  }).length;

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Summary Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Data Preview</h3>
              <p className="text-sm text-gray-600">
                {data.data.length} records loaded from your file
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md transition-colors"
          >
            <span>{isExpanded ? 'Hide Details' : 'Show Details'}</span>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">Total Records</p>
                <p className="text-2xl font-bold text-blue-700">{data.data.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-900">Valid Emails</p>
                <p className="text-2xl font-bold text-green-700">{validEmailsCount}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-yellow-900">Invalid Emails</p>
                <p className="text-2xl font-bold text-yellow-700">{data.data.length - validEmailsCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed View */}
      {isExpanded && (
        <div className="p-6">
          {/* Column Headers */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Available Columns:</h4>
            <div className="flex flex-wrap gap-2">
              {data.headers.map((header, index) => (
                <span
                  key={index}
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    header.toLowerCase().includes('email') 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {header}
                  {header.toLowerCase().includes('email') && (
                    <span className="ml-1 text-xs">(Email)</span>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Data Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  {data.headers.map((header, index) => (
                    <th
                      key={index}
                      className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentRecords.map((record, index) => {
                  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email);
                  
                  return (
                    <tr key={index} className={isValidEmail ? '' : 'bg-red-50'}>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {isValidEmail ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        )}
                      </td>
                      {data.headers.map((header, headerIndex) => (
                        <td
                          key={headerIndex}
                          className="px-4 py-2 whitespace-nowrap text-sm text-gray-900"
                        >
                          {record[header] || '-'}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {endIndex} of {data.data.length} records
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <span className="px-3 py-1 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="p-6 bg-gray-50 rounded-b-lg">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Ready to compose your email with {validEmailsCount} valid recipients
          </div>
          
          <button
            onClick={onContinue}
            disabled={validEmailsCount === 0}
            className="btn-primary px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Compose Email
          </button>
        </div>
      </div>
    </div>
  );
}