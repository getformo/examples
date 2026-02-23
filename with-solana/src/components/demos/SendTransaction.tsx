"use client";

import { FC, useCallback, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { Transaction, SystemProgram, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNetworkConfiguration } from "@/contexts/NetworkConfigurationProvider";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

export const SendTransaction: FC = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { networkConfiguration } = useNetworkConfiguration();
  const [isLoading, setIsLoading] = useState(false);

  const onClick = useCallback(async () => {
    if (!publicKey) {
      toast.error("Wallet not connected!");
      return;
    }

    setIsLoading(true);
    let signature = "";

    try {
      // Create a simple transfer to a random address
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: Keypair.generate().publicKey,
          lamports: 0.001 * LAMPORTS_PER_SOL, // 0.001 SOL
        })
      );

      const {
        context: { slot: minContextSlot },
        value: { blockhash, lastValidBlockHeight },
      } = await connection.getLatestBlockhashAndContext();

      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      signature = await sendTransaction(transaction, connection, {
        minContextSlot,
      });

      await connection.confirmTransaction({
        blockhash,
        lastValidBlockHeight,
        signature,
      });

      toast.success("Transaction Sent!", {
        description: `Successfully sent 0.001 SOL`,
        action: {
          label: "View",
          onClick: () => window.open(
            `https://explorer.solana.com/tx/${signature}?cluster=${networkConfiguration}`,
            "_blank"
          ),
        },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      toast.error("Transaction Failed", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, connection, sendTransaction, networkConfiguration]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Send Transaction (Legacy)
        </CardTitle>
        <CardDescription>
          Send a legacy transaction transferring 0.001 SOL to a random address.
          Tests: transaction_started → transaction_broadcasted → transaction_confirmed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="gradient"
          onClick={onClick}
          disabled={!publicKey || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : publicKey ? (
            "Send 0.001 SOL"
          ) : (
            "Connect Wallet First"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
