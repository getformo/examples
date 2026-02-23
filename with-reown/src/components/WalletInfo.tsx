'use client';

import React from 'react';
import { useAccount, useBalance, useChainId } from 'wagmi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export function WalletInfo() {
  const { address, isConnected, connector } = useAccount();
  const chainId = useChainId();
  const { data: balance } = useBalance({
    address,
  });

  if (!isConnected || !address) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wallet Information</CardTitle>
          <CardDescription>
            Connect your wallet to view information
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet Information</CardTitle>
        <CardDescription>
          Current wallet connection details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div>
            <strong className="text-sm font-medium">Address:</strong>
            <p className="text-sm font-mono break-all text-muted-foreground">
              {address}
            </p>
          </div>
          
          <div>
            <strong className="text-sm font-medium">Connector:</strong>
            <p className="text-sm text-muted-foreground">
              {connector?.name || 'Unknown'}
            </p>
          </div>
          
          <div>
            <strong className="text-sm font-medium">Chain ID:</strong>
            <p className="text-sm text-muted-foreground">
              {chainId}
            </p>
          </div>
          
          {balance && (
            <div>
              <strong className="text-sm font-medium">Balance:</strong>
              <p className="text-sm text-muted-foreground">
                {parseFloat(balance.formatted).toFixed(6)} {balance.symbol}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}