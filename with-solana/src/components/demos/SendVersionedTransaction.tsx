"use client";

import { FC, useCallback, useState } from "react";
import {
  useWalletConnection,
  useWalletSession,
  useTransactionPool,
  useClientStore,
} from "@solana/react-hooks";
import { createWalletTransactionSigner } from "@solana/client";
import { getTransferSolInstruction } from "@solana-program/system";
import { useFormo } from "@/contexts/FormoProvider";
import { TransactionStatus } from "@formo/analytics";
import { clusterFromEndpoint, chainIdFromEndpoint } from "@/lib/solana";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Zap } from "lucide-react";

// Throwaway devnet address for demo transfers
const DEMO_DESTINATION = "Ff34MXWdgNsEJ1kJFj9cXmrEe7y2P93b95mGu5CJjBQJ";

export const SendVersionedTransaction: FC = () => {
  const { wallet, status } = useWalletConnection();
  const session = useWalletSession();
  const pool = useTransactionPool();
  const { formo } = useFormo();
  const endpoint = useClientStore((s) => s.cluster.endpoint);
  const [isLoading, setIsLoading] = useState(false);

  const cluster = clusterFromEndpoint(endpoint);

  const onClick = useCallback(async () => {
    if (status !== "connected" || !session || !wallet) {
      toast.error("Wallet not connected!");
      return;
    }

    setIsLoading(true);
    const address = wallet.account.address.toString();
    const chainId = chainIdFromEndpoint(endpoint);

    // Manual transaction tracking — needed because useTransactionPool bypasses
    // the framework-kit store's state.transactions.
    formo?.transaction({ status: TransactionStatus.STARTED, chainId, address });

    try {
      const { signer } = createWalletTransactionSigner(session);

      const instruction = getTransferSolInstruction({
        source: signer,
        destination: DEMO_DESTINATION as any,
        amount: 1_000_000n, // 0.001 SOL
      });

      // Use prepareAndSend with the same signer as feePayer to avoid
      // "multiple distinct signers" error
      pool.replaceInstructions([instruction]);
      const signature = await pool.prepareAndSend({ feePayer: signer });

      const sigStr = signature?.toString();
      formo?.transaction({ status: TransactionStatus.CONFIRMED, chainId, address, transactionHash: sigStr });

      toast.success("Transaction Sent!", {
        description: `Successfully sent 0.001 SOL via useTransactionPool`,
        action: {
          label: "View",
          onClick: () => window.open(
            `https://explorer.solana.com/tx/${signature}?cluster=${cluster}`,
            "_blank"
          ),
        },
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      // Emit REJECTED for any failure so STARTED always has a terminal event
      formo?.transaction({ status: TransactionStatus.REJECTED, chainId, address });
      toast.error("Transaction Failed", { description: errorMessage });
    } finally {
      pool.reset();
      setIsLoading(false);
    }
  }, [status, session, wallet, pool, cluster, formo, endpoint]);

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
