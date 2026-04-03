"use client";

import { FC, useCallback, useState } from "react";
import { useSolTransfer, useWalletConnection, useClientStore } from "@solana/react-hooks";
import { useFormo } from "@/contexts/FormoProvider";
import { TransactionStatus } from "@formo/analytics";
import { clusterFromEndpoint, chainIdFromEndpoint } from "@/lib/solana";

// Throwaway devnet address for demo transfers
const DEMO_DESTINATION = "Ff34MXWdgNsEJ1kJFj9cXmrEe7y2P93b95mGu5CJjBQJ";
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

    // Manual transaction tracking — needed because useSolTransfer bypasses
    // the framework-kit store's state.transactions (uses helper.send() directly).
    // If the store were populated, SolanaStoreHandler would autocapture these.
    formo?.transaction({ status: TransactionStatus.STARTED, chainId, address });

    try {
      const signature = await solTransfer.send({
        destination: DEMO_DESTINATION,
        amount: 1_000_000n, // 0.001 SOL in lamports
      });

      const sigStr = signature?.toString();
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
      // Emit REJECTED for any failure so STARTED always has a terminal event
      formo?.transaction({ status: TransactionStatus.REJECTED, chainId, address });
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
