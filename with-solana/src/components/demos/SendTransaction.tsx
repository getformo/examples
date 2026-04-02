"use client";

import { FC, useCallback, useState } from "react";
import { useSolTransfer, useWalletConnection, useClientStore } from "@solana/react-hooks";
import { useFormo } from "@/contexts/FormoProvider";
import { TransactionStatus } from "@formo/analytics";
import { clusterFromEndpoint, chainIdFromEndpoint, randomAddress } from "@/lib/solana";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

export const SendTransaction: FC = () => {
  const { wallet, status } = useWalletConnection();
  const solTransfer = useSolTransfer();
  const { formo } = useFormo();
  const endpoint = useClientStore((s) => s.cluster.endpoint);
  const [isLoading, setIsLoading] = useState(false);

  const cluster = clusterFromEndpoint(endpoint);

  const onClick = useCallback(async () => {
    if (status !== "connected" || !wallet) {
      toast.error("Wallet not connected!");
      return;
    }

    setIsLoading(true);
    const address = wallet.account.address.toString();
    const chainId = chainIdFromEndpoint(endpoint);

    // Track transaction started
    formo?.transaction({ status: TransactionStatus.STARTED, chainId, address });

    try {
      const destination = randomAddress();
      const signature = await solTransfer.send({
        destination,
        amount: 1_000_000n, // 0.001 SOL in lamports
      });

      // Track transaction broadcasted + confirmed
      const sigStr = signature?.toString();
      formo?.transaction({ status: TransactionStatus.BROADCASTED, chainId, address, transactionHash: sigStr });
      formo?.transaction({ status: TransactionStatus.CONFIRMED, chainId, address, transactionHash: sigStr });

      toast.success("Transaction Sent!", {
        description: `Successfully sent 0.001 SOL`,
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
  }, [wallet, status, solTransfer, cluster, formo, endpoint]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Send SOL Transfer
        </CardTitle>
        <CardDescription>
          Send 0.001 SOL using the useSolTransfer hook.
          Manually tracks: transaction_started → transaction_broadcasted → transaction_confirmed
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
            "Send 0.001 SOL"
          ) : (
            "Connect Wallet First"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
