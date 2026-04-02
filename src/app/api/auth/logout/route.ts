import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/database/mongodb';
import { AuditLog } from '@/lib/database/schemas';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('hipa_token')?.value;
    
    if (token) {
      try {
        // Verify and decode token
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        
        // Connect to database
        await connectDB();
        
        // Log logout activity
        await (AuditLog as any).log({
          actor: {
            userId: decoded.userId,
            role: decoded.role || 'user',
            ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            userAgent: request.headers.get('user-agent') || 'unknown'
          },
          action: 'user_logout',
          entity: {
            type: 'user',
            id: decoded.userId
          }
        });
      } catch (err) {
        // Token invalid or expired, continue with logout
        console.error('Error logging logout:', err);
      }
    }
  } catch (err) {
    console.error('Error in logout:', err);
  }
  
  const response = NextResponse.json({ success: true });
  
  // Clear the auth cookie
  response.cookies.set('hipa_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // Expire immediately
    path: '/',
  });

  return response;
}
