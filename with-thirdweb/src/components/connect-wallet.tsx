'use client';

import { useAddress, useChainId, ConnectWallet as ThirdwebConnectWallet } from '@thirdweb-dev/react';
import { useEffect, useRef } from 'react';
import { useFormo } from '@formo/analytics';

export function ConnectWallet() {
  const address = useAddress();
  const chainId = useChainId();
  const formo = useFormo();
  const previousAddress = useRef<string | undefined>(undefined);

  // Handle wallet connect/disconnect events and call Formo SDK functions
  useEffect(() => {
    if (!formo) return;

    const currentAddress = address;
    const prevAddress = previousAddress.current;

    // Wallet connected (address changed from undefined/null to a value)
    if (currentAddress && !prevAddress) {
      console.log('Wallet connected, calling formo.connect()');
      
      // Identify user
      formo.identify({
        address: currentAddress,
        userId: currentAddress,
      });
      
      // Call Formo SDK connect function
      if (typeof formo.connect === 'function') {
        formo.connect({
          address: currentAddress,
          chainId: chainId || 1, // Use current chain ID or default to Ethereum mainnet
        });
      }
    }
    
    // Wallet disconnected (address changed from a value to undefined/null)
    else if (!currentAddress && prevAddress) {
      console.log('Wallet disconnected, calling formo.disconnect()');
      
      // Call Formo SDK disconnect function
      if (typeof formo.disconnect === 'function') {
        formo.disconnect({
          address: prevAddress,
        });
      }
    }

    // Update the previous address reference
    previousAddress.current = currentAddress;
  }, [address, formo, chainId]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        {address ? 'Wallet Connected' : 'Connect Your Wallet'}
      </h2>
      
      {address ? (
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Address:</span>
            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          </div>
        </div>
      ) : null}
      
      <ThirdwebConnectWallet
        theme="light"
        btnTitle="Connect Wallet"
        modalTitle="Choose a Wallet"
        className="!w-full"
      />
    </div>
  );
}
