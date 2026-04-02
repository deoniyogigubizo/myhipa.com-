import { HardhatUserConfig } from 'hardhat/config'
import '@nomicfoundation/hardhat-toolbox'

const config: HardhatUserConfig = {
  solidity: '0.8.20',
  networks: {
    // Mumbai testnet first — free test MATIC from faucet.polygon.technology
    mumbai: {
      url:      'https://rpc-mumbai.maticvigil.com',
      accounts: [process.env.DEPLOYER_PRIVATE_KEY!],
      chainId:  80001,
    },
    // Polygon mainnet — only when ready for production
    polygon: {
      url:      'https://polygon-rpc.com',
      accounts: [process.env.DEPLOYER_PRIVATE_KEY!],
      chainId:  137,
    },
  },
}

export default config