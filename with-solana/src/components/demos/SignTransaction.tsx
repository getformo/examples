"use client";

import { FC, useCallback, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction, SystemProgram, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, FileSignature, CheckCircle } from "lucide-react";
import bs58 from "bs58";

export const SignTransaction: FC = () => {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [signedTxSignature, setSignedTxSignature] = useState<string | null>(null);

  const onClick = useCallback(async () => {
    if (!publicKey) {
      toast.error("Wallet not connected!");
      return;
    }

    if (!signTransaction) {
      toast.error("Wallet does not support transaction signing!");
      return;
    }

    setIsLoading(true);
    setSignedTxSignature(null);

    try {
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

      // Create a transaction but don't send it - just sign
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: Keypair.generate().publicKey,
          lamports: 0.001 * LAMPORTS_PER_SOL,
        })
      );

      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Sign the transaction without sending
      const signedTx = await signTransaction(transaction);

      // Get the signature from the signed transaction
      const signaturePair = signedTx.signatures[0];
      if (signaturePair?.signature) {
        setSignedTxSignature(bs58.encode(signaturePair.signature));
      }

      toast.success("Transaction Signed!", {
        description: "Transaction signed but not broadcasted. You can inspect the signature below.",
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (errorMessage.includes("User rejected")) {
        toast.warning("Signing Cancelled", {
          description: "You rejected the transaction signing request",
        });
      } else {
        toast.error("Transaction Signing Failed", {
          description: errorMessage,
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, signTransaction]);

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
          disabled={!publicKey || !signTransaction || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing...
            </>
          ) : !signTransaction ? (
            "Wallet Doesn't Support Transaction Signing"
          ) : publicKey ? (
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
              <span className="font-medium">Signature:</span>
              <code className="block mt-1 break-all">{signedTxSignature}</code>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
