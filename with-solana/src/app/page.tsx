"use client";

import { WalletInfo } from "@/components/WalletInfo";
import {
  SendTransaction,
  SendVersionedTransaction,
  SignMessage,
  SignTransaction,
  CustomEvents,
} from "@/components/demos";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from "@solana/wallet-adapter-react";

export default function Home() {
  const { connected } = useWallet();

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
          Test the Formo Analytics SDK integration with Solana wallet adapter.
          Try wallet connections, message signing, and transactions to see events tracked in real-time.
        </p>
      </div>

      {/* Wallet Info Card */}
      <WalletInfo />

      {/* Demo Sections */}
      {connected && (
        <Tabs defaultValue="transactions" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="signing">Signing</TabsTrigger>
            <TabsTrigger value="events">Custom Events</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <SendTransaction />
              <SendVersionedTransaction />
            </div>
          </TabsContent>

          <TabsContent value="signing" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <SignMessage />
              <SignTransaction />
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
            <li>Make sure you're on Devnet (change in header if needed)</li>
            <li>Request an airdrop to get test SOL</li>
            <li>Try the transaction and signing demos</li>
            <li>Check the browser console for Formo SDK events</li>
          </ol>
        </div>
      )}

    </div>
  );
}
