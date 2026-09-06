import type { SolanaClient } from "@solana/client";
import { signature } from "@solana/kit";

const CONFIRMATION_TIMEOUT_MS = 30_000;

export async function waitForConfirmation(
  client: SolanaClient,
  transactionHash: string,
) {
  const deadline = Date.now() + CONFIRMATION_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const { value } = await client.runtime.rpc
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
