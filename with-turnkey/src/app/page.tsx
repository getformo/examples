"use client";

// @ts-ignore — @turnkey/sdk-react is built for React 18; safe to use with React 19
import { useTurnkey } from "@turnkey/sdk-react";
import { createEIP1193Provider } from "@turnkey/eip-1193-provider";
import { formatUnits } from "viem";
import { sepolia } from "viem/chains";
import { useFormo } from "@formo/analytics";
import { useState, useEffect, useCallback } from "react";

import { useWallet } from "./providers";

type UUID = `${string}-${string}-${string}-${string}-${string}`;

function formatDisplayBalance(value: bigint, decimals: number): string {
  const formatted = formatUnits(value, decimals);
  const dot = formatted.indexOf(".");
  return dot === -1 ? formatted : formatted.slice(0, dot + 5);
}

export default function Home() {
  const { turnkey, passkeyClient, client: turnkeyClient } = useTurnkey();
  const { provider, setProvider, walletState, setWalletState } = useWallet();
  const formo = useFormo();

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [signupEmail, setSignupEmail] = useState("");

  const [balance, setBalance] = useState<{ value: bigint; decimals: number; symbol: string } | null>(null);
  const [isSignPending, setIsSignPending] = useState(false);
  const [isTxPending, setIsTxPending] = useState(false);
  const [customEventName, setCustomEventName] = useState("");
  const [customEventSent, setCustomEventSent] = useState(false);

  const isConnected = !!walletState.address;
  const address = walletState.address;
  const chainId = walletState.chainId;

  // Build the chain config for the EIP-1193 provider
  const chain = sepolia;
  const chainParam = {
    chainId: `0x${chain.id.toString(16)}`,
    chainName: chain.name,
    nativeCurrency: chain.nativeCurrency,
    rpcUrls: [...chain.rpcUrls.default.http],
    blockExplorerUrls: chain.blockExplorers?.default?.url
      ? [chain.blockExplorers.default.url]
      : undefined,
  };

  // Get a fresh Turnkey client (avoids stale closure after login)
  const getFreshClient = useCallback(async () => {
    if (turnkeyClient) return turnkeyClient;
    // After login, turnkeyClient may still be undefined due to React not re-rendering yet.
    // Create a fresh IndexedDB client which reads the session credentials directly.
    if (!turnkey) throw new Error("Turnkey SDK not available");
    return await turnkey.indexedDbClient();
  }, [turnkey, turnkeyClient]);

  // Create the EIP-1193 provider and connect the wallet
  const connectWallet = useCallback(
    async (organizationId: string, walletId: string) => {
      const client = await getFreshClient();

      const eip1193 = await createEIP1193Provider({
        walletId: walletId as UUID,
        organizationId: organizationId as UUID,
        turnkeyClient: client,
        chains: [chainParam],
      });

      // Request accounts to initialize the provider
      const accounts = (await eip1193.request({
        method: "eth_requestAccounts",
      })) as string[];

      if (!accounts || accounts.length === 0) {
        throw new Error("No accounts returned from provider");
      }

      const chainIdHex = (await eip1193.request({
        method: "eth_chainId",
      })) as string;

      setProvider(eip1193 as any);
      setWalletState({
        address: accounts[0],
        chainId: parseInt(chainIdHex, 16),
        organizationId,
        userId: null,
      });

      const parsedChainId = parseInt(chainIdHex, 16);
      return { accounts, eip1193, chainId: parsedChainId };
    },
    [getFreshClient, setProvider, setWalletState]
  );

  // Fetch balance when connected
  useEffect(() => {
    if (!provider || !address) {
      setBalance(null);
      return;
    }

    let cancelled = false;

    const fetchBalance = async () => {
      try {
        const balanceHex = (await provider.request({
          method: "eth_getBalance",
          params: [address as `0x${string}`, "latest"],
        })) as string;
        if (!cancelled) {
          setBalance({
            value: BigInt(balanceHex),
            decimals: 18,
            symbol: "ETH",
          });
        }
      } catch (err) {
        console.error("Failed to fetch balance:", err);
      }
    };

    fetchBalance();
    return () => { cancelled = true; };
  }, [provider, address]);

  // Identify user in Formo when connected
  useEffect(() => {
    if (!walletState.address || !walletState.userId || !formo) return;

    formo.identify(
      { address: walletState.address, userId: walletState.userId },
      {
        provider: "turnkey",
        organizationId: walletState.organizationId || undefined,
      }
    );
  }, [walletState, formo]);

  // Handle passkey login
  const handlePasskeyLogin = useCallback(async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      let session = await turnkey?.getSession();
      if (!session) {
        if (!passkeyClient) {
          setAuthError("Passkey client not available. Check your Turnkey configuration.");
          return;
        }
        const storedOrgId = localStorage.getItem("turnkey_sub_org_id");
        await passkeyClient.login(
          storedOrgId ? { organizationId: storedOrgId } : undefined
        );
        session = await turnkey?.getSession();
        if (!session) {
          setAuthError("Failed to create Turnkey session.");
          return;
        }
      }

      let freshClient;
      try {
        freshClient = await getFreshClient();
      } catch {
        setAuthError("Failed to get Turnkey client.");
        return;
      }

      const organizationId = session.organizationId;
      const walletsResponse = await freshClient.getWallets({ organizationId });
      const wallets = walletsResponse.wallets;

      if (!wallets || wallets.length === 0) {
        setAuthError("No wallets found. Create a wallet in your Turnkey dashboard first.");
        return;
      }

      const { accounts, chainId: connectedChainId } = await connectWallet(organizationId, wallets[0].walletId);
      setWalletState({
        address: accounts[0],
        chainId: connectedChainId,
        userId: session!.userId,
        organizationId,
      });
    } catch (err) {
      console.error("Turnkey login failed:", err);
      setAuthError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsAuthenticating(false);
    }
  }, [turnkey, passkeyClient, getFreshClient, connectWallet, setWalletState]);

  // Handle new account creation
  const handleCreateAccount = useCallback(async () => {
    if (!signupEmail.trim()) {
      setAuthError("Please enter your email address.");
      return;
    }
    setIsCreatingAccount(true);
    setAuthError(null);
    try {
      if (!passkeyClient) {
        setAuthError("Passkey client not available. Check your Turnkey configuration.");
        return;
      }

      const email = signupEmail.trim();

      const passkey = await passkeyClient.createUserPasskey({
        publicKey: { user: { name: email, displayName: email } },
      });

      const response = await fetch("/api/create-sub-org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          challenge: passkey.encodedChallenge,
          attestation: passkey.attestation,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create account");
      }

      const subOrg = await response.json();

      if (!subOrg?.subOrganizationId) {
        setAuthError("Failed to create sub-organization.");
        return;
      }

      localStorage.setItem("turnkey_sub_org_id", subOrg.subOrganizationId);

      // Log in with the newly created passkey
      await passkeyClient.login({ organizationId: subOrg.subOrganizationId });

      const session = await turnkey?.getSession();
      if (!session) {
        setAuthError("Account created but failed to log in. Try clicking 'Log In with Passkey'.");
        return;
      }

      let freshClient;
      try {
        freshClient = await getFreshClient();
      } catch {
        setAuthError("Account created but failed to get Turnkey client. Try clicking 'Log In with Passkey'.");
        return;
      }

      // Get wallet ID from the sub-org creation response or fetch it
      let walletId = subOrg.walletId;
      if (!walletId) {
        const walletsResponse = await freshClient.getWallets({
          organizationId: subOrg.subOrganizationId,
        });
        const wallets = walletsResponse.wallets;
        if (!wallets || wallets.length === 0) {
          setAuthError("Account created but no wallets found.");
          return;
        }
        walletId = wallets[0].walletId;
      }

      const { accounts, chainId: connectedChainId } = await connectWallet(subOrg.subOrganizationId, walletId);
      setWalletState({
        address: accounts[0],
        chainId: connectedChainId,
        userId: session!.userId,
        organizationId: subOrg.subOrganizationId,
      });
    } catch (err) {
      console.error("Account creation failed:", err);
      setAuthError(err instanceof Error ? err.message : "Account creation failed");
    } finally {
      setIsCreatingAccount(false);
    }
  }, [turnkey, passkeyClient, getFreshClient, connectWallet, signupEmail, setWalletState]);

  // Handle disconnect
  const handleDisconnect = useCallback(() => {
    setProvider(null);
    setWalletState({ address: null, chainId: null, organizationId: null, userId: null });
    setBalance(null);
  }, [setProvider, setWalletState]);

  // Handle sign message (Formo auto-tracks via EIP-1193 provider wrapping)
  const handleSignMessage = useCallback(async () => {
    if (!provider || !address) return;
    setIsSignPending(true);
    try {
      await (provider as any).request({
        method: "personal_sign",
        params: [
          ("0x" + Buffer.from("Hello from Formo + Turnkey Demo!").toString("hex")) as `0x${string}`,
          address as `0x${string}`,
        ],
      });
    } catch (err) {
      console.error("Sign message failed:", err);
    } finally {
      setIsSignPending(false);
    }
  }, [provider, address]);

  // Handle send transaction (Formo auto-tracks via EIP-1193 provider wrapping)
  const handleSendTransaction = useCallback(async () => {
    if (!provider || !address) return;
    setIsTxPending(true);
    try {
      await provider.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: address as `0x${string}`,
            to: address as `0x${string}`,
            value: "0x0",
          },
        ],
      });
    } catch (err) {
      console.error("Send transaction failed:", err);
    } finally {
      setIsTxPending(false);
    }
  }, [provider, address]);

  // Handle custom event tracking
  const handleTrackCustomEvent = async () => {
    if (!customEventName.trim() || !formo) return;

    await formo.track(customEventName, {
      source: "turnkey_demo_app",
      walletConnected: isConnected,
      address: address || "not_connected",
    });

    setCustomEventSent(true);
    setCustomEventName("");
  };

  // Clear custom event confirmation after 2 seconds
  useEffect(() => {
    if (!customEventSent) return;
    const timer = setTimeout(() => setCustomEventSent(false), 2000);
    return () => clearTimeout(timer);
  }, [customEventSent]);

  // Handle page view tracking
  const handleTrackPageView = async () => {
    if (!formo) return;

    await formo.page("demo", "wallet_demo", {
      walletConnected: isConnected,
      address: address || "not_connected",
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
            embedded wallets using the EIP-1193 provider.
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
              wallet. Formo automatically tracks wallet events via the EIP-1193
              provider.
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
              <div className="space-y-3">
                <button
                  onClick={handlePasskeyLogin}
                  disabled={isAuthenticating || isCreatingAccount}
                  className="w-full bg-teal-600 hover:bg-teal-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  {isAuthenticating
                    ? "Authenticating..."
                    : "Log In with Passkey"}
                </button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-gray-800 px-2 text-gray-400">or create an account</span>
                  </div>
                </div>
                <input
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  onClick={handleCreateAccount}
                  disabled={isAuthenticating || isCreatingAccount || !signupEmail.trim()}
                  className="w-full bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors border border-gray-500"
                >
                  {isCreatingAccount
                    ? "Creating Account..."
                    : "Create New Account"}
                </button>
              </div>
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
                      ? `${formatDisplayBalance(balance.value, balance.decimals)} ${balance.symbol}`
                      : "Loading..."}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Provider:</span>
                  <span className="ml-2 text-white">Turnkey EIP-1193</span>
                </div>
                {walletState.userId && (
                  <div className="pt-3 border-t border-gray-600">
                    <span className="text-gray-400 text-sm">
                      Turnkey User ID:
                    </span>
                    <p className="text-white font-mono text-xs break-all mt-1">
                      {walletState.userId}
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
              These actions are automatically tracked by Formo via the EIP-1193
              provider wrapper.
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
              The following events are automatically captured by Formo via the
              EIP-1193 provider wrapper:
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
