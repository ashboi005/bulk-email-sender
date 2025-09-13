import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import * as XLSX from 'xlsx';
import { createReadStream } from 'fs';
import csv from 'csv-parser';
import { withAuth, AuthenticatedRequest } from '@/utils/auth';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface EmailRecord {
  email: string;
  [key: string]: any;
}

interface ProcessResponse {
  success: boolean;
  data?: EmailRecord[];
  headers?: string[];
  totalRecords?: number;
  validEmails?: number;
  invalidEmails?: number;
  message?: string;
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

const findEmailColumn = (headers: string[]): string | null => {
  const emailColumns = ['email', 'Email', 'EMAIL', 'e-mail', 'E-mail', 'mail'];
  return headers.find(header => emailColumns.includes(header)) || null;
};

const processExcelFile = async (filePath: string): Promise<{ data: EmailRecord[], headers: string[] }> => {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
  
  if (jsonData.length === 0) {
    throw new Error('Empty file');
  }
  
  const headers = jsonData[0];
  const emailColumn = findEmailColumn(headers);
  
  if (!emailColumn) {
    throw new Error('No email column found. Please ensure your file has a column named "email", "Email", or similar.');
  }
  
  const data: EmailRecord[] = jsonData.slice(1).map((row: string[]) => {
    const record: EmailRecord = { email: '' };
    headers.forEach((header, index) => {
      record[header] = row[index] || '';
    });
    return record;
  }).filter(record => record.email && record.email.trim() !== '');
  
  return { data, headers };
};

const processCsvFile = async (filePath: string): Promise<{ data: EmailRecord[], headers: string[] }> => {
  return new Promise((resolve, reject) => {
    const data: EmailRecord[] = [];
    let headers: string[] = [];
    let headersParsed = false;
    
    createReadStream(filePath)
      .pipe(csv())
      .on('headers', (csvHeaders: string[]) => {
        headers = csvHeaders;
        headersParsed = true;
        
        const emailColumn = findEmailColumn(headers);
        if (!emailColumn) {
          reject(new Error('No email column found. Please ensure your file has a column named "email", "Email", or similar.'));
          return;
        }
      })
      .on('data', (row: any) => {
        if (headersParsed && row.email && row.email.trim() !== '') {
          data.push(row);
        }
      })
      .on('end', () => {
        resolve({ data, headers });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse<ProcessResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      keepExtensions: true,
    });

    const [fields, files] = await form.parse(req);
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded' 
      });
    }

    const fileExtension = file.originalFilename?.split('.').pop()?.toLowerCase();
    
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension || '')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid file format. Please upload CSV, XLS, or XLSX files only.' 
      });
    }

    let processedData: { data: EmailRecord[], headers: string[] };

    if (fileExtension === 'csv') {
      processedData = await processCsvFile(file.filepath);
    } else {
      processedData = await processExcelFile(file.filepath);
    }

    const { data, headers } = processedData;

    // Validate emails and add validation status
    const validatedData = data.map(record => ({
      ...record,
      isValidEmail: validateEmail(record.email),
    }));

    const validEmails = validatedData.filter(record => record.isValidEmail).length;
    const invalidEmails = validatedData.length - validEmails;

    // Limit to 1000 records for frontend performance
    const limitedData = validatedData.slice(0, 1000);

    res.status(200).json({
      success: true,
      data: limitedData,
      headers,
      totalRecords: data.length,
      validEmails,
      invalidEmails,
      message: `Successfully processed ${data.length} records. ${validEmails} valid emails, ${invalidEmails} invalid emails.`
    });

  } catch (error) {
    console.error('File processing error:', error);
    res.status(500).json({ 
      success: false, 
      message: error instanceof Error ? error.message : 'File processing failed' 
    });
  }
}

export default withAuth(handler);