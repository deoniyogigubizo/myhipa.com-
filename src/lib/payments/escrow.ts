import { Order, Transaction, Seller, User } from '../database/schemas'
import { Queue } from 'bullmq'
import { FlutterwaveService } from './flutterwave'
import { BlockchainService } from './blockchain'

export enum EscrowStatus {
  PENDING_PAYMENT    = 'pending_payment',
  PAYMENT_HELD       = 'payment_held',
  SELLER_PROCESSING  = 'seller_processing',
  IN_DELIVERY        = 'in_delivery',
  DISPUTE_WINDOW     = 'dispute_window',
  COMPLETED          = 'completed',
  DISPUTED           = 'disputed',
  REFUNDED           = 'refunded',
  CANCELLED          = 'cancelled',
}

export class EscrowService {
  private escrowQueue: Queue
  private blockchain: BlockchainService

  constructor(
    private flw: FlutterwaveService,
  ) {
    // Initialize BullMQ queue
    this.escrowQueue = new Queue('escrow', {
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    })

    // Initialize blockchain service
    this.blockchain = new BlockchainService()
  }

  // ── STEP A: Buyer initiates checkout ──────────────────────────
  async createEscrowOrder(input: {
    buyerId:    string
    items:      any[]
    sellerId:   string
    total:      number
    currency:   string
    address:    any
  }) {
    // 1. Calculate fees
    const seller = await Seller.findById(input.sellerId)
    const feeRate    = seller?.feeRate ?? 0.05
    const hipaFee    = Math.round(input.total * feeRate)
    const sellerPayout = input.total - hipaFee

    // 2. Create order document in pending state
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`
    const order = await Order.create({
      orderNumber,
      buyerId:    input.buyerId,
      sellerId:   input.sellerId,
      items:      input.items,
      pricing:    { total: input.total, hipaFee, sellerPayout, currency: input.currency },
      delivery:   { address: input.address },
      status:     EscrowStatus.PENDING_PAYMENT,
      statusHistory: [{ status: EscrowStatus.PENDING_PAYMENT, at: new Date() }],
    })

    // 3. Create transaction ledger entry (the escrow record)
    await Transaction.create({
      orderId:      order._id,
      buyerId:      input.buyerId,
      sellerId:     input.sellerId,
      amount:       input.total,
      hipaFee,
      sellerPayout,
      currency:     input.currency,
      escrow: {
        status:   'held',
        heldAt:   null,
        releasedAt: null,
      }
    })

    // 4. Get buyer info for payment link
    const buyer = await User.findById(input.buyerId)

    // 5. Create Flutterwave payment link
    const payment = await this.flw.initiatePayment({
      amount:      input.total,
      currency:    input.currency,
      email:       buyer.email,
      phone:       buyer.phone ?? '',
      name:        buyer.profile?.displayName ?? buyer.email,
      orderId:     order._id.toString(),
      redirectUrl: `${process.env.WEB_URL}/orders/${order._id}?payment_callback=1`,
    })

    // 6. Schedule order expiry — cancel if buyer never pays within 30 min
    await this.escrowQueue.add(
      'expire-unpaid-order',
      { orderId: order._id.toString() },
      { delay: 30 * 60 * 1000, jobId: `expire:${order._id}` }
    )

    return { order, paymentLink: payment.paymentLink, txRef: payment.txRef }
  }

  // ── STEP B: Payment gateway confirms payment ──────────────────
  async holdPayment(orderId: string, gatewayTransactionId: string) {
    // 1. Verify with Flutterwave that payment actually happened
    const verification = await this.flw.verifyPayment(gatewayTransactionId)
    if (!verification.verified) {
      throw new Error('Payment verification failed')
    }

    const order = await Order.findById(orderId)
    if (!order || order.status !== EscrowStatus.PENDING_PAYMENT) {
      throw new Error('Order not in expected state')
    }

    // 2. Verify amount matches — CRITICAL security check
    if (verification.amount !== order.pricing.total) {
      console.error(`Amount mismatch: expected ${order.pricing.total}, got ${verification.amount}`)
      throw new Error('Payment amount mismatch')
    }

    const now = new Date()
    const shipDeadline = new Date(now.getTime() + 48 * 60 * 60 * 1000) // 48 hours

    // 3. Update order to HELD state
    await Order.findByIdAndUpdate(orderId, {
      status: EscrowStatus.PAYMENT_HELD,
      sellerShipDeadline: shipDeadline,
      $push: { statusHistory: { status: EscrowStatus.PAYMENT_HELD, at: now } }
    })

    // 4. Update transaction ledger
    const tx = await Transaction.findOneAndUpdate(
      { orderId },
      {
        'escrow.status':       'held',
        'escrow.heldAt':       now,
        'payment.gatewayRef':  gatewayTransactionId,
        'payment.verifiedAt':  now,
      },
      { new: true }
    )

    // 5. Cancel the order-expiry job since payment succeeded
    const expiryJob = await this.escrowQueue.getJob(`expire:${orderId}`)
    if (expiryJob) await expiryJob.remove()

    // 6. Add seller wallet pending amount
    await Seller.findByIdAndUpdate(order.sellerId, {
      $inc: { 'wallet.pending': tx.sellerPayout }
    })

    // 7. Record on blockchain (async, non-blocking)
    this.blockchain.recordEscrowCreated({
      orderId: orderId,
      buyerId: order.buyerId.toString(),
      sellerId: order.sellerId.toString(),
      amount: order.pricing.total,
      currency: order.pricing.currency,
    }).then(hash => {
      Transaction.findOneAndUpdate({ orderId }, { 'blockchain.createTxHash': hash })
    }).catch(err => console.error('Blockchain record failed (non-critical):', err))

    // 8. Schedule SLA breach alert
    await this.escrowQueue.add(
      'check-ship-sla',
      { orderId },
      { delay: 48 * 60 * 60 * 1000, jobId: `sla:${orderId}` }
    )

    return tx
  }

  // ── STEP C: Seller marks as shipped ──────────────────────────
  async markShipped(orderId: string, sellerId: string, tracking: {
    number: string, courier: string, proofUrl: string
  }) {
    const order = await Order.findOne({ _id: orderId, sellerId })
    if (!order) throw new Error('Order not found')
    if (order.status !== EscrowStatus.SELLER_PROCESSING) {
      throw new Error('Order must be in processing state')
    }

    const now = new Date()
    // Cancel SLA job since seller shipped
    const slaJob = await this.escrowQueue.getJob(`sla:${orderId}`)
    if (slaJob) await slaJob.remove()

    await Order.findByIdAndUpdate(orderId, {
      status: EscrowStatus.IN_DELIVERY,
      'delivery.tracking': { ...tracking, uploadedAt: now },
      $push: { statusHistory: { status: EscrowStatus.IN_DELIVERY, at: now } }
    })
  }

  // ── STEP D: Mark delivered, open dispute window ───────────────
  async markDelivered(orderId: string) {
    const order = await Order.findById(orderId)
    if (!order) throw new Error('Order not found')

    const now = new Date()
    const disputeWindowEnd = new Date(now.getTime() + 72 * 60 * 60 * 1000) // 72 hours

    await Order.findByIdAndUpdate(orderId, {
      status:          EscrowStatus.DISPUTE_WINDOW,
      disputeWindowEnd,
      autoReleaseAt:   disputeWindowEnd,
      'delivery.deliveredAt': now,
      $push: { statusHistory: { status: EscrowStatus.DISPUTE_WINDOW, at: now } }
    })

    // Schedule auto-release after 72h
    await this.escrowQueue.add(
      'auto-release',
      { orderId },
      {
        delay:  72 * 60 * 60 * 1000,
        jobId: `autorelease:${orderId}`,
      }
    )
  }

  // ── STEP E: Buyer confirms receipt ────────────────────────────
  async buyerConfirm(orderId: string, buyerId: string) {
    const order = await Order.findOne({ _id: orderId, buyerId })
    if (!order) throw new Error('Order not found')
    if (order.status !== EscrowStatus.DISPUTE_WINDOW) {
      throw new Error('Cannot confirm — order not in dispute window')
    }

    // Cancel auto-release job
    const job = await this.escrowQueue.getJob(`autorelease:${orderId}`)
    if (job) await job.remove()

    // Release funds immediately
    await this.releaseFunds(orderId, 'buyer_confirm')
  }

  // ── STEP F: Core release function ────────────────────────────
  async releaseFunds(orderId: string, releaseType: 'buyer_confirm' | 'auto_release' | 'admin') {
    const order = await Order.findById(orderId)
    const tx    = await Transaction.findOne({ orderId })
    const now   = new Date()

    // 1. Update transaction record
    await Transaction.findOneAndUpdate({ orderId }, {
      'escrow.status':      'released',
      'escrow.releasedAt':  now,
      'escrow.releaseType': releaseType,
    })

    // 2. Complete the order
    await Order.findByIdAndUpdate(orderId, {
      status:      EscrowStatus.COMPLETED,
      completedAt: now,
      $push: { statusHistory: { status: EscrowStatus.COMPLETED, at: now } }
    })

    // 3. Move money in seller wallet ledger
    await Seller.findByIdAndUpdate(order.sellerId, {
      $inc: {
        'wallet.available': tx.sellerPayout,
        'wallet.pending':  -tx.sellerPayout,
      }
    })

    // 4. Record release on blockchain
    this.blockchain.recordEscrowReleased({
      orderId,
      releaseType,
      amount: tx.sellerPayout,
      sellerId: order.sellerId.toString(),
    }).then(hash => {
      Transaction.findOneAndUpdate({ orderId }, { 'blockchain.releaseTxHash': hash })
    }).catch(err => console.error('Blockchain release record failed:', err))

    console.log(`Escrow released: order=${orderId} type=${releaseType} amount=${tx.sellerPayout}`)
  }

  // ── STEP G: Buyer raises dispute ──────────────────────────────
  async raiseDispute(orderId: string, buyerId: string, reason: string, evidence: string[]) {
    const order = await Order.findOne({ _id: orderId, buyerId })
    if (!order) throw new Error('Order not found')
    if (order.status !== EscrowStatus.DISPUTE_WINDOW) {
      throw new Error('Dispute window is closed')
    }

    const now = new Date()

    // Cancel auto-release — funds stay frozen
    const job = await this.escrowQueue.getJob(`autorelease:${orderId}`)
    if (job) await job.remove()

    await Order.findByIdAndUpdate(orderId, {
      status: EscrowStatus.DISPUTED,
      $push: { statusHistory: { status: EscrowStatus.DISPUTED, at: now } }
    })

    await Transaction.findOneAndUpdate({ orderId }, {
      'escrow.status':  'frozen',
      'dispute.raised': true,
      'dispute.raisedAt': now,
      'dispute.reason': reason,
      'dispute.evidence': evidence,
    })
  }

  // ── STEP H: Admin resolves dispute ────────────────────────────
  async adminResolve(orderId: string, resolution: {
    type:           'full_refund' | 'full_release' | 'partial',
    buyerRefundPct: number,
    adminId:        string,
    note:           string,
  }) {
    const tx  = await Transaction.findOne({ orderId })
    const now = new Date()

    const buyerRefund    = Math.round(tx.amount * (resolution.buyerRefundPct / 100))
    const sellerReceives = tx.amount - buyerRefund - tx.hipaFee

    await Transaction.findOneAndUpdate({ orderId }, {
      'dispute.adminId':       resolution.adminId,
      'dispute.resolution':    resolution.type,
      'dispute.adminNote':     resolution.note,
      'dispute.buyerRefund':   buyerRefund,
      'dispute.sellerReceived': sellerReceives,
      'dispute.resolvedAt':    now,
      'escrow.status':         'resolved',
      'escrow.releasedAt':     now,
      'escrow.releaseType':    'admin',
    })

    await Order.findByIdAndUpdate(orderId, {
      status: EscrowStatus.COMPLETED,
      completedAt: now,
      $push: { statusHistory: { status: EscrowStatus.COMPLETED, at: now } }
    })

    // Process payouts
    if (sellerReceives > 0) {
      await Seller.findByIdAndUpdate(
        (await Order.findById(orderId)).sellerId,
        { $inc: { 'wallet.available': sellerReceives, 'wallet.pending': -sellerReceives } }
      )
    }

    if (buyerRefund > 0) {
      await User.findByIdAndUpdate(
        (await Order.findById(orderId)).buyerId,
        { $inc: { 'wallet.balance': buyerRefund }}
      )
    }
  }
}