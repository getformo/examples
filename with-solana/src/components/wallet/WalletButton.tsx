"use client";

import { useState } from "react";
import {
  useConnect,
  useConnectedWallet,
  useDisconnect,
  useWallets,
  useWalletStatus,
} from "@solana/kit-plugin-wallet/react";
import { Button } from "@/components/ui/button";
import { useSolanaApp } from "@/context/SolanaAppProvider";
import { ChevronDown, Loader2, LogOut, Wallet } from "lucide-react";
import { toast } from "sonner";

export function WalletButton() {
  const { client } = useSolanaApp();
  const wallets = useWallets(client);
  const connected = useConnectedWallet(client);
  const status = useWalletStatus(client);
  const connect = useConnect(client);
  const disconnect = useDisconnect(client);
  const [showDropdown, setShowDropdown] = useState(false);
  const actionError = connect.error ?? disconnect.error;

  const onDisconnect = async () => {
    try {
      await disconnect.dispatchAsync();
    } catch (error) {
      toast.error("Could not disconnect wallet", {
        description: String(error),
      });
    }
  };

  const onConnect = async (wallet: (typeof wallets)[number]) => {
    try {
      await connect.dispatchAsync(wallet);
      setShowDropdown(false);
    } catch {
      // The mutation error remains visible in the open wallet menu.
    }
  };

  if (status === "connecting" || status === "reconnecting") {
    return (
      <Button variant="gradient" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Connecting...
      </Button>
    );
  }

  if (connected) {
    const address = connected.account.address.toString();
    return (
      <Button
        variant="outline"
        size="sm"
        className="font-mono text-xs"
        onClick={() => void onDisconnect()}
        disabled={disconnect.isRunning}
        title="Disconnect wallet"
      >
        {address.slice(0, 4)}...{address.slice(-4)}
        <LogOut className="ml-2 h-3 w-3" />
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="gradient"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <Wallet className="mr-2 h-4 w-4" />
        Select Wallet
        <ChevronDown className="ml-2 h-3 w-3" />
      </Button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-lg border bg-card p-2 shadow-lg">
            {wallets.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                No wallets found. Install a Wallet Standard extension.
              </p>
            )}
            {wallets.map((wallet) => (
              <button
                key={wallet.name}
                onClick={() => void onConnect(wallet)}
                disabled={connect.isRunning}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors hover:bg-muted disabled:opacity-50"
              >
                {wallet.icon && (
                  <img
                    src={wallet.icon}
                    alt={wallet.name}
                    className="h-5 w-5 rounded"
                  />
                )}
                <span>{wallet.name}</span>
              </button>
            ))}
            {actionError != null && (
              <p className="px-3 py-2 text-xs text-destructive">
                {String(actionError)}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
