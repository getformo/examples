"use client";

import { FC, useCallback, useState } from "react";
import {
  useWalletConnection,
  useWalletSession,
  useSendTransaction,
  useClientStore,
} from "@solana/react-hooks";
import { createWalletTransactionSigner } from "@solana/client";
import { getTransferSolInstruction } from "@solana-program/system";
import { useFormo } from "@/contexts/FormoProvider";
import { TransactionStatus } from "@formo/analytics";
import { clusterFromEndpoint, chainIdFromEndpoint, randomAddress } from "@/lib/solana";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Zap } from "lucide-react";

export const SendVersionedTransaction: FC = () => {
  const { wallet, status } = useWalletConnection();
  const session = useWalletSession();
  const sendTx = useSendTransaction();
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

    formo?.transaction({ status: TransactionStatus.STARTED, chainId, address });

    try {
      const { signer } = createWalletTransactionSigner(session);

      const instruction = getTransferSolInstruction({
        source: signer,
        destination: randomAddress() as any,
        amount: 1_000_000n, // 0.001 SOL
      });

      const signature = await sendTx.send({ instructions: [instruction] });

      const sigStr = signature?.toString();
      formo?.transaction({ status: TransactionStatus.BROADCASTED, chainId, address, transactionHash: sigStr });
      formo?.transaction({ status: TransactionStatus.CONFIRMED, chainId, address, transactionHash: sigStr });

      toast.success("Transaction Sent!", {
        description: `Successfully sent 0.001 SOL via useSendTransaction`,
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
      const isUserRejection = errorMessage.includes("User rejected") || errorMessage.includes("rejected");
      if (isUserRejection) {
        formo?.transaction({ status: TransactionStatus.REJECTED, chainId, address });
      }
      toast.error("Transaction Failed", { description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  }, [status, session, wallet, sendTx, cluster, formo, endpoint]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Send Transaction (Instructions)
        </CardTitle>
        <CardDescription>
          Build a transaction from instructions using useSendTransaction.
          Tests modern instruction-based transaction format.
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
            "Send via Instructions"
          ) : (
            "Connect Wallet First"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
