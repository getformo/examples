import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { mainnet, arbitrum, polygon, base, optimism, sepolia, type AppKitNetwork } from '@reown/appkit/networks';

// Get projectId from environment variables
export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID;

if (!projectId) {
  throw new Error('Project ID is not defined. Please set NEXT_PUBLIC_REOWN_PROJECT_ID in your environment variables.');
}

export const metadata = {
  name: 'Formo Analytics - Reown AppKit Example',
  description: 'Example app demonstrating Reown AppKit integration with Formo Analytics SDK',
  url: 'https://formo.so', // origin must match your domain & subdomain
  icons: ['https://formo.so/favicon.ico']
};

// Define the networks - including sepolia for testing
export const networks = [mainnet, arbitrum, polygon, base, optimism, sepolia] as [AppKitNetwork, ...AppKitNetwork[]];

// Set up the Wagmi Adapter (Config) - simplified like official example
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks
});

export const config = wagmiAdapter.wagmiConfig;