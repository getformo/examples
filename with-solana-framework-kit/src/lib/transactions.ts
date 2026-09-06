import type { SolanaClient } from "@solana/client";
import { signature } from "@solana/kit";

const CONFIRMATION_TIMEOUT_MS = 30_000;

export class TransactionFailedError extends Error {
  constructor(details: unknown) {
    super(`Transaction failed: ${JSON.stringify(details)}`);
    this.name = "TransactionFailedError";
  }
}

export class TransactionConfirmationTimeoutError extends Error {
  constructor() {
    super("Transaction confirmation is still pending");
    this.name = "TransactionConfirmationTimeoutError";
  }
}

export async function waitForConfirmation(
  client: SolanaClient,
  transactionHash: string,
) {
  const deadline = Date.now() + CONFIRMATION_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const remainingMs = deadline - Date.now();

    try {
      const { value } = await client.runtime.rpc
        .getSignatureStatuses([signature(transactionHash)])
        .send({ abortSignal: AbortSignal.timeout(remainingMs) });
      const status = value[0];

      if (status?.err) {
        throw new TransactionFailedError(status.err);
      }
      if (
        status?.confirmationStatus === "confirmed" ||
        status?.confirmationStatus === "finalized"
      ) {
        return;
      }
    } catch (error) {
      if (error instanceof TransactionFailedError) throw error;
    }

    const delayMs = Math.min(1_000, deadline - Date.now());
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new TransactionConfirmationTimeoutError();
}
