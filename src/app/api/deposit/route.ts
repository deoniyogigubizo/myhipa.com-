import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/database/mongodb'
import { User } from '@/lib/database/schemas'
import { verifyToken, extractToken } from '@/lib/auth/middleware'
import { MTNMoMoService } from '@/lib/payments/mtn'

const mtn = new MTNMoMoService()

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { amount, paymentMethod } = body

    if (!amount || amount < 1000) {
      return NextResponse.json({ error: 'Minimum deposit amount is 1,000 RWF' }, { status: 400 })
    }

    const user = await User.findById(decoded.userId)
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!user.phone) {
      return NextResponse.json({ error: 'Phone number required for MTN MoMo deposit' }, { status: 400 })
    }

    // Create deposit transaction using MTN MoMo
    const orderId = `DEPOSIT-${Date.now()}-${decoded.userId}`
    const payment = await mtn.requestToPay({
      amount: amount,
      currency: 'RWF',
      phone: user.phone,
      orderId: orderId,
    })

    return NextResponse.json({
      message: 'Payment initiated successfully. Please check your MTN MoMo phone for the payment prompt.',
      txRef: payment.txRef,
      amount,
      currency: 'RWF',
      status: payment.status
    })
  } catch (error) {
    console.error('Deposit initiation error:', error)

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('MTN MoMo configuration missing')) {
        return NextResponse.json({
          error: 'Payment service configuration error. Please contact support.'
        }, { status: 500 })
      }
      if (error.message.includes('Failed to create access token: 401')) {
        return NextResponse.json({
          error: 'Payment service authentication failed. Please check MTN MoMo API credentials.'
        }, { status: 500 })
      }
      if (error.message.includes('Account holder is not active')) {
        return NextResponse.json({
          error: 'Your MTN Mobile Money account is not active. Please check your account status.'
        }, { status: 400 })
      }
      if (error.message.includes('Payment request failed')) {
        return NextResponse.json({
          error: 'Payment request failed. Please try again or contact support.'
        }, { status: 400 })
      }
    }

    return NextResponse.json({ error: 'Failed to initiate deposit. Please try again.' }, { status: 500 })
  }
}