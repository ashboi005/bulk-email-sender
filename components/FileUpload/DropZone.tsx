import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface EmailData {
  data: Array<{ email: string; [key: string]: any }>;
  headers: string[];
  totalRecords: number;
  validEmails: number;
  invalidEmails: number;
}

interface DropZoneProps {
  onFileUpload: (data: EmailData) => void;
}

export default function DropZone({ onFileUpload }: DropZoneProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const processFile = async (file: File) => {
    setIsUploading(true);
    setUploadStatus('idle');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/upload/process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (result.success && result.data) {
        setUploadStatus('success');
        onFileUpload({
          data: result.data,
          headers: result.headers,
          totalRecords: result.totalRecords,
          validEmails: result.validEmails,
          invalidEmails: result.invalidEmails
        });
        toast.success(result.message || 'File uploaded successfully!');
      } else {
        setUploadStatus('error');
        toast.error(result.message || 'Failed to process file');
      }
    } catch (error) {
      setUploadStatus('error');
      toast.error('Network error. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      
      // Validate file type
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      const isValidType = validTypes.some(type => file.type === type) || 
                         file.name.match(/\.(csv|xlsx|xls)$/i);
      
      if (!isValidType) {
        toast.error('Please upload a CSV, XLS, or XLSX file');
        return;
      }
      
      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      processFile(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
          ${isDragActive ? 'border-blue-400 bg-blue-50' : 
            isDragReject ? 'border-red-400 bg-red-50' :
            uploadStatus === 'success' ? 'border-green-400 bg-green-50' :
            uploadStatus === 'error' ? 'border-red-400 bg-red-50' :
            'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'}
          ${isUploading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          {isUploading ? (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto"></div>
              <div>
                <p className="text-lg font-medium text-gray-700">Processing file...</p>
                <p className="text-sm text-gray-500">Please wait while we parse your data</p>
              </div>
            </>
          ) : uploadStatus === 'success' ? (
            <>
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
              <div>
                <p className="text-lg font-medium text-green-700">File uploaded successfully!</p>
                <p className="text-sm text-green-600">Your data has been processed and validated</p>
              </div>
            </>
          ) : uploadStatus === 'error' ? (
            <>
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto" />
              <div>
                <p className="text-lg font-medium text-red-700">Upload failed</p>
                <p className="text-sm text-red-600">Please try again with a valid file</p>
              </div>
            </>
          ) : (
            <>
              <Upload className={`h-12 w-12 mx-auto ${
                isDragActive ? 'text-blue-600' : 
                isDragReject ? 'text-red-600' : 
                'text-gray-400'
              }`} />
              <div>
                <p className="text-lg font-medium text-gray-700">
                  {isDragActive ? 'Drop your file here...' :
                   isDragReject ? 'Invalid file type' :
                   'Upload your email list'}
                </p>
                <p className="text-sm text-gray-500">
                  Drag and drop a CSV, XLS, or XLSX file, or click to browse
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* File requirements */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-900 mb-2">File Requirements:</h3>
        <ul className="space-y-1 text-sm text-blue-800">
          <li className="flex items-center space-x-2">
            <File className="h-4 w-4" />
            <span>Supported formats: CSV, XLS, XLSX</span>
          </li>
          <li className="flex items-center space-x-2">
            <File className="h-4 w-4" />
            <span>Maximum file size: 10MB</span>
          </li>
          <li className="flex items-center space-x-2">
            <File className="h-4 w-4" />
            <span>Must contain an "email" column</span>
          </li>
          <li className="flex items-center space-x-2">
            <File className="h-4 w-4" />
            <span>Maximum 1000 recipients per batch</span>
          </li>
        </ul>
      </div>

      {/* Sample format */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Sample CSV Format:</h3>
        <div className="bg-white p-3 rounded border text-sm font-mono">
          <div className="text-gray-600">email,name,company</div>
          <div className="text-gray-800">john@example.com,John Doe,Acme Corp</div>
          <div className="text-gray-800">jane@example.com,Jane Smith,Beta Inc</div>
        </div>
      </div>
    </div>
  );
}