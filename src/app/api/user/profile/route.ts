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
    const { displayName, phone, location, bio } = await request.json();

    await connectDB();

    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (displayName) user.profile.displayName = displayName;
    if (phone) user.phone = phone;
    if (location) {
      user.profile.location = {
        city: location.split(',')[0]?.trim() || '',
        country: location.split(',')[1]?.trim() || '',
      };
    }
    if (bio) user.profile.bio = bio;

    await user.save();

    return NextResponse.json({ 
      success: true, 
      user: {
        id: user._id,
        email: user.email,
        displayName: user.profile.displayName,
        avatar: user.profile.avatar,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
