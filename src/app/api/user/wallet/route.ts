import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database/mongodb'
import { User } from '@/lib/database/schemas'
import { verifyToken, extractToken } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
  try {
    await connectDB()

    const token = extractToken(request)
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      balance: user.wallet?.balance || 0,
      availableBalance: (user.wallet?.balance || 0) - (user.wallet?.pendingRefunds || 0)
    })
  } catch (error) {
    console.error('Wallet balance error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}