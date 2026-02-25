"use client";

import { useState } from "react";
import { useAccount, useChainId, useSignMessage, useSignTypedData, useSendTransaction } from "wagmi";
import { parseEther } from "viem";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function WalletActions() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [message, setMessage] = useState("Hello from Formo Analytics!");
  const [lastResult, setLastResult] = useState<string | null>(null);

  // Sign Message
  const { signMessage, isPending: isSigningMessage } = useSignMessage({
    mutation: {
      onSuccess: (signature) => {
        setLastResult(`Message signed! Signature: ${signature.slice(0, 20)}...`);
      },
      onError: (error) => {
        setLastResult(`Sign failed: ${error.message}`);
      },
    },
  });

  // Sign Typed Data (EIP-712)
  const { signTypedData, isPending: isSigningTypedData } = useSignTypedData({
    mutation: {
      onSuccess: (signature) => {
        setLastResult(`Typed data signed! Signature: ${signature.slice(0, 20)}...`);
      },
      onError: (error) => {
        setLastResult(`Sign failed: ${error.message}`);
      },
    },
  });

  // Send Transaction (0 ETH to self)
  const { sendTransaction, isPending: isSending } = useSendTransaction({
    mutation: {
      onSuccess: (hash) => {
        setLastResult(`Transaction sent! Hash: ${hash.slice(0, 20)}...`);
      },
      onError: (error) => {
        setLastResult(`Transaction failed: ${error.message}`);
      },
    },
  });

  const handleSignMessage = () => {
    signMessage({ message });
  };

  const handleSignTypedData = () => {
    if (!address) return;
    signTypedData({
      domain: {
        name: "Formo Test",
        version: "1",
        chainId,
      },
      types: {
        Person: [
          { name: "name", type: "string" },
          { name: "wallet", type: "address" },
        ],
      },
      primaryType: "Person",
      message: {
        name: "Test User",
        wallet: address,
      },
    });
  };

  const handleSendTransaction = () => {
    if (!address) return;
    sendTransaction({
      to: address, // Send to self
      value: parseEther("0"), // 0 ETH
    });
  };

  if (!isConnected) {
    return (
      <Card className="bg-zinc-800 bg-opacity-50 text-white border-zinc-700 max-w-md w-full">
        <CardHeader>
          <CardTitle>Wallet Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-400">Connect your wallet to test signing and transactions.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-800 bg-opacity-50 text-white border-zinc-700 max-w-md w-full">
      <CardHeader>
        <CardTitle>Test Wallet Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Message Input */}
        <div className="space-y-2">
          <label className="text-sm text-zinc-400">Message to sign:</label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleSignMessage}
            disabled={isSigningMessage}
            className="bg-indigo-600 hover:bg-indigo-700 w-full"
          >
            {isSigningMessage ? "Signing..." : "Sign Message"}
          </Button>

          <Button
            onClick={handleSignTypedData}
            disabled={isSigningTypedData}
            className="bg-purple-600 hover:bg-purple-700 w-full"
          >
            {isSigningTypedData ? "Signing..." : "Sign Typed Data (EIP-712)"}
          </Button>

          <Button
            onClick={handleSendTransaction}
            disabled={isSending}
            className="bg-teal-600 hover:bg-teal-700 w-full"
          >
            {isSending ? "Sending..." : "Send 0 ETH to Self"}
          </Button>
        </div>

        {/* Result Display */}
        {lastResult && (
          <div className="mt-4 p-3 bg-zinc-900 rounded-lg border border-zinc-700">
            <p className="text-sm text-zinc-300 break-all">{lastResult}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
