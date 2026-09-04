"use client";

import { useCallback, useState } from "react";
import { address, lamports } from "@solana/kit";
import { useConnectedWallet } from "@solana/kit-plugin-wallet/react";
import { getTransferSolInstruction } from "@solana-program/system";
import { TransactionStatus, useFormo } from "@formo/analytics";
import { useCurrentCluster } from "@/hooks/useCurrentCluster";
import { useSolanaApp } from "@/context/SolanaAppProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";

const DEMO_DESTINATION = "Ff34MXWdgNsEJ1kJFj9cXmrEe7y2P93b95mGu5CJjBQJ";

export function SendTransaction() {
  const { client } = useSolanaApp();
  const connected = useConnectedWallet(client);
  const formo = useFormo();
  const { chainId, explorerCluster } = useCurrentCluster();
  const [isLoading, setIsLoading] = useState(false);

  const onClick = useCallback(async () => {
    if (!connected?.signer) {
      toast.error("Wallet not connected!");
      return;
    }

    setIsLoading(true);
    const walletAddress = connected.account.address.toString();
    formo?.transaction({
      status: TransactionStatus.STARTED,
      chainId,
      address: walletAddress,
    });

    try {
      const transfer = getTransferSolInstruction({
        source: connected.signer,
        destination: address(DEMO_DESTINATION),
        amount: lamports(1_000_000n),
      });
      const result = await client.sendTransaction([transfer]);
      const signature = result.context.signature.toString();

      formo?.transaction({
        status: TransactionStatus.CONFIRMED,
        chainId,
        address: walletAddress,
        transactionHash: signature,
      });

      toast.success("Transaction sent!", {
        description: "Successfully sent 0.001 SOL with Solana Kit",
        action: {
          label: "View",
          onClick: () =>
            window.open(
              `https://explorer.solana.com/tx/${signature}?cluster=${explorerCluster}`,
              "_blank"
            ),
        },
      });
    } catch (error: unknown) {
      formo?.transaction({
        status: TransactionStatus.REJECTED,
        chainId,
        address: walletAddress,
      });
      toast.error("Transaction failed", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [chainId, client, connected, explorerCluster, formo]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Send SOL Transfer
        </CardTitle>
        <CardDescription>
          Build and send 0.001 SOL with the Solana Kit client.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="gradient"
          onClick={() => void onClick()}
          disabled={!connected?.signer || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : connected?.signer ? (
            "Send 0.001 SOL"
          ) : (
            "Connect Wallet First"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
