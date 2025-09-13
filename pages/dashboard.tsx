import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Upload, Mail, Send, LogOut, AlertCircle, CheckCircle, Users } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import DropZone from '@/components/FileUpload/DropZone';
import DataPreview from '@/components/FileUpload/DataPreview';
import MessageEditor from '@/components/EmailComposer/MessageEditor';
import VariableHelper from '@/components/EmailComposer/VariableHelper';
import StatusTracker from '@/components/Progress/StatusTracker';

interface EmailRecord {
  email: string;
  [key: string]: any;
}

interface EmailData {
  data: EmailRecord[];
  headers: string[];
  totalRecords: number;
  validEmails: number;
  invalidEmails: number;
}

interface EmailTemplate {
  subject: string;
  htmlContent: string;
  textContent: string;
  fromName: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'compose' | 'send' | 'tracking'>('upload');
  
  // Data states
  const [emailData, setEmailData] = useState<EmailData | null>(null);
  const [emailTemplate, setEmailTemplate] = useState<EmailTemplate>({
    subject: '',
    htmlContent: '',
    textContent: '',
    fromName: ''
  });
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    toast.success('Logged out successfully');
    router.push('/login');
  };

  const handleFileUpload = (data: EmailData) => {
    setEmailData(data);
    setCurrentStep('compose');
    toast.success(`File uploaded successfully! ${data.validEmails} valid emails found.`);
  };

  const handleTemplateUpdate = (template: EmailTemplate) => {
    setEmailTemplate(template);
  };

  const handleSendEmails = async () => {
    if (!emailData || !emailTemplate.subject || !emailTemplate.htmlContent) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipients: emailData.data.filter(record => record.isValidEmail),
          subject: emailTemplate.subject,
          htmlContent: emailTemplate.htmlContent,
          textContent: emailTemplate.textContent,
          fromName: emailTemplate.fromName
        })
      });

      const result = await response.json();
      
      if (result.success && result.batchId) {
        setBatchId(result.batchId);
        setCurrentStep('tracking');
        toast.success('Email sending started!');
      } else {
        toast.error(result.message || 'Failed to send emails');
      }
    } catch (error) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetWorkflow = () => {
    setEmailData(null);
    setEmailTemplate({
      subject: '',
      htmlContent: '',
      textContent: '',
      fromName: ''
    });
    setBatchId(null);
    setCurrentStep('upload');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Mail className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Bulk Email Sender</h1>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {[
              { key: 'upload', label: 'Upload Data', icon: Upload },
              { key: 'compose', label: 'Compose Email', icon: Mail },
              { key: 'send', label: 'Send Emails', icon: Send },
              { key: 'tracking', label: 'Track Progress', icon: Users }
            ].map((step, index) => {
              const isActive = currentStep === step.key;
              const isCompleted = ['upload', 'compose', 'send'].indexOf(currentStep) > ['upload', 'compose', 'send'].indexOf(step.key);
              
              return (
                <div key={step.key} className="flex items-center">
                  <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                    isActive ? 'bg-blue-100 text-blue-700' : 
                    isCompleted ? 'bg-green-100 text-green-700' : 
                    'bg-gray-100 text-gray-500'
                  }`}>
                    <step.icon className="h-4 w-4" />
                    <span className="font-medium">{step.label}</span>
                    {isCompleted && <CheckCircle className="h-4 w-4" />}
                  </div>
                  {index < 3 && (
                    <div className={`w-8 h-px mx-2 ${isCompleted ? 'bg-green-300' : 'bg-gray-300'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentStep === 'upload' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Your Email List</h2>
              <p className="text-gray-600">Upload a CSV or Excel file containing email addresses and other data</p>
            </div>
            
            <DropZone onFileUpload={handleFileUpload} />
            
            {emailData && (
              <DataPreview 
                data={emailData} 
                onContinue={() => setCurrentStep('compose')}
              />
            )}
          </div>
        )}

        {currentStep === 'compose' && emailData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <MessageEditor 
                template={emailTemplate}
                onUpdate={handleTemplateUpdate}
                availableVariables={emailData.headers}
              />
            </div>
            <div>
              <VariableHelper 
                variables={emailData.headers}
                sampleData={emailData.data[0] || {}}
                template={emailTemplate}
              />
            </div>
          </div>
        )}

        {currentStep === 'send' && emailData && (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Ready to Send</h2>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Recipients:</span>
                  <span className="font-medium">{emailData.validEmails}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Subject:</span>
                  <span className="font-medium">{emailTemplate.subject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">From:</span>
                  <span className="font-medium">
                    {emailTemplate.fromName ? `${emailTemplate.fromName} <${process.env.NEXT_PUBLIC_ || 'noreply@yourdomain.com'}>` : process.env.NEXT_PUBLIC_ || 'noreply@yourdomain.com'}
                  </span>
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleSendEmails}
                  disabled={isLoading}
                  className="btn-primary flex-1 flex items-center justify-center space-x-2 py-3"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>Send All Emails</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setCurrentStep('compose')}
                  className="btn-secondary px-6"
                  disabled={isLoading}
                >
                  Back to Edit
                </button>
              </div>
            </div>
          </div>
        )}

        {currentStep === 'tracking' && batchId && (
          <div>
            <StatusTracker batchId={batchId} onReset={resetWorkflow} />
          </div>
        )}
      </main>

      {/* Fixed action buttons */}
      {currentStep === 'compose' && emailData && (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => setCurrentStep('send')}
            className="btn-primary px-6 py-3 shadow-lg flex items-center space-x-2"
          >
            <Send className="h-5 w-5" />
            <span>Continue to Send</span>
          </button>
        </div>
      )}
    </div>
  );
}