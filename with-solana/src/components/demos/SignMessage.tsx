"use client";

import { FC, useCallback, useState } from "react";
import { useWalletConnection, useWalletSession, useClientStore } from "@solana/react-hooks";
import { useFormo } from "@/contexts/FormoProvider";
import { SignatureStatus } from "@formo/analytics";
import { chainIdFromEndpoint } from "@/lib/solana";
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
  const { wallet, status } = useWalletConnection();
  const session = useWalletSession();
  const { formo } = useFormo();
  const endpoint = useClientStore((s) => s.cluster.endpoint);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSignature, setLastSignature] = useState<string | null>(null);

  const onClick = useCallback(async () => {
    if (status !== "connected" || !wallet || !session) {
      toast.error("Wallet not connected!");
      return;
    }

    if (!session.signMessage) {
      toast.error("Wallet does not support message signing!");
      return;
    }

    setIsLoading(true);
    setLastSignature(null);

    const address = wallet.account.address.toString();
    const chainId = chainIdFromEndpoint(endpoint);
    const messageText = `Hello Formo! Sign this message to verify your wallet.\n\nTimestamp: ${new Date().toISOString()}`;
    const message = new TextEncoder().encode(messageText);

    // Track signature request
    formo?.signature({
      status: SignatureStatus.REQUESTED,
      chainId,
      address,
      message: messageText,
    });

    try {
      const signature = await session.signMessage(message);

      const sigBytes = signature instanceof Uint8Array ? signature : new Uint8Array(signature);
      const signatureBase58 = bs58.encode(sigBytes);

      // Verify the signature (best-effort — don't track as rejection on failure)
      const pubKeyBytes = session.account.publicKey;
      if (pubKeyBytes) {
        const pkBytes = pubKeyBytes instanceof Uint8Array ? pubKeyBytes : new Uint8Array(pubKeyBytes as ArrayBuffer);
        const isValid = await verify(sigBytes, message, pkBytes);
        if (!isValid) {
          toast.error("Signature verification failed!", {
            description: "The wallet signed, but the signature didn't verify.",
          });
          // Still track as confirmed — the user did sign
        }
      }

      setLastSignature(signatureBase58);

      // Track confirmed signature
      formo?.signature({
        status: SignatureStatus.CONFIRMED,
        chainId,
        address,
        message: messageText,
        signatureHash: signatureBase58,
      });

      toast.success("Message Signed!", {
        description: "Signature verified successfully",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const isUserRejection = errorMessage.includes("User rejected") || errorMessage.includes("rejected");

      // Only track REJECTED when the user actually refused to sign
      if (isUserRejection) {
        formo?.signature({
          status: SignatureStatus.REJECTED,
          chainId,
          address,
          message: messageText,
        });
      }

      if (isUserRejection) {
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
  }, [wallet, status, session, formo, endpoint]);

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
          disabled={status !== "connected" || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing...
            </>
          ) : status === "connected" ? (
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
