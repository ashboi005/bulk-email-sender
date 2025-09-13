import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

interface LoginRequest {
  username: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  token?: string;
  message?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LoginResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { username, password }: LoginRequest = req.body;

    // Validate credentials against environment variables
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const jwtSecret = process.env.NEXTAUTH_SECRET;

    if (!adminUsername || !adminPassword || !jwtSecret) {
      console.error('Missing environment variables for authentication');
      return res.status(500).json({ 
        success: false, 
        message: 'Server configuration error' 
      });
    }

    if (username !== adminUsername || password !== adminPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        username: adminUsername,
        role: 'admin',
        iat: Math.floor(Date.now() / 1000),
      },
      jwtSecret,
      { 
        expiresIn: '24h',
        issuer: 'bulk-email-sender',
        subject: 'admin-auth'
      }
    );

    res.status(200).json({ 
      success: true, 
      token,
      message: 'Authentication successful' 
    });

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
}