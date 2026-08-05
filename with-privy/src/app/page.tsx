"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { UserPill } from "@privy-io/react-auth/ui";
import { useSetActiveWallet } from "@privy-io/wagmi";
import { useAccount, useBalance, useChainId, useSignMessage, useSendTransaction } from "wagmi";
import { formatUnits } from "viem";
import { useFormo } from "@formo/analytics";
import { useState, useEffect, useRef } from "react";
import { LinkedAccounts } from "@/components/LinkedAccounts";

export default function Home() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { setActiveWallet } = useSetActiveWallet();
  const { address, isConnected, connector } = useAccount();
  const chainId = useChainId();
  const formo = useFormo();

  const { data: balance } = useBalance({
    address,
    query: { enabled: !!address },
  });

  // Sign message hook - Formo auto-tracks via wagmi
  const { signMessage, isPending: isSignPending } = useSignMessage();

  // Send transaction hook - Formo auto-tracks via wagmi
  const { sendTransaction, isPending: isTxPending } = useSendTransaction();

  // Local state for custom event tracking
  const [customEventName, setCustomEventName] = useState("");
  const [customEventSent, setCustomEventSent] = useState(false);

  // Track previous auth state to detect logout
  const prevAuthRef = useRef<{ authenticated: boolean; address?: string; chainId?: number }>({
    authenticated: false,
  });

  // Bridge Privy logout to Formo disconnect event
  // Privy's logout doesn't trigger wagmi's disconnect status, so we manually track it
  useEffect(() => {
    const prev = prevAuthRef.current;

    // Detect logout: was authenticated, now not authenticated
    if (prev.authenticated && !authenticated && prev.address && formo) {
      formo.disconnect({
        address: prev.address,
        chainId: prev.chainId,
      });
    }

    // Update ref with current state
    prevAuthRef.current = {
      authenticated,
      address,
      chainId,
    };
  }, [authenticated, address, chainId, formo]);

  // Handle custom event tracking
  const handleTrackCustomEvent = async () => {
    if (!customEventName.trim() || !formo) return;

    await formo.track(customEventName, {
      source: "privy_demo_app",
      walletConnected: isConnected,
      address: address || "not_connected",
    });

    setCustomEventSent(true);
    setTimeout(() => setCustomEventSent(false), 2000);
    setCustomEventName("");
  };

  // Identify every wallet linked to the Privy user under that user's DID.
  //
  // Passing the Privy user expands `user.linkedAccounts` for us: one identify per
  // linked wallet, each tagged with `user.id`, carrying the profile properties
  // parsed from the linked accounts (email, phone, socials, …) plus per-wallet
  // metadata. Formo clusters them into a single user server-side.
  //
  // `activeAddress` pins event attribution to the wallet that is actually
  // active in wagmi; the other linked wallets are recorded for clustering only.
  //
  // `user` is reactive, so this re-runs on login and on every link/unlink - no
  // manual re-identify is needed from the linking UI. Calling identify from a
  // link callback would run against a possibly pre-link `user` and emit a
  // redundant, out-of-order identify just before this effect emits the correct
  // one.
  //
  // Depend on `wallets[0]?.address`, not the `wallets` array: useWallets()
  // returns a new array reference on many renders, which would re-run this on
  // every render.
  //
  // The branch below is the pattern for any app where some sessions are Privy
  // and some aren't - including this one, since a browser wallet can be
  // connected through wagmi before the user ever logs into Privy. Check `user`
  // FIRST: a Privy session usually also has a wagmi `address`, so testing the
  // address first would send Privy users down the single-address path and lose
  // the clustering entirely. `else if`, not a second `if`, so a Privy user
  // doesn't also emit a redundant identify for the connected wallet with no DID
  // attached.
  const activeWalletAddress = address ?? wallets[0]?.address;
  useEffect(() => {
    if (!formo) return;
    // Wait for Privy to finish discovering wallets. `user` can be ready before
    // `wallets` is populated, and identifying in that window resolves no active
    // address, so attribution falls back to `user.wallet` (usually the embedded
    // wallet) rather than the external wallet the user is actually transacting
    // with. The effect re-runs once wallets load, but events emitted in between
    // would already be attributed to the wrong wallet.
    if (!walletsReady) return;

    if (user) {
      // Privy session: every linked wallet, under the user's DID.
      formo.identify(user, { activeAddress: activeWalletAddress });
    } else if (address) {
      // Plain wallet session: just the connected address.
      formo.identify({ address });
    }
  }, [user, formo, address, activeWalletAddress, walletsReady]);

  // Handle sign message (Formo automatically tracks this via wagmi integration)
  const handleSignMessage = () => {
    signMessage({ message: "Hello from Formo + Privy Demo!" });
  };

  // Handle send transaction (Formo automatically tracks this via wagmi integration)
  const handleSendTransaction = () => {
    if (!address) return;

    // Send a minimal transaction (0 ETH to self for demo purposes)
    sendTransaction({
      to: address,
      value: 0n,
    });
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-500">
        <div className="animate-pulse text-lg text-white">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-ink-500">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Formo + Privy Integration
          </h1>
          <p className="text-ink-50 text-lg max-w-2xl mx-auto">
            This example demonstrates how to integrate{" "}
            <a
              href="https://formo.so"
              target="_blank"
              rel="noopener noreferrer"
              className="text-lemon-500 hover:text-lemon-300"
            >
              Formo Analytics SDK
            </a>{" "}
            with{" "}
            <a
              href="https://privy.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-lemon-500 hover:text-lemon-300"
            >
              Privy
            </a>{" "}
            embedded wallets for web3 analytics.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Wallet Connection Card */}
          <div className="bg-ink-400/25 backdrop-blur rounded-xl p-6 border border-ink-400/60">
            <h2 className="text-xl font-semibold text-white mb-4">Connect Wallet</h2>
            <p className="text-ink-100 text-sm mb-4">
              Use Privy to connect your wallet or create an embedded wallet.
              Formo will automatically track wallet events via wagmi integration.
            </p>
            {/* Privy's prebuilt account UI: renders a login button when logged
                out, and the connected account with its management menu when
                logged in. https://docs.privy.io/guide/react/recipes/user-pill */}
            <UserPill
              action={{ type: "login" }}
              expanded
              ui={{ background: "accent" }}
            />
            {authenticated && (
              <button
                onClick={logout}
                className="mt-3 w-full border border-danger/40 text-danger hover:bg-danger/10 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Disconnect
              </button>
            )}
          </div>

          {/* Wallet Status Card */}
          <div className="bg-ink-400/25 backdrop-blur rounded-xl p-6 border border-ink-400/60">
            <h2 className="text-xl font-semibold text-white mb-4">Wallet Status</h2>
            {authenticated && isConnected ? (
              <div className="space-y-3">
                <div>
                  <span className="text-ink-100 text-sm">Status:</span>
                  <span className="ml-2 text-lemon-500 font-medium">Connected</span>
                </div>
                <div>
                  <span className="text-ink-100 text-sm">Active Address:</span>
                  <p className="text-white font-mono text-sm break-all mt-1">
                    {address}
                  </p>
                </div>
                <div>
                  <span className="text-ink-100 text-sm">Chain ID:</span>
                  <span className="ml-2 text-white">{chainId}</span>
                </div>
                <div>
                  <span className="text-ink-100 text-sm">Balance:</span>
                  <span className="ml-2 text-white">
                    {balance
                      ? `${parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4)} ${balance.symbol}`
                      : "Loading..."}
                  </span>
                </div>
                <div>
                  <span className="text-ink-100 text-sm">Connector:</span>
                  <span className="ml-2 text-white">{connector?.name || "Unknown"}</span>
                </div>

                {/* Wallet Selector */}
                {wallets.length > 1 && (
                  <div className="pt-3 border-t border-ink-400">
                    <span className="text-ink-100 text-sm block mb-2">
                      All Wallets ({wallets.length}):
                    </span>
                    <div className="space-y-2">
                      {wallets.map((wallet) => {
                        const isActive = wallet.address.toLowerCase() === address?.toLowerCase();
                        return (
                          <button
                            key={wallet.address}
                            onClick={() => setActiveWallet(wallet)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                              isActive
                                ? "bg-lemon-500/15 border border-lemon-500 text-white"
                                : "bg-ink-400/25 border border-ink-400 text-ink-50 hover:bg-ink-400/50 hover:border-ink-300"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-xs break-all">
                                {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                wallet.walletClientType === "privy"
                                  ? "bg-lemon-500/15 text-lemon-300"
                                  : "bg-ink-400/60 text-ink-50"
                              }`}>
                                {wallet.walletClientType === "privy" ? "Embedded" : wallet.walletClientType}
                              </span>
                            </div>
                            {isActive && (
                              <span className="text-lemon-500 text-xs mt-1 block">Active in wagmi</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-ink-100">No wallet connected</p>
            )}
          </div>

          {/* Formo Analytics Actions Card */}
          <div className="bg-ink-400/25 backdrop-blur rounded-xl p-6 border border-ink-400/60">
            <h2 className="text-xl font-semibold text-white mb-4">Manual Analytics</h2>
            <p className="text-ink-100 text-sm mb-4">
              Manually trigger Formo events. Wallet events are auto-tracked.
            </p>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customEventName}
                  onChange={(e) => setCustomEventName(e.target.value)}
                  placeholder="Custom event name"
                  className="flex-1 bg-ink-400/40 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lemon-500"
                />
                <button
                  onClick={handleTrackCustomEvent}
                  disabled={!customEventName.trim()}
                  className="bg-lemon-500 hover:bg-lemon-400 text-ink-500 disabled:bg-ink-400/30 disabled:text-ink-200 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Track
                </button>
              </div>
              {customEventSent && (
                <p className="text-lemon-500 text-sm">Event sent!</p>
              )}
            </div>
          </div>

          {/* Wallet Actions Card (triggers auto-tracked events) */}
          <div className="bg-ink-400/25 backdrop-blur rounded-xl p-6 border border-ink-400/60">
            <h2 className="text-xl font-semibold text-white mb-4">Wallet Actions</h2>
            <p className="text-ink-100 text-sm mb-4">
              These actions are automatically tracked by Formo via wagmi integration.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleSignMessage}
                disabled={!authenticated || !isConnected || isSignPending}
                className="w-full bg-ink-400/40 hover:bg-ink-400/70 border border-ink-400 disabled:bg-ink-400/30 disabled:text-ink-200 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {isSignPending ? "Signing..." : "Sign Message"}
              </button>

              <button
                onClick={handleSendTransaction}
                disabled={!authenticated || !isConnected || isTxPending}
                className="w-full bg-ink-400/40 hover:bg-ink-400/70 border border-ink-400 disabled:bg-ink-400/30 disabled:text-ink-200 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {isTxPending ? "Sending..." : "Send Transaction (0 ETH)"}
              </button>

              <p className="text-ink-200 text-xs mt-2">
                Note: Transaction sends 0 ETH to yourself for demo purposes.
              </p>
            </div>
          </div>

          {/* Account Linking Card */}
          <LinkedAccounts />

          {/* Auto-tracked Events Info Card */}
          <div className="bg-ink-400/25 backdrop-blur rounded-xl p-6 border border-ink-400/60 md:col-span-2">
            <h2 className="text-xl font-semibold text-white mb-4">Auto-tracked Events</h2>
            <p className="text-ink-100 text-sm mb-4">
              The following events are automatically captured by Formo when using the wagmi integration:
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-ink-400/25 rounded-lg p-3">
                <h3 className="text-ink-50 font-medium mb-1">Wallet Connect</h3>
                <p className="text-ink-100 text-sm">When a user connects their wallet</p>
              </div>
              <div className="bg-ink-400/25 rounded-lg p-3">
                <h3 className="text-ink-50 font-medium mb-1">Wallet Disconnect</h3>
                <p className="text-ink-100 text-sm">When a user disconnects their wallet</p>
              </div>
              <div className="bg-ink-400/25 rounded-lg p-3">
                <h3 className="text-ink-50 font-medium mb-1">Chain Change</h3>
                <p className="text-ink-100 text-sm">When the user switches networks</p>
              </div>
              <div className="bg-ink-400/25 rounded-lg p-3">
                <h3 className="text-ink-50 font-medium mb-1">Signature Request</h3>
                <p className="text-ink-100 text-sm">When user signs a message</p>
              </div>
              <div className="bg-ink-400/25 rounded-lg p-3">
                <h3 className="text-ink-50 font-medium mb-1">Transaction</h3>
                <p className="text-ink-100 text-sm">When user sends a transaction</p>
              </div>
              <div className="bg-ink-400/25 rounded-lg p-3">
                <h3 className="text-ink-50 font-medium mb-1">Page View</h3>
                <p className="text-ink-100 text-sm">Automatic page hit tracking</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <div className="text-ink-100 text-sm">
            <p className="mb-2">
              Built with{" "}
              <a
                href="https://formo.so"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lemon-500 hover:underline"
              >
                Formo Analytics SDK
              </a>
              {" • "}
              <a
                href="https://privy.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lemon-500 hover:underline"
              >
                Privy
              </a>
              {" • "}
              <a
                href="https://wagmi.sh"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lemon-500 hover:underline"
              >
                wagmi
              </a>
              {" • "}
              <a
                href="https://viem.sh"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lemon-500 hover:underline"
              >
                viem
              </a>
            </p>
            <p>
              <a
                href="https://github.com/getformo/formo-example-privy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-lemon-500 hover:underline"
              >
                View on GitHub
              </a>
            </p>
          </div>
        </footer>
      </div>
    </main>
  );
}
