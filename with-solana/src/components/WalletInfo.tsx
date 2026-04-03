"use client";

import { useWalletConnection, useBalance } from "@solana/react-hooks";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet } from "lucide-react";

export function WalletInfo() {
  const { wallet, status } = useWalletConnection();
  const address = status === "connected" ? wallet?.account.address?.toString() : undefined;
  const balance = useBalance(address ?? "");

  if (status !== "connected" || !wallet) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Status
          </CardTitle>
          <CardDescription>
            Connect your wallet to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-muted-foreground">
              No wallet connected. Click the button in the header to connect.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const addr = wallet.account.address.toString();
  const solBalance = balance.lamports != null
    ? (Number(balance.lamports) / 1e9).toFixed(4)
    : "...";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Wallet Connected
        </CardTitle>
        <CardDescription>
          Connected via {wallet.connector?.name || "Unknown Wallet"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Address</span>
          <code className="rounded bg-muted px-2 py-1 text-xs">
            {addr.slice(0, 8)}...{addr.slice(-8)}
          </code>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Balance</span>
          <span className="font-mono font-medium">
            {balance.fetching ? "..." : solBalance} SOL
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
