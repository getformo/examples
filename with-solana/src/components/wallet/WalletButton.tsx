"use client";

import { useState } from "react";
import { useWalletConnection } from "@solana/react-hooks";
import { Button } from "@/components/ui/button";
import { Loader2, Wallet, LogOut, ChevronDown } from "lucide-react";

export function WalletButton() {
  const { connectors, connect, disconnect, wallet, status } = useWalletConnection();
  const [showDropdown, setShowDropdown] = useState(false);

  if (status === "connecting") {
    return (
      <Button variant="gradient" disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Connecting...
      </Button>
    );
  }

  if (status === "connected" && wallet) {
    const addr = wallet.account.address.toString();
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="font-mono text-xs"
          onClick={() => disconnect()}
          title="Disconnect wallet"
        >
          {addr.slice(0, 4)}...{addr.slice(-4)}
          <LogOut className="ml-2 h-3 w-3" />
        </Button>
      </div>
    );
  }

  // Disconnected — show wallet selector
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
            {connectors.length === 0 && (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                No wallets found. Install a Solana wallet extension.
              </p>
            )}
            {connectors.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  connect(c.id);
                  setShowDropdown(false);
                }}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors"
              >
                {c.icon && (
                  <img src={c.icon} alt={c.name} className="h-5 w-5 rounded" />
                )}
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
