"use client";

// @ts-ignore — @turnkey/sdk-react is built for React 18; safe to use with React 19
import { useTurnkey } from "@turnkey/sdk-react";
import {
  useAccount,
  useBalance,
  useChainId,
  useConnect,
  useDisconnect,
  useSignMessage,
  useSendTransaction,
} from "wagmi";
import { formatUnits } from "viem";
import { useFormo } from "@formo/analytics";
import { useState, useEffect, useRef, useCallback } from "react";

import { turnkeyConnector } from "@/config/turnkey-connector";

export default function Home() {
  const { turnkey, client: turnkeyClient } = useTurnkey();
  const { connectAsync } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { address, isConnected, connector } = useAccount();
  const chainId = useChainId();
  const formo = useFormo();

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [turnkeyUser, setTurnkeyUser] = useState<{
    userId: string;
    organizationId: string;
  } | null>(null);

  const { data: balance } = useBalance({
    address,
    query: { enabled: !!address },
  });

  const { signMessage, isPending: isSignPending } = useSignMessage();
  const { sendTransaction, isPending: isTxPending } = useSendTransaction();

  const [customEventName, setCustomEventName] = useState("");
  const [customEventSent, setCustomEventSent] = useState(false);

  // Track previous auth state to detect logout
  const prevAuthRef = useRef<{
    connected: boolean;
    address?: string;
    chainId?: number;
  }>({ connected: false });

  // Bridge Turnkey logout to Formo disconnect event
  useEffect(() => {
    const prev = prevAuthRef.current;

    if (prev.connected && !isConnected && prev.address && formo) {
      formo.disconnect({
        address: prev.address,
        chainId: prev.chainId,
      });
    }

    prevAuthRef.current = {
      connected: isConnected,
      address,
      chainId,
    };
  }, [isConnected, address, chainId, formo]);

  // Identify user in Formo when connected via Turnkey
  useEffect(() => {
    if (!turnkeyUser || !address || !formo) return;

    formo.identify(
      { address, userId: turnkeyUser.userId },
      {
        provider: "turnkey",
        organizationId: turnkeyUser.organizationId,
      }
    );
  }, [turnkeyUser, address, formo]);

  // Handle passkey login
  const handlePasskeyLogin = useCallback(async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const session = await turnkey?.getSession();
      if (!session) {
        setAuthError("No active Turnkey session. Please create a passkey first.");
        return;
      }

      if (!turnkeyClient) {
        setAuthError("Failed to get Turnkey client.");
        return;
      }

      const organizationId =
        process.env.NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID ?? "";

      // Fetch the user's wallets from Turnkey
      const walletsResponse = await turnkeyClient.getWallets({ organizationId });
      const wallets = walletsResponse.wallets;

      if (!wallets || wallets.length === 0) {
        setAuthError(
          "No wallets found. Create a wallet in your Turnkey dashboard first."
        );
        return;
      }

      // Create the wagmi connector with the Turnkey client
      const connector = turnkeyConnector({
        client: turnkeyClient,
        organizationId,
        walletId: wallets[0].walletId,
      });

      // Connect the Turnkey wallet via wagmi (await so errors propagate to catch)
      await connectAsync({ connector });

      setTurnkeyUser({
        userId: session.userId,
        organizationId,
      });
    } catch (err) {
      console.error("Turnkey login failed:", err);
      setAuthError(
        err instanceof Error ? err.message : "Authentication failed"
      );
    } finally {
      setIsAuthenticating(false);
    }
  }, [turnkey, turnkeyClient, connectAsync]);

  // Handle disconnect
  const handleDisconnect = useCallback(() => {
    wagmiDisconnect();
    setTurnkeyUser(null);
  }, [wagmiDisconnect]);

  // Handle custom event tracking
  const handleTrackCustomEvent = async () => {
    if (!customEventName.trim() || !formo) return;

    await formo.track(customEventName, {
      source: "turnkey_demo_app",
      walletConnected: isConnected,
      address: address || "not_connected",
    });

    setCustomEventSent(true);
    setTimeout(() => setCustomEventSent(false), 2000);
    setCustomEventName("");
  };

  // Handle page view tracking
  const handleTrackPageView = async () => {
    if (!formo) return;

    await formo.page("demo", "wallet_demo", {
      walletConnected: isConnected,
      address: address || "not_connected",
    });
  };

  // Handle sign message (Formo automatically tracks this via wagmi integration)
  const handleSignMessage = () => {
    signMessage({ message: "Hello from Formo + Turnkey Demo!" });
  };

  // Handle send transaction (Formo automatically tracks this via wagmi integration)
  const handleSendTransaction = () => {
    if (!address) return;

    sendTransaction({
      to: address,
      value: 0n,
    });
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-teal-900 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Formo + Turnkey Integration
          </h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            This example demonstrates how to integrate{" "}
            <a
              href="https://formo.so"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-400 hover:text-teal-300"
            >
              Formo Analytics SDK
            </a>{" "}
            with{" "}
            <a
              href="https://turnkey.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-400 hover:text-teal-300"
            >
              Turnkey
            </a>{" "}
            embedded wallets for web3 analytics.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Wallet Connection Card */}
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">
              Connect Wallet
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              Authenticate with Turnkey using passkeys to access your embedded
              wallet. Formo will automatically track wallet events via wagmi.
            </p>

            {authError && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
                <p className="text-red-300 text-sm">{authError}</p>
              </div>
            )}

            {isConnected ? (
              <button
                onClick={handleDisconnect}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={handlePasskeyLogin}
                disabled={isAuthenticating}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {isAuthenticating
                  ? "Authenticating..."
                  : "Connect with Turnkey"}
              </button>
            )}
          </div>

          {/* Wallet Status Card */}
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">
              Wallet Status
            </h2>
            {isConnected ? (
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400 text-sm">Status:</span>
                  <span className="ml-2 text-green-400 font-medium">
                    Connected
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Address:</span>
                  <p className="text-white font-mono text-sm break-all mt-1">
                    {address}
                  </p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Chain ID:</span>
                  <span className="ml-2 text-white">{chainId}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Balance:</span>
                  <span className="ml-2 text-white">
                    {balance
                      ? `${parseFloat(
                          formatUnits(balance.value, balance.decimals)
                        ).toFixed(4)} ${balance.symbol}`
                      : "Loading..."}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Connector:</span>
                  <span className="ml-2 text-white">
                    {connector?.name || "Turnkey"}
                  </span>
                </div>
                {turnkeyUser && (
                  <div className="pt-3 border-t border-gray-600">
                    <span className="text-gray-400 text-sm">
                      Turnkey User ID:
                    </span>
                    <p className="text-white font-mono text-xs break-all mt-1">
                      {turnkeyUser.userId}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-400">No wallet connected</p>
            )}
          </div>

          {/* Formo Analytics Actions Card */}
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">
              Manual Analytics
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              Manually trigger Formo events. Wallet events are auto-tracked.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleTrackPageView}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Track Page View
              </button>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={customEventName}
                  onChange={(e) => setCustomEventName(e.target.value)}
                  placeholder="Custom event name"
                  className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  onClick={handleTrackCustomEvent}
                  disabled={!customEventName.trim()}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Track
                </button>
              </div>
              {customEventSent && (
                <p className="text-green-400 text-sm">Event sent!</p>
              )}
            </div>
          </div>

          {/* Wallet Actions Card */}
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">
              Wallet Actions
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              These actions are automatically tracked by Formo via wagmi
              integration.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleSignMessage}
                disabled={!isConnected || isSignPending}
                className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {isSignPending ? "Signing..." : "Sign Message"}
              </button>

              <button
                onClick={handleSendTransaction}
                disabled={!isConnected || isTxPending}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {isTxPending ? "Sending..." : "Send Transaction (0 ETH)"}
              </button>

              <p className="text-gray-500 text-xs mt-2">
                Note: Transaction sends 0 ETH to yourself for demo purposes.
              </p>
            </div>
          </div>

          {/* Auto-tracked Events Info Card */}
          <div className="bg-gray-800/50 backdrop-blur rounded-xl p-6 border border-gray-700 md:col-span-2">
            <h2 className="text-xl font-semibold text-white mb-4">
              Auto-tracked Events
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              The following events are automatically captured by Formo when using
              the wagmi integration:
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-gray-700/50 rounded-lg p-3">
                <h3 className="text-green-400 font-medium mb-1">
                  Wallet Connect
                </h3>
                <p className="text-gray-400 text-sm">
                  When a user connects their wallet
                </p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <h3 className="text-red-400 font-medium mb-1">
                  Wallet Disconnect
                </h3>
                <p className="text-gray-400 text-sm">
                  When a user disconnects their wallet
                </p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <h3 className="text-blue-400 font-medium mb-1">
                  Chain Change
                </h3>
                <p className="text-gray-400 text-sm">
                  When the user switches networks
                </p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <h3 className="text-amber-400 font-medium mb-1">
                  Signature Request
                </h3>
                <p className="text-gray-400 text-sm">
                  When user signs a message
                </p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <h3 className="text-teal-400 font-medium mb-1">Transaction</h3>
                <p className="text-gray-400 text-sm">
                  When user sends a transaction
                </p>
              </div>
              <div className="bg-gray-700/50 rounded-lg p-3">
                <h3 className="text-cyan-400 font-medium mb-1">Page View</h3>
                <p className="text-gray-400 text-sm">
                  Automatic page hit tracking
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <div className="text-gray-400 text-sm">
            <p className="mb-2">
              Built with{" "}
              <a
                href="https://formo.so"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 hover:underline"
              >
                Formo Analytics SDK
              </a>
              {" \u2022 "}
              <a
                href="https://turnkey.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 hover:underline"
              >
                Turnkey
              </a>
              {" \u2022 "}
              <a
                href="https://wagmi.sh"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 hover:underline"
              >
                wagmi
              </a>
              {" \u2022 "}
              <a
                href="https://viem.sh"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 hover:underline"
              >
                viem
              </a>
            </p>
            <p>
              <a
                href="https://github.com/getformo/examples/tree/main/with-turnkey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 hover:underline"
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
