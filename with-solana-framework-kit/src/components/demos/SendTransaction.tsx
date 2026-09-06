"use client";

import { FC, useCallback, useState } from "react";
import {
  useSolanaClient,
  useSolTransfer,
  useWalletConnection,
} from "@solana/react-hooks";
import { TransactionStatus, useFormo } from "@formo/analytics";
import { useCurrentCluster } from "@/hooks/useCurrentCluster";
import {
  TransactionConfirmationTimeoutError,
  TransactionFailedError,
  waitForConfirmation,
} from "@/lib/transactions";
import { usePendingTransactionConfirmation } from "@/hooks/usePendingTransactionConfirmation";
import { PendingConfirmationActions } from "@/components/demos/PendingConfirmationActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

// Throwaway devnet address for demo transfers
const DEMO_DESTINATION = "Ff34MXWdgNsEJ1kJFj9cXmrEe7y2P93b95mGu5CJjBQJ";

export const SendTransaction: FC = () => {
  const { wallet, status } = useWalletConnection();
  const client = useSolanaClient();
  const solTransfer = useSolTransfer();
  const formo = useFormo();
  const { chainId, cluster, explorerCluster } = useCurrentCluster();
  const [isLoading, setIsLoading] = useState(false);
  const {
    dismiss,
    isChecking,
    pendingTransaction,
    retryConfirmation,
    setPendingTransaction,
  } = usePendingTransactionConfirmation();

  const onClick = useCallback(async () => {
    if (status !== "connected" || !wallet) {
      toast.error("Wallet not connected!");
      return;
    }
    if (cluster !== "devnet") {
      toast.error("This demo transfer is available on Devnet only");
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
      const signature = await solTransfer.send({
        destination: DEMO_DESTINATION,
        amount: 1_000_000n, // 0.001 SOL in lamports
      });
      transactionHash = signature.toString();
      setPendingTransaction({
        address: walletAddress,
        chainId,
        explorerCluster,
        hash: transactionHash,
      });

      formo?.transaction({
        status: TransactionStatus.BROADCASTED,
        chainId,
        address: walletAddress,
        transactionHash,
      });
      await waitForConfirmation(client, transactionHash);
      setPendingTransaction(null);
      formo?.transaction({
        status: TransactionStatus.CONFIRMED,
        chainId,
        address: walletAddress,
        transactionHash,
      });

      toast.success("Transaction Sent!", {
        description: `Successfully sent 0.001 SOL`,
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
      if (transactionHash && !(error instanceof TransactionFailedError)) {
        toast.warning("Confirmation pending", {
          description:
            error instanceof TransactionConfirmationTimeoutError
              ? "The transfer was submitted but could not be confirmed in time."
              : "The transfer was submitted but its status could not be checked.",
          action: {
            label: "View",
            onClick: () =>
              window.open(
                `https://explorer.solana.com/tx/${transactionHash}?cluster=${explorerCluster}`,
                "_blank"
              ),
          },
        });
        return;
      }

      setPendingTransaction(null);
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
      setIsLoading(false);
    }
  }, [chainId, client, cluster, explorerCluster, formo, solTransfer, status, wallet]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Send SOL Transfer
        </CardTitle>
        <CardDescription>
          Send 0.001 SOL using the useSolTransfer hook.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          variant="gradient"
          onClick={onClick}
          disabled={
            status !== "connected" ||
            isLoading ||
            isChecking ||
            pendingTransaction != null ||
            cluster !== "devnet"
          }
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : pendingTransaction ? (
            "Confirmation pending"
          ) : cluster !== "devnet" ? (
            "Devnet only"
          ) : status === "connected" ? (
            "Send 0.001 SOL"
          ) : (
            "Connect Wallet First"
          )}
        </Button>
        {pendingTransaction && (
          <PendingConfirmationActions
            canCheck={!isLoading && cluster === "devnet"}
            isChecking={isChecking || isLoading}
            onDismiss={dismiss}
            onRetry={() => void retryConfirmation()}
          />
        )}
      </CardContent>
    </Card>
  );
};
