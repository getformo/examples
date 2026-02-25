'use client';

import React from 'react';
import { useAccount, useDisconnect, useSignMessage } from 'wagmi';
import { useSendTransaction } from 'wagmi';
import { parseEther } from 'viem';
import { useFormo } from '@formo/analytics';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export function ConnectButton() {
  const { isConnected } = useAccount();
  const formo = useFormo();

  React.useEffect(() => {
    // Track page view
    formo?.page('Reown AppKit Example');
  }, [formo]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Connection</CardTitle>
        <CardDescription>
          Connect your wallet using Reown AppKit
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <appkit-button />
      </CardContent>
    </Card>
  );
}

export function NetworkButton() {
  const { isConnected } = useAccount();

  if (!isConnected) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Network Selection</CardTitle>
        <CardDescription>
          Switch between different networks
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <appkit-network-button />
      </CardContent>
    </Card>
  );
}

export function DisconnectButton() {
  const { isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const handleDisconnect = () => {
    disconnect();
  };

  if (!isConnected) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Disconnect Wallet</CardTitle>
        <CardDescription>
          Manually disconnect your wallet
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Button onClick={handleDisconnect} variant="destructive">
          Disconnect Wallet
        </Button>
      </CardContent>
    </Card>
  );
}

export function SignatureTest() {
  const { isConnected, address } = useAccount();
  const { signMessage, data: signature, error, isPending } = useSignMessage();

  const handleSign = () => {
    const message = 'Hello from Formo Analytics + Reown AppKit!';
    
    signMessage({ message });
  };

  if (!isConnected) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Message Signing</CardTitle>
        <CardDescription>
          Test message signing functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleSign}
          disabled={isPending}
          className="w-full"
        >
          {isPending ? 'Signing...' : 'Sign Message'}
        </Button>
        
        {signature && (
          <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
            <strong>Signature:</strong>
            <p className="break-all text-green-800">{signature}</p>
          </div>
        )}
        
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm">
            <strong>Error:</strong>
            <p className="text-red-800">{error.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TransactionTest() {
  const { isConnected, address } = useAccount();
  const { sendTransaction, data: hash, error, isPending } = useSendTransaction();

  const handleTransaction = () => {
    if (!address) return;

    const txData = {
      to: address, // Send to self for demo
      value: parseEther('0.001'), // Small amount for testing
    };

    sendTransaction(txData);
  };

  if (!isConnected) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Test</CardTitle>
        <CardDescription>
          Send a test transaction (0.001 ETH to yourself)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleTransaction}
          disabled={isPending}
          className="w-full"
          variant="secondary"
        >
          {isPending ? 'Sending...' : 'Send Test Transaction'}
        </Button>
        
        {hash && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            <strong>Transaction Hash:</strong>
            <p className="break-all text-blue-800">{hash}</p>
          </div>
        )}
        
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm">
            <strong>Error:</strong>
            <p className="text-red-800">{error.message}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}