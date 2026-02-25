import { createAppKit } from '@reown/appkit/react';
import { wagmiAdapter, projectId, networks, metadata } from './wagmi';

if (!projectId) {
  throw new Error('Project ID is not defined. Please set NEXT_PUBLIC_REOWN_PROJECT_ID in your environment variables.');
}

console.log('🔧 Initializing AppKit with Project ID:', projectId);

const generalConfig = {
  projectId,
  networks,
  metadata,
  themeMode: 'light' as const,
  themeVariables: {
    '--w3m-accent': '#00D4AA',
  }
};

// Create modal - following official example pattern
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  ...generalConfig,
  features: {
    analytics: true // Enable analytics - defaults to your Cloud configuration
  }
});

console.log('✅ AppKit modal created successfully');