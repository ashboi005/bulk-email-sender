import { useState, useEffect } from 'react';
import { Mail, Eye, Code, Type, AtSign } from 'lucide-react';

interface EmailTemplate {
  subject: string;
  htmlContent: string;
  textContent: string;
  fromName: string;
}

interface MessageEditorProps {
  template: EmailTemplate;
  onUpdate: (template: EmailTemplate) => void;
  availableVariables: string[];
}

export default function MessageEditor({ template, onUpdate, availableVariables }: MessageEditorProps) {
  const [activeTab, setActiveTab] = useState<'compose' | 'preview'>('compose');
  const [isHtmlMode, setIsHtmlMode] = useState(false);

  // Auto-generate plain text from HTML
  useEffect(() => {
    if (template.htmlContent && !template.textContent) {
      const plainText = template.htmlContent
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
      
      onUpdate({ ...template, textContent: plainText });
    }
  }, [template.htmlContent]);

  const handleFieldChange = (field: keyof EmailTemplate, value: string) => {
    onUpdate({ ...template, [field]: value });
  };

  const insertVariable = (variable: string, targetField: 'subject' | 'htmlContent') => {
    const variableText = `{{${variable}}}`;
    const currentValue = template[targetField];
    const updatedValue = currentValue + variableText;
    handleFieldChange(targetField, updatedValue);
  };

  const generatePreview = () => {
    // Simple preview with first available sample data
    const sampleData = availableVariables.reduce((acc, variable) => {
      acc[variable] = variable === 'email' ? 'john@example.com' : 
                     variable === 'name' ? 'John Doe' : 
                     variable === 'company' ? 'Acme Corp' : 
                     `Sample ${variable}`;
      return acc;
    }, {} as Record<string, string>);

    const previewSubject = template.subject.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
      return sampleData[variable.trim()] || match;
    });

    const previewContent = template.htmlContent.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
      return sampleData[variable.trim()] || match;
    });

    return { subject: previewSubject, content: previewContent };
  };

  const preview = generatePreview();

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Compose Email</h3>
              <p className="text-sm text-gray-600">Create your email template with variables</p>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('compose')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'compose' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Type className="h-4 w-4 inline mr-2" />
              Compose
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'preview' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Eye className="h-4 w-4 inline mr-2" />
              Preview
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'compose' ? (
          <div className="space-y-6">
            {/* Email Configuration Info */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AtSign className="h-5 w-5 text-blue-600" />
                <div>
                  <h4 className="font-medium text-blue-900">Email Configuration</h4>
                  <p className="text-sm text-blue-700">
                    Emails will be sent from your verified domain configured in environment variables
                  </p>
                </div>
              </div>
            </div>

            {/* From Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Name (Optional)
              </label>
              <input
                type="text"
                value={template.fromName}
                onChange={(e) => handleFieldChange('fromName', e.target.value)}
                className="input-field"
                placeholder="Your Company Name"
              />
              <p className="text-sm text-gray-500 mt-1">
                This will appear as the sender name (e.g., "Your Company Name &lt;noreply@yourdomain.com&gt;")
              </p>
            </div>

            {/* Subject Line */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Subject Line <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-2">
                  {availableVariables.slice(0, 3).map((variable) => (
                    <button
                      key={variable}
                      onClick={() => insertVariable(variable, 'subject')}
                      className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                    >
                      +{variable}
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="text"
                value={template.subject}
                onChange={(e) => handleFieldChange('subject', e.target.value)}
                className="input-field"
                placeholder="Hello {{name}}, your order is ready!"
                required
              />
            </div>

            {/* Content Editor */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Email Content <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center space-x-4">
                  <div className="flex space-x-2">
                    {availableVariables.slice(0, 4).map((variable) => (
                      <button
                        key={variable}
                        onClick={() => insertVariable(variable, 'htmlContent')}
                        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                      >
                        +{variable}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setIsHtmlMode(!isHtmlMode)}
                    className={`flex items-center space-x-1 px-3 py-1 rounded text-sm transition-colors ${
                      isHtmlMode 
                        ? 'bg-orange-100 text-orange-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Code className="h-4 w-4" />
                    <span>{isHtmlMode ? 'Visual' : 'HTML'}</span>
                  </button>
                </div>
              </div>

              <textarea
                value={template.htmlContent}
                onChange={(e) => handleFieldChange('htmlContent', e.target.value)}
                className="input-field min-h-[300px] font-mono text-sm"
                placeholder={isHtmlMode ? 
                  '<h1>Hello {{name}}!</h1>\n<p>Thank you for your order...</p>' :
                  'Hello {{name}}!\n\nThank you for your order...'
                }
                required
              />
            </div>

            {/* Template Suggestions */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Quick Templates:</h4>
              <div className="space-y-2">
                <button
                  onClick={() => handleFieldChange('htmlContent', 
                    `<h2>Hello {{name}}!</h2>\n<p>Thank you for signing up. We're excited to have you on board!</p>\n<p>Best regards,<br>{{from_name || "The Team"}}</p>`
                  )}
                  className="text-sm text-blue-700 hover:text-blue-900 block"
                >
                  Welcome Email Template
                </button>
                <button
                  onClick={() => handleFieldChange('htmlContent', 
                    `<h2>Hi {{name}},</h2>\n<p>We have an exciting update to share with you...</p>\n<p>{{custom_message}}</p>\n<p>Best,<br>{{company || "Our Team"}}</p>`
                  )}
                  className="text-sm text-blue-700 hover:text-blue-900 block"
                >
                  Newsletter Template
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Preview Tab */
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Email Preview</h4>
              
              <div className="bg-white rounded border p-4 space-y-3">
                <div className="border-b pb-3">
                  <div className="text-sm text-gray-600">
                    From: {template.fromName ? `${template.fromName} <${process.env.NEXT_PUBLIC_FROM_EMAIL || 'noreply@yourdomain.com'}>` : process.env.NEXT_PUBLIC_FROM_EMAIL || 'noreply@yourdomain.com'}
                  </div>
                  <div className="text-sm text-gray-600">Subject: {preview.subject || 'No subject'}</div>
                </div>
                
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: preview.content || 'No content' }}
                />
              </div>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">Preview Notes:</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Variables are replaced with sample data</li>
                <li>• Actual emails will use real recipient data</li>
                <li>• Check that all variables display correctly</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}