"use client";

import { FC, useCallback, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  TransactionMessage,
  VersionedTransaction,
  SystemProgram,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNetworkConfiguration } from "@/contexts/NetworkConfigurationProvider";
import { toast } from "sonner";
import { Loader2, Zap } from "lucide-react";

export const SendVersionedTransaction: FC = () => {
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
      const instructions = [
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: Keypair.generate().publicKey,
          lamports: 0.001 * LAMPORTS_PER_SOL, // 0.001 SOL
        }),
      ];

      const latestBlockhash = await connection.getLatestBlockhash();

      const messageV0 = new TransactionMessage({
        payerKey: publicKey,
        recentBlockhash: latestBlockhash.blockhash,
        instructions,
      }).compileToV0Message();

      const transactionV0 = new VersionedTransaction(messageV0);

      signature = await sendTransaction(transactionV0, connection);

      await connection.confirmTransaction({
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        signature,
      });

      toast.success("Versioned Transaction Sent!", {
        description: `Successfully sent 0.001 SOL using V0 transaction`,
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
      toast.error("Versioned Transaction Failed", {
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
          <Zap className="h-5 w-5" />
          Send Versioned Transaction (V0)
        </CardTitle>
        <CardDescription>
          Send a V0 versioned transaction. Tests modern transaction format support.
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
              Sending V0...
            </>
          ) : publicKey ? (
            "Send Versioned Transaction"
          ) : (
            "Connect Wallet First"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
