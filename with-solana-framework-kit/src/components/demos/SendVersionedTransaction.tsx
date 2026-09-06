"use client";

import { FC, useCallback, useState } from "react";
import {
  useWalletConnection,
  useWalletSession,
  useTransactionPool,
  useSolanaClient,
} from "@solana/react-hooks";
import { createWalletTransactionSigner } from "@solana/client";
import { getTransferSolInstruction } from "@solana-program/system";
import { address } from "@solana/kit";
import { TransactionStatus, useFormo } from "@formo/analytics";
import { useCurrentCluster } from "@/hooks/useCurrentCluster";
import { waitForConfirmation } from "@/lib/transactions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Zap } from "lucide-react";

// Throwaway devnet address for demo transfers
const DEMO_DESTINATION = "Ff34MXWdgNsEJ1kJFj9cXmrEe7y2P93b95mGu5CJjBQJ";

export const SendVersionedTransaction: FC = () => {
  const { wallet, status } = useWalletConnection();
  const client = useSolanaClient();
  const session = useWalletSession();
  const pool = useTransactionPool();
  const formo = useFormo();
  const { chainId, explorerCluster } = useCurrentCluster();
  const [isLoading, setIsLoading] = useState(false);

  const onClick = useCallback(async () => {
    if (status !== "connected" || !session || !wallet) {
      toast.error("Wallet not connected!");
      return;
    }

    setIsLoading(true);
    const walletAddress = wallet.account.address.toString();
    let transactionHash: string | undefined;

    formo?.transaction({
      status: TransactionStatus.STARTED,
      chainId,
      address: walletAddress,
    });

    try {
      const { signer } = createWalletTransactionSigner(session);

      const instruction = getTransferSolInstruction({
        source: signer,
        destination: address(DEMO_DESTINATION),
        amount: 1_000_000n, // 0.001 SOL
      });

      pool.replaceInstructions([instruction]);
      const signature = await pool.prepareAndSend({ feePayer: signer });
      transactionHash = signature.toString();

      formo?.transaction({
        status: TransactionStatus.BROADCASTED,
        chainId,
        address: walletAddress,
        transactionHash,
      });
      await waitForConfirmation(client, transactionHash);
      formo?.transaction({
        status: TransactionStatus.CONFIRMED,
        chainId,
        address: walletAddress,
        transactionHash,
      });

      toast.success("Transaction Sent!", {
        description: `Successfully sent 0.001 SOL via useTransactionPool`,
        action: {
          label: "View",
          onClick: () => window.open(
            `https://explorer.solana.com/tx/${transactionHash}?cluster=${explorerCluster}`,
            "_blank"
          ),
        },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      formo?.transaction({
        status: transactionHash
          ? TransactionStatus.REVERTED
          : TransactionStatus.REJECTED,
        chainId,
        address: walletAddress,
        transactionHash,
      });
      toast.error("Transaction Failed", { description: errorMessage });
    } finally {
      pool.reset();
      setIsLoading(false);
    }
  }, [chainId, client, explorerCluster, formo, pool, session, status, wallet]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Send Transaction (Pool)
        </CardTitle>
        <CardDescription>
          Build and send a transaction using useTransactionPool with custom instructions.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="gradient"
          onClick={onClick}
          disabled={status !== "connected" || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : status === "connected" ? (
            "Send via Transaction Pool"
          ) : (
            "Connect Wallet First"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
