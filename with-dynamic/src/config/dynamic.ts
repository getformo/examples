import { EthereumWalletConnectors } from '@dynamic-labs/ethereum'

// Dynamic.xyz environment ID from dashboard
// Get your environment ID at https://app.dynamic.xyz
export const DYNAMIC_ENVIRONMENT_ID = import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID || 'REPLACE_WITH_YOUR_ENVIRONMENT_ID'

// Wallet connectors configuration for Dynamic
export const walletConnectors = [EthereumWalletConnectors]
