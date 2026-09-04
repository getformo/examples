"use client";

import { useEffect, useState } from "react";
import { address } from "@solana/kit";
import {
  useConnectedWallet,
  useWalletStatus,
} from "@solana/kit-plugin-wallet/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useSolanaApp } from "@/context/SolanaAppProvider";
import { SOLANA_BALANCE_CHANGED_EVENT } from "@/lib/solana";
import { Wallet } from "lucide-react";

export function WalletInfo() {
  const { client } = useSolanaApp();
  const connected = useConnectedWallet(client);
  const status = useWalletStatus(client);
  const [balance, setBalance] = useState<bigint>();
  const [fetching, setFetching] = useState(false);

  const walletAddress = connected?.account.address.toString();

  useEffect(() => {
    if (!walletAddress) {
      setBalance(undefined);
      return;
    }

    let cancelled = false;
    let requestId = 0;
    const loadBalance = () => {
      const currentRequestId = ++requestId;
      setFetching(true);
      client.rpc
        .getBalance(address(walletAddress))
        .send()
        .then((response) => {
          if (!cancelled && currentRequestId === requestId) {
            setBalance(response.value);
          }
        })
        .catch(() => {
          if (!cancelled && currentRequestId === requestId) {
            setBalance(undefined);
          }
        })
        .finally(() => {
          if (!cancelled && currentRequestId === requestId) {
            setFetching(false);
          }
        });
    };

    loadBalance();
    window.addEventListener(SOLANA_BALANCE_CHANGED_EVENT, loadBalance);

    return () => {
      cancelled = true;
      window.removeEventListener(SOLANA_BALANCE_CHANGED_EVENT, loadBalance);
    };
  }, [client, walletAddress]);

  if (status !== "connected" || !connected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Status
          </CardTitle>
          <CardDescription>Connect your wallet to get started</CardDescription>
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

  const solBalance =
    balance === undefined ? "..." : (Number(balance) / 1e9).toFixed(4);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Wallet Connected
        </CardTitle>
        <CardDescription>Connected via {connected.wallet.name}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Address</span>
          <code className="rounded bg-muted px-2 py-1 text-xs">
            {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-8)}
          </code>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Balance</span>
          <span className="font-mono font-medium">
            {fetching ? "..." : solBalance} SOL
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
