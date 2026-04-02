import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/database/mongodb';
import { User } from '@/lib/database/schemas';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('hipa_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify current password - check both passwordHash and password fields for backward compatibility
    const passwordToCheck = user.passwordHash || user.password;
    if (!passwordToCheck) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }
    const isPasswordValid = await bcrypt.compare(currentPassword, passwordToCheck);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);
    user.passwordHash = passwordHash;
    // Remove legacy password field if it exists
    if (user.password) {
      user.password = undefined;
    }
    await user.save();

    return NextResponse.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
