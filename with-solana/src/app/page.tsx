"use client";

import { WalletInfo } from "@/components/WalletInfo";
import { SendTransaction, CustomEvents } from "@/components/demos";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useConnectedWallet,
  useWalletStatus,
} from "@solana/kit-plugin-wallet/react";
import { useSolanaApp } from "@/context/SolanaAppProvider";

export default function Home() {
  const { client } = useSolanaApp();
  const status = useWalletStatus(client);
  const wallet = useConnectedWallet(client);
  const connected = status === "connected" && wallet !== null;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          <span className="bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent">
            Formo + Solana
          </span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Test Formo Wallet Standard autocapture with the modern Solana Kit
          stack. Try wallet connections and transactions to see events in
          real-time.
        </p>
      </div>

      {/* Wallet Info Card */}
      <WalletInfo />

      {/* Demo Sections */}
      {connected && (
        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="events">Custom Events</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            <div className="grid gap-4">
              <SendTransaction />
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <CustomEvents />
          </TabsContent>
        </Tabs>
      )}

      {/* Getting Started Section (when not connected) */}
      {!connected && (
        <div className="rounded-lg border bg-card p-8 text-center space-y-4">
          <h2 className="text-xl font-semibold">Get Started</h2>
          <ol className="text-sm text-muted-foreground space-y-2 max-w-md mx-auto text-left list-decimal list-inside">
            <li>Click "Select Wallet" in the header to connect your Solana wallet</li>
            <li>Make sure you're on Devnet (configure via NEXT_PUBLIC_SOLANA_CLUSTER)</li>
            <li>Fund your wallet with test SOL</li>
            <li>Try the transaction demos</li>
            <li>Check the browser console for Formo SDK events</li>
          </ol>
        </div>
      )}

    </div>
  );
}
