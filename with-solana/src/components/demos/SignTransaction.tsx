"use client";

import { FC, useCallback, useState } from "react";
import {
  useWalletConnection,
  useWalletSession,
  useTransactionPool,
} from "@solana/react-hooks";
import { createWalletTransactionSigner } from "@solana/client";
import { getTransferSolInstruction } from "@solana-program/system";
import { useFormo } from "@/contexts/FormoProvider";
import { SignatureStatus, SOLANA_CHAIN_IDS } from "@formo/analytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, FileSignature, CheckCircle } from "lucide-react";

export const SignTransaction: FC = () => {
  const { wallet, status } = useWalletConnection();
  const session = useWalletSession();
  const pool = useTransactionPool();
  const { formo } = useFormo();
  const [isLoading, setIsLoading] = useState(false);
  const [signedTxSignature, setSignedTxSignature] = useState<string | null>(null);

  const onClick = useCallback(async () => {
    if (status !== "connected" || !wallet || !session) {
      toast.error("Wallet not connected!");
      return;
    }

    setIsLoading(true);
    setSignedTxSignature(null);

    const address = wallet.account.address.toString();
    const chainId = SOLANA_CHAIN_IDS["devnet"];

    // Track signature request
    formo?.signature({
      status: SignatureStatus.REQUESTED,
      chainId,
      address,
      message: "",
    });

    try {
      const { signer } = createWalletTransactionSigner(session);

      const instruction = getTransferSolInstruction({
        source: signer,
        destination: "Ff34MXWdgNsEJ1kJFj9cXmrEe7y2P93b95mGu5CJjBQJ" as any,
        amount: 1_000_000n, // 0.001 SOL
      });

      // Prepare and sign without sending
      pool.replaceInstructions([instruction]);
      await pool.prepare();
      await pool.sign();

      setSignedTxSignature("Transaction signed successfully");

      // Track confirmed signature
      formo?.signature({
        status: SignatureStatus.CONFIRMED,
        chainId,
        address,
        message: "",
      });

      toast.success("Transaction Signed!", {
        description: "Transaction signed but not broadcasted.",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      // Track rejected signature
      formo?.signature({
        status: SignatureStatus.REJECTED,
        chainId,
        address,
        message: "",
      });

      if (errorMessage.includes("User rejected") || errorMessage.includes("rejected")) {
        toast.warning("Signing Cancelled", {
          description: "You rejected the transaction signing request",
        });
      } else {
        toast.error("Transaction Signing Failed", {
          description: errorMessage,
        });
      }
    } finally {
      pool.reset();
      setIsLoading(false);
    }
  }, [wallet, status, session, pool, formo]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSignature className="h-5 w-5" />
          Sign Transaction (No Send)
        </CardTitle>
        <CardDescription>
          Sign a transaction without broadcasting it. Useful for offline signing or multi-sig.
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
            "Sign Transaction (Don't Send)"
          ) : (
            "Connect Wallet First"
          )}
        </Button>

        {signedTxSignature && (
          <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              Transaction Signed (Not Broadcasted)
            </div>
            <div className="text-xs text-muted-foreground">
              {signedTxSignature}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
