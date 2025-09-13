import * as XLSX from 'xlsx';

export interface ParsedData {
  data: Record<string, any>[];
  headers: string[];
  errors: string[];
}

/**
 * Parse Excel file and return structured data
 */
export function parseExcelFile(buffer: Buffer): ParsedData {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    
    if (!sheetName) {
      return {
        data: [],
        headers: [],
        errors: ['No sheets found in the Excel file']
      };
    }
    
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    if (jsonData.length === 0) {
      return {
        data: [],
        headers: [],
        errors: ['Empty Excel file']
      };
    }
    
    const headers = jsonData[0] as string[];
    const rows = jsonData.slice(1);
    
    const data = rows.map((row, index) => {
      const record: Record<string, any> = {};
      headers.forEach((header, columnIndex) => {
        record[header] = row[columnIndex] || '';
      });
      record._rowIndex = index + 2; // Excel row number (1-indexed + header)
      return record;
    });
    
    return {
      data: data.filter(record => Object.values(record).some(value => value !== '')),
      headers,
      errors: []
    };
    
  } catch (error) {
    return {
      data: [],
      headers: [],
      errors: [`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}

/**
 * Parse CSV content and return structured data
 */
export function parseCsvContent(content: string): ParsedData {
  try {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length === 0) {
      return {
        data: [],
        headers: [],
        errors: ['Empty CSV file']
      };
    }
    
    // Simple CSV parsing (handles basic cases)
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            current += '"';
            i++; // Skip next quote
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      result.push(current.trim());
      return result;
    };
    
    const headers = parseCSVLine(lines[0]);
    const dataLines = lines.slice(1);
    
    const data = dataLines.map((line, index) => {
      const values = parseCSVLine(line);
      const record: Record<string, any> = {};
      
      headers.forEach((header, columnIndex) => {
        record[header] = values[columnIndex] || '';
      });
      
      record._rowIndex = index + 2; // 1-indexed + header
      return record;
    });
    
    return {
      data: data.filter(record => Object.values(record).some(value => value !== '')),
      headers,
      errors: []
    };
    
  } catch (error) {
    return {
      data: [],
      headers: [],
      errors: [`Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`]
    };
  }
}

/**
 * Find email column in headers
 */
export function findEmailColumn(headers: string[]): string | null {
  const emailPatterns = [
    'email', 'Email', 'EMAIL',
    'e-mail', 'E-mail', 'E-Mail',
    'mail', 'Mail', 'MAIL',
    'emailaddress', 'email_address',
    'contact', 'Contact'
  ];
  
  for (const pattern of emailPatterns) {
    const found = headers.find(header => header === pattern);
    if (found) return found;
  }
  
  // Fallback: look for headers containing 'email' or 'mail'
  for (const header of headers) {
    const lowerHeader = header.toLowerCase();
    if (lowerHeader.indexOf('email') !== -1 || lowerHeader.indexOf('mail') !== -1) {
      return header;
    }
  }
  
  return null;
}

/**
 * Validate parsed data for email sending
 */
export function validateParsedData(data: Record<string, any>[], headers: string[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  emailColumn: string | null;
  validRecords: number;
  invalidRecords: number;
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check if data exists
  if (!data || data.length === 0) {
    errors.push('No data found in file');
    return {
      isValid: false,
      errors,
      warnings,
      emailColumn: null,
      validRecords: 0,
      invalidRecords: 0
    };
  }
  
  // Find email column
  const emailColumn = findEmailColumn(headers);
  if (!emailColumn) {
    errors.push('No email column found. Please ensure your file has a column named "email", "Email", or similar.');
  }
  
  // Validate email addresses
  let validRecords = 0;
  let invalidRecords = 0;
  
  if (emailColumn) {
    data.forEach((record, index) => {
      const email = record[emailColumn];
      if (!email || typeof email !== 'string') {
        invalidRecords++;
        warnings.push(`Row ${record._rowIndex || index + 2}: Missing email address`);
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(email.trim())) {
          validRecords++;
        } else {
          invalidRecords++;
          warnings.push(`Row ${record._rowIndex || index + 2}: Invalid email format - ${email}`);
        }
      }
    });
  }
  
  // Check for large datasets
  if (data.length > 1000) {
    warnings.push(`Large dataset detected (${data.length} records). Only first 1000 will be processed.`);
  }
  
  return {
    isValid: errors.length === 0 && validRecords > 0,
    errors,
    warnings,
    emailColumn,
    validRecords,
    invalidRecords
  };
}