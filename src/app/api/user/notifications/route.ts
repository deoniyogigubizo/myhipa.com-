import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/database/mongodb';
import { User } from '@/lib/database/schemas';


export const dynamic = "force-dynamic";
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('hipa_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const { notifications } = await request.json();

    await connectDB();

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (notifications) {
      user.preferences.notifications = {
        email: notifications.email ?? user.preferences.notifications.email,
        push: notifications.push ?? user.preferences.notifications.push,
        sms: notifications.sms ?? user.preferences.notifications.sms,
      };
    }

    await user.save();

    return NextResponse.json({ success: true, message: 'Notification preferences updated' });
  } catch (error) {
    console.error('Notifications update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
