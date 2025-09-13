import { useState } from 'react';
import { Copy, Eye, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface EmailTemplate {
  subject: string;
  htmlContent: string;
  textContent: string;
  fromName: string;
}

interface VariableHelperProps {
  variables: string[];
  sampleData: Record<string, any>;
  template: EmailTemplate;
}

export default function VariableHelper({ variables, sampleData, template }: VariableHelperProps) {
  const [activeTab, setActiveTab] = useState<'variables' | 'preview'>('variables');

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied: ${text}`);
  };

  const getVariablePreview = (variable: string) => {
    const value = sampleData[variable];
    if (value === undefined || value === null || value === '') {
      return 'No data';
    }
    return String(value).length > 30 ? String(value).substring(0, 30) + '...' : String(value);
  };

  const getUsedVariables = () => {
    const allText = `${template.subject} ${template.htmlContent}`;
    const matches = allText.match(/\{\{([^}]+)\}\}/g);
    if (!matches) return [];
    
    return matches.map(match => {
      const variable = match.replace(/\{\{|\}\}/g, '').split('|')[0].trim();
      return variable;
    }).filter((value, index, self) => self.indexOf(value) === index);
  };

  const getUnusedVariables = () => {
    const usedVars = getUsedVariables();
    return variables.filter(variable => !usedVars.includes(variable));
  };

  const validateTemplate = () => {
    const usedVars = getUsedVariables();
    const missingVars = usedVars.filter(variable => !variables.includes(variable));
    return { usedVars, missingVars };
  };

  const { usedVars, missingVars } = validateTemplate();
  const unusedVars = getUnusedVariables();

  const generatePreview = () => {
    const replaceVariables = (text: string) => {
      return text.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
        const [varName, fallback] = variable.split('|').map((s: string) => s.trim());
        const value = sampleData[varName];
        
        if (value === undefined || value === null || value === '') {
          if (fallback) {
            return fallback.replace(/^["']|["']$/g, '');
          }
          return `[Missing: ${varName}]`;
        }
        
        return String(value);
      });
    };

    return {
      subject: replaceVariables(template.subject),
      content: replaceVariables(template.htmlContent)
    };
  };

  const preview = generatePreview();

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setActiveTab('variables')}
            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
              activeTab === 'variables' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Variables
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
              activeTab === 'preview' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            Preview
          </button>
        </div>

        {/* Validation Status */}
        <div className="space-y-2">
          {missingVars.length > 0 && (
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Missing variables detected</span>
            </div>
          )}
          {missingVars.length === 0 && usedVars.length > 0 && (
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">All variables valid</span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'variables' ? (
          <div className="space-y-6">
            {/* Used Variables */}
            {usedVars.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Used Variables ({usedVars.length})</span>
                </h4>
                <div className="space-y-2">
                  {usedVars.map((variable, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${
                        variables.includes(variable) 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <code className="text-sm font-mono bg-white px-2 py-1 rounded">
                            {`{{${variable}}}`}
                          </code>
                          <button
                            onClick={() => copyToClipboard(`{{${variable}}}`)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                        {!variables.includes(variable) && (
                          <span className="text-xs text-red-600 font-medium">Missing</span>
                        )}
                      </div>
                      {variables.includes(variable) && (
                        <div className="mt-1 text-sm text-gray-600">
                          Preview: {getVariablePreview(variable)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Variables */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">
                Available Variables ({variables.length})
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {variables.map((variable, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border transition-colors ${
                      usedVars.includes(variable)
                        ? 'bg-green-50 border-green-200'
                        : 'bg-gray-50 border-gray-200 hover:bg-blue-50 hover:border-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <code className="text-sm font-mono bg-white px-2 py-1 rounded">
                          {`{{${variable}}}`}
                        </code>
                        <button
                          onClick={() => copyToClipboard(`{{${variable}}}`)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                      {usedVars.includes(variable) && (
                        <span className="text-xs text-green-600 font-medium">Used</span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      Preview: {getVariablePreview(variable)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Unused Variables Warning */}
            {unusedVars.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 text-yellow-800 mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">
                    Unused Variables ({unusedVars.length})
                  </span>
                </div>
                <div className="text-sm text-yellow-700">
                  These variables are available but not used in your template:
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {unusedVars.slice(0, 5).map((variable, index) => (
                    <code
                      key={index}
                      className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded"
                    >
                      {variable}
                    </code>
                  ))}
                  {unusedVars.length > 5 && (
                    <span className="text-xs text-yellow-600">
                      +{unusedVars.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Preview Tab */
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Subject Preview</h4>
              <div className="p-3 bg-gray-50 rounded border">
                <div className="text-sm">
                  {preview.subject || <span className="text-gray-400">No subject</span>}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Content Preview</h4>
              <div className="p-3 bg-gray-50 rounded border max-h-64 overflow-y-auto">
                {template.htmlContent ? (
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: preview.content }}
                  />
                ) : (
                  <span className="text-gray-400 text-sm">No content</span>
                )}
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-sm text-blue-800">
                <strong>Note:</strong> This preview uses sample data. Actual emails will use real recipient data from your uploaded file.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}