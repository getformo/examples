"use client";

import { FC, useCallback, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, PenTool, CheckCircle } from "lucide-react";
import bs58 from "bs58";
import { etc, verify } from "@noble/ed25519";
import { sha512 } from "@noble/hashes/sha512";

// @noble/ed25519 v2.x requires SHA-512 to be configured by the consumer
etc.sha512Sync = (...m) => sha512(etc.concatBytes(...m));

export const SignMessage: FC = () => {
  const { publicKey, signMessage } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [lastSignature, setLastSignature] = useState<string | null>(null);

  const onClick = useCallback(async () => {
    if (!publicKey) {
      toast.error("Wallet not connected!");
      return;
    }

    if (!signMessage) {
      toast.error("Wallet does not support message signing!");
      return;
    }

    setIsLoading(true);
    setLastSignature(null);

    try {
      const message = new TextEncoder().encode(
        `Hello Formo! Sign this message to verify your wallet.\n\nTimestamp: ${new Date().toISOString()}`
      );

      const signature = await signMessage(message);

      // Verify the signature
      const isValid = await verify(signature, message, publicKey.toBytes());

      if (!isValid) {
        throw new Error("Signature verification failed!");
      }

      const signatureBase58 = bs58.encode(signature);
      setLastSignature(signatureBase58);

      toast.success("Message Signed!", {
        description: "Signature verified successfully",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Check if user rejected
      if (errorMessage.includes("User rejected")) {
        toast.warning("Signing Cancelled", {
          description: "You rejected the signature request",
        });
      } else {
        toast.error("Signing Failed", {
          description: errorMessage,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, signMessage]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenTool className="h-5 w-5" />
          Sign Message
        </CardTitle>
        <CardDescription>
          Sign a message with your wallet to prove ownership.
          Tests: signature_requested → signature_confirmed/rejected
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant="gradient"
          onClick={onClick}
          disabled={!publicKey || !signMessage || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing...
            </>
          ) : !signMessage ? (
            "Wallet Doesn't Support Signing"
          ) : publicKey ? (
            "Sign Message"
          ) : (
            "Connect Wallet First"
          )}
        </Button>

        {lastSignature && (
          <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              Signature Verified
            </div>
            <code className="block text-xs text-muted-foreground break-all">
              {lastSignature}
            </code>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
