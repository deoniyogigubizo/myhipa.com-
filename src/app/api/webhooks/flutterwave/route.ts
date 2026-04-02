import { NextRequest, NextResponse } from 'next/server'
import { FlutterwaveService } from '@/lib/payments/flutterwave'
import { EscrowService } from '@/lib/payments/escrow'

const flw = new FlutterwaveService()
const escrow = new EscrowService(flw)

export async function POST(request: NextRequest) {
  try {
    // Get raw body for webhook signature verification
    const rawBody = await request.text()
    const body = JSON.parse(rawBody)

    // Get signature from headers
    const signature = request.headers.get('verif-hash')

    // 1. Verify the webhook is genuinely from Flutterwave
    if (!signature || !flw.verifyWebhookSignature(signature, rawBody)) {
      return NextResponse.json({ status: 'ignored' }, { status: 400 })
    }

    // 2. Process only successful charge events
    if (body.event === 'charge.completed' && body.data.status === 'successful') {
      const orderId = body.data.meta?.orderId
      const txId = body.data.id.toString()

      if (orderId) {
        // Async — don't block the webhook response
        escrow.holdPayment(orderId, txId).catch(console.error)
      }
    }

    return NextResponse.json({ status: 'received' })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ status: 'error' }, { status: 500 })
  }
}