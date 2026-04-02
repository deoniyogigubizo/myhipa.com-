import { ethers } from 'ethers'

// ABI — only the functions we need
const ESCROW_ABI = [
  'function createEscrow(string orderId, uint256 amount, string currency) external',
  'function releaseEscrow(string orderId, string releaseType) external',
  'function disputeEscrow(string orderId, string reason) external',
  'function resolveDispute(string orderId, string resolution) external',
  'function getEscrow(string orderId) external view returns (tuple(string,address,address,uint256,string,uint8,uint256,uint256,string,string))',
  'event EscrowCreated(string indexed orderId, uint256 amount, string currency, uint256 timestamp)',
  'event EscrowReleased(string indexed orderId, string releaseType, uint256 timestamp)',
]

export class BlockchainService {
  private provider: ethers.JsonRpcProvider | null = null
  private wallet: ethers.Wallet | null = null
  private contract: ethers.Contract | null = null

  constructor() {
    // Only initialize if environment variables are set
    if (process.env.BLOCKCHAIN_PRIVATE_KEY && process.env.ESCROW_CONTRACT_ADDRESS) {
      // Connect to Polygon network
      this.provider = new ethers.JsonRpcProvider(
        process.env.POLYGON_RPC_URL ?? 'https://rpc-mumbai.maticvigil.com'
      )

      // The Hipa backend wallet — holds MATIC for gas fees
      // Store private key securely in AWS Secrets Manager, never in code
      this.wallet = new ethers.Wallet(
        process.env.BLOCKCHAIN_PRIVATE_KEY,
        this.provider
      )

      // Connect to the deployed contract
      this.contract = new ethers.Contract(
        process.env.ESCROW_CONTRACT_ADDRESS,
        ESCROW_ABI,
        this.wallet
      )
    }
  }

  async recordEscrowCreated(data: {
    orderId: string
    buyerId: string
    sellerId: string
    amount: number
    currency: string
    txHash?: string | null
  }): Promise<string> {
    if (!this.contract) {
      console.log('Blockchain not initialized, skipping escrow creation record')
      return ''
    }

    try {
      // amount is in smallest unit (e.g. RWF cents)
      const tx = await this.contract.createEscrow(
        data.orderId,
        BigInt(data.amount),
        data.currency
      )
      // Wait for 1 confirmation (fast on Polygon)
      const receipt = await tx.wait(1)
      console.log(`Escrow created on-chain: ${receipt.hash}`)
      return receipt.hash
    } catch (error) {
      console.error('Failed to record escrow creation on blockchain:', error)
      throw error
    }
  }

  async recordEscrowReleased(data: {
    orderId: string
    releaseType: string
    amount: number
    sellerId: string
  }): Promise<string> {
    if (!this.contract) {
      console.log('Blockchain not initialized, skipping escrow release record')
      return ''
    }

    try {
      const tx = await this.contract.releaseEscrow(data.orderId, data.releaseType)
      const receipt = await tx.wait(1)
      console.log(`Escrow released on-chain: ${receipt.hash}`)
      return receipt.hash
    } catch (error) {
      console.error('Failed to record escrow release on blockchain:', error)
      throw error
    }
  }

  async recordEscrowDisputed(orderId: string, reason: string): Promise<string> {
    if (!this.contract) {
      console.log('Blockchain not initialized, skipping escrow dispute record')
      return ''
    }

    try {
      const tx = await this.contract.disputeEscrow(orderId, reason)
      const receipt = await tx.wait(1)
      return receipt.hash
    } catch (error) {
      console.error('Failed to record dispute on blockchain:', error)
      throw error
    }
  }

  // Public verification — anyone can call this to verify an order
  async verifyEscrow(orderId: string) {
    if (!this.contract) {
      console.log('Blockchain not initialized, skipping escrow verification')
      return null
    }

    try {
      const record = await this.contract.getEscrow(orderId)
      const stateNames = ['Created', 'Released', 'Refunded', 'Disputed', 'Resolved']
      return {
        orderId: record[0],
        amount: record[3].toString(),
        currency: record[4],
        state: stateNames[record[5]] ?? 'Unknown',
        createdAt: new Date(Number(record[6]) * 1000).toISOString(),
        updatedAt: new Date(Number(record[7]) * 1000).toISOString(),
        releaseType: record[8],
      }
    } catch (error) {
      console.error('Failed to verify escrow on blockchain:', error)
      return null
    }
  }

  // Estimate gas cost before calling — useful for monitoring
  async estimateGasCost(): Promise<string> {
    if (!this.provider) {
      console.log('Blockchain not initialized, skipping gas cost estimation')
      return 'unknown'
    }

    try {
      const gasPrice = await this.provider.getFeeData()
      const gasLimit = 100000n // conservative estimate for simple state changes
      const gasCostWei = gasPrice.gasPrice! * gasLimit
      const gasCostMatic = ethers.formatEther(gasCostWei)
      return `${gasCostMatic} MATIC`
    } catch {
      return 'unknown'
    }
  }
}