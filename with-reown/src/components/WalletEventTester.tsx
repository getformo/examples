'use client';

import { useState } from 'react';
import { useDisconnect, useAppKit, useAppKitNetwork, useAppKitAccount } from '@reown/appkit/react';
import { type Address } from 'viem';
import { useSendTransaction, useSignMessage } from 'wagmi';
import { networks } from '~/config/wagmi';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

// Test transaction - 0 value transfer to self
const TEST_TRANSACTION = {
  value: BigInt(0) // 0 ETH transfer
};

export function WalletEventTester() {
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);
  
  // Use hooks normally - AppKit should be initialized by now
  const { disconnect } = useDisconnect();
  const { open } = useAppKit();
  const { switchNetwork, chainId } = useAppKitNetwork();
  const { address, isConnected } = useAppKitAccount();

  const { sendTransaction, isPending: isSendingTransaction } = useSendTransaction();
  const { signMessageAsync, isPending: isSigningMessage } = useSignMessage();

  // Handle wallet disconnection
  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true);
      await disconnect();
    } catch (error) {
      console.error('Disconnection Error:', error);
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Handle network switching
  const handleSwitchNetwork = async () => {
    try {
      setIsSwitchingNetwork(true);
      const targetNetwork = networks[1]; // Switch to Arbitrum
      await switchNetwork(targetNetwork);
    } catch (error) {
      console.error('Network Switch Error:', error);
    } finally {
      setIsSwitchingNetwork(false);
    }
  };

  // Handle message signing
  const handleSignMessage = async () => {
    try {
      const message = "Hello from Formo Analytics + Reown AppKit!";
      
      const signature = await signMessageAsync({ 
        message, 
        account: address as Address 
      });
      
      console.log('Signature received successfully:', signature);
    } catch (error) {
      console.error('Signing Error:', error);
    }
  };

  // Handle transaction sending
  const handleSendTransaction = async () => {
    try {
      if (!address) return;
      
      const transactionData = {
        to: address as `0x${string}`, // Send to self
        value: TEST_TRANSACTION.value
      };
      
      sendTransaction(transactionData);
    } catch (error) {
      console.error('Transaction Error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet Connection</CardTitle>
          <CardDescription>
            Test wallet connection and disconnection events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 items-center">
            {!isConnected ? (
              <appkit-button />
            ) : (
              <Button 
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                variant="destructive"
              >
                {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
              </Button>
            )}
          </div>
          
          {isConnected && address && (
            <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
              <strong>Connected:</strong> {address.slice(0, 6)}...{address.slice(-4)}
              <br />
              <strong>Chain ID:</strong> {chainId}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Network Controls */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Network Operations</CardTitle>
            <CardDescription>
              Test network switching events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleSwitchNetwork}
              disabled={isSwitchingNetwork}
              variant="secondary"
            >
              {isSwitchingNetwork ? 'Switching...' : 'Switch to Arbitrum'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Transaction Controls */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Wallet Interactions</CardTitle>
            <CardDescription>
              Test signing and transaction events
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={handleSignMessage}
                disabled={isSigningMessage}
                variant="secondary"
              >
                {isSigningMessage ? 'Signing...' : 'Sign Message'}
              </Button>
              
              <Button 
                onClick={handleSendTransaction}
                disabled={isSendingTransaction}
                variant="secondary"
              >
                {isSendingTransaction ? 'Sending...' : 'Send Test Transaction (0 ETH to self)'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
