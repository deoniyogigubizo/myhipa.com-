import { Worker, Job } from 'bullmq'
import { Order } from '../lib/database/schemas'
import { EscrowService, EscrowStatus } from '../lib/payments/escrow'

// Create the worker
const worker = new Worker('escrow', async (job: Job) => {
  switch (job.name) {
    case 'auto-release':
      return handleAutoRelease(job.data.orderId)

    case 'expire-unpaid-order':
      return handleExpireOrder(job.data.orderId)

    case 'check-ship-sla':
      return handleShipSLA(job.data.orderId)

    default:
      throw new Error(`Unknown job type: ${job.name}`)
  }
}, {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
})

async function handleAutoRelease(orderId: string) {
  const order = await Order.findById(orderId)
  if (!order) return
  if (order.status !== EscrowStatus.DISPUTE_WINDOW) return
  if (new Date() < order.autoReleaseAt) return // not yet

  const escrowService = new EscrowService({} as any) // TODO: proper dependency injection
  await escrowService.releaseFunds(orderId, 'auto_release')
}

async function handleExpireOrder(orderId: string) {
  const order = await Order.findById(orderId)
  if (!order || order.status !== EscrowStatus.PENDING_PAYMENT) return

  await Order.findByIdAndUpdate(orderId, {
    status: EscrowStatus.CANCELLED,
    $push: { statusHistory: { status: EscrowStatus.CANCELLED, at: new Date() }}
  })
}

async function handleShipSLA(orderId: string) {
  const order = await Order.findById(orderId)
  if (!order || order.status !== EscrowStatus.SELLER_PROCESSING) return
  // Seller missed shipping deadline — alert them and flag for buyer
  // TODO: Implement notification system
}

// Error handling
worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} failed with error:`, err)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  await worker.close()
  process.exit(0)
})

process.on('SIGINT', async () => {
  await worker.close()
  process.exit(0)
})

console.log('Escrow worker started')