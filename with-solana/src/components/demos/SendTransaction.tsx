"use client";

import { useCallback, useState } from "react";
import {
  address,
  appendTransactionMessageInstruction,
  createTransactionMessage,
  getBase58Decoder,
  isTransactionSendingSigner,
  lamports,
  pipe,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signAndSendTransactionMessageWithSigners,
  signature,
} from "@solana/kit";
import { useConnectedWallet } from "@solana/kit-plugin-wallet/react";
import { getTransferSolInstruction } from "@solana-program/system";
import { TransactionStatus, useFormo } from "@formo/analytics";
import { useCurrentCluster } from "@/hooks/useCurrentCluster";
import { useSolanaApp } from "@/context/SolanaAppProvider";
import {
  SOLANA_BALANCE_CHANGED_EVENT,
  type AppClient,
} from "@/lib/solana";
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
const CONFIRMATION_TIMEOUT_MS = 30_000;

async function waitForConfirmation(client: AppClient, transactionHash: string) {
  const deadline = Date.now() + CONFIRMATION_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const { value } = await client.rpc
      .getSignatureStatuses([signature(transactionHash)])
      .send();
    const status = value[0];

    if (status?.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
    }
    if (
      status?.confirmationStatus === "confirmed" ||
      status?.confirmationStatus === "finalized"
    ) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  throw new Error("Timed out waiting for transaction confirmation");
}

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
    const signer = connected.signer;
    const walletAddress = connected.account.address.toString();
    formo?.transaction({
      status: TransactionStatus.STARTED,
      chainId,
      address: walletAddress,
    });

    try {
      const transfer = getTransferSolInstruction({
        source: signer,
        destination: address(DEMO_DESTINATION),
        amount: lamports(1_000_000n),
      });
      let transactionHash: string;

      // This path carries the configured chain into multichain wallet prompts.
      if (isTransactionSendingSigner(signer)) {
        const { value: latestBlockhash } = await client.rpc
          .getLatestBlockhash()
          .send();
        const message = pipe(
          createTransactionMessage({ version: 0 }),
          (m) => setTransactionMessageFeePayerSigner(signer, m),
          (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m),
          (m) => appendTransactionMessageInstruction(transfer, m)
        );
        const signatureBytes =
          await signAndSendTransactionMessageWithSigners(message);
        transactionHash = getBase58Decoder().decode(signatureBytes);
        await waitForConfirmation(client, transactionHash);
      } else {
        const result = await client.sendTransaction([transfer]);
        transactionHash = result.context.signature.toString();
      }

      formo?.transaction({
        status: TransactionStatus.CONFIRMED,
        chainId,
        address: walletAddress,
        transactionHash,
      });
      window.dispatchEvent(new Event(SOLANA_BALANCE_CHANGED_EVENT));

      toast.success("Transaction sent!", {
        description: "Successfully sent 0.001 SOL with Solana Kit",
        action: {
          label: "View",
          onClick: () =>
            window.open(
              `https://explorer.solana.com/tx/${transactionHash}?cluster=${explorerCluster}`,
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
