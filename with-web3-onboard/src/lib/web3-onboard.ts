import Onboard from '@web3-onboard/core'
import injectedModule from '@web3-onboard/injected-wallets'
import metamaskModule from '@web3-onboard/metamask'
import coinbaseModule from '@web3-onboard/coinbase'
import walletConnectModule from '@web3-onboard/walletconnect'

// Initialize wallet modules
const injected = injectedModule()
const metamask = metamaskModule({ options: {} })
const coinbase = coinbaseModule({ darkMode: false })

// WalletConnect configuration
const walletConnect = walletConnectModule({
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id',
  requiredChains: [1, 137, 10, 8453],
  optionalChains: [1, 137, 10, 8453, 42161, 56],
  dappUrl: 'https://formo-example-web3-onboard.vercel.app'
})

// Supported chains configuration
const chains = [
  {
    id: '0x1',
    token: 'ETH',
    label: 'Ethereum Mainnet',
    namespace: 'evm' as const,
    rpcUrl: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'
  },
  {
    id: '0x89',
    token: 'MATIC',
    label: 'Polygon',
    namespace: 'evm' as const,
    rpcUrl: 'https://polygon-rpc.com'
  },
  {
    id: '0xa',
    token: 'ETH',
    label: 'Optimism',
    namespace: 'evm' as const,
    rpcUrl: 'https://mainnet.optimism.io'
  },
  {
    id: '0x2105',
    token: 'ETH',
    label: 'Base',
    namespace: 'evm' as const,
    rpcUrl: 'https://mainnet.base.org'
  }
]

// App metadata
const appMetadata = {
  name: 'Formo Web3 Onboard Example',
  icon: '<svg>...</svg>',
  description: 'Example app demonstrating Formo Analytics with Web3 Onboard',
  recommendedInjectedWallets: [
    { name: 'MetaMask', url: 'https://metamask.io' },
    { name: 'Coinbase', url: 'https://wallet.coinbase.com/' }
  ]
}

// Initialize Web3 Onboard
export const web3Onboard = Onboard({
  wallets: [metamask, coinbase, walletConnect, injected],
  chains,
  appMetadata,
  connect: {
    autoConnectLastWallet: true
  },
  accountCenter: {
    desktop: {
      position: 'topRight',
      enabled: true,
      minimal: false
    },
    mobile: {
      position: 'topRight',
      enabled: true,
      minimal: false
    }
  }
})

export default web3Onboard
