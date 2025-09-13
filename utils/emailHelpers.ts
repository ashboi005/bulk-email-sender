interface EmailRecord {
  [key: string]: any;
}

/**
 * Replace variables in email template with actual data
 * Supports syntax: {{variable}} and {{variable|fallback}}
 */
export function replaceVariables(template: string, data: EmailRecord): string {
  if (!template || !data) return template;

  return template.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
    const [varName, fallback] = variable.split('|').map((s: string) => s.trim());
    
    // Get value from data object
    let value = data[varName];
    
    // If value doesn't exist or is empty, use fallback
    if (value === undefined || value === null || value === '') {
      if (fallback) {
        // Remove quotes from fallback if present
        return fallback.replace(/^["']|["']$/g, '');
      }
      return match; // Return original if no fallback
    }
    
    return String(value);
  });
}

/**
 * Generate plain text version from HTML content
 */
export function htmlToPlainText(html: string): string {
  if (!html) return '';
  
  return html
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Convert HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Clean up whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Validate email address format
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Extract all variables from a template
 */
export function extractVariables(template: string): string[] {
  if (!template) return [];
  
  const matches = template.match(/\{\{([^}]+)\}\}/g);
  if (!matches) return [];
  
  return matches.map(match => {
    const variable = match.replace(/\{\{|\}\}/g, '');
    const [varName] = variable.split('|').map(s => s.trim());
    return varName;
  }).filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates
}

/**
 * Validate template against available data columns
 */
export function validateTemplate(template: string, availableColumns: string[]): {
  isValid: boolean;
  missingVariables: string[];
  warnings: string[];
} {
  const variables = extractVariables(template);
  const missingVariables: string[] = [];
  const warnings: string[] = [];
  
  variables.forEach(variable => {
    if (!availableColumns.includes(variable)) {
      missingVariables.push(variable);
    }
  });
  
  // Check for common issues
  if (template.includes('{{email}}') && !availableColumns.includes('email')) {
    warnings.push('Using {{email}} variable but no email column found');
  }
  
  if (variables.length === 0) {
    warnings.push('No variables found in template - emails will be identical');
  }
  
  return {
    isValid: missingVariables.length === 0,
    missingVariables,
    warnings
  };
}

/**
 * Preview template with sample data
 */
export function previewTemplate(
  template: string, 
  sampleData: EmailRecord, 
  fallbackData: Record<string, string> = {}
): string {
  const mergedData = { ...fallbackData, ...sampleData };
  return replaceVariables(template, mergedData);
}

/**
 * Sanitize HTML content for email
 */
export function sanitizeHtmlForEmail(html: string): string {
  if (!html) return '';
  
  // Basic sanitization - in production, consider using a proper HTML sanitizer
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

/**
 * Format email statistics
 */
export function formatEmailStats(results: Array<{ status: string }>): {
  total: number;
  sent: number;
  failed: number;
  successRate: number;
} {
  const total = results.length;
  const sent = results.filter(r => r.status === 'success').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const successRate = total > 0 ? Math.round((sent / total) * 100) : 0;
  
  return { total, sent, failed, successRate };
}