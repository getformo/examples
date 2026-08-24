"use client";

import * as React from "react";
import { useAccount } from "wagmi";
import { useCapabilities, useSendCalls, useWaitForCallsStatus } from "wagmi/experimental";

/**
 * EIP-5792: send two 0 ETH self-calls as ONE batch through
 * `wallet_sendCalls`, the method smart accounts use instead of
 * `eth_sendTransaction`.
 *
 * Formo reports one `transaction` event PER CALL - two here - sharing a
 * `batch_id`, so per-contract attribution survives batching. A wallet
 * without EIP-5792 support rejects the request; for a plain EOA that
 * rejection is the expected outcome and worth seeing too.
 */
export function SendBatch() {
  const { address } = useAccount();
  const { data, error, isPending, sendCalls } = useSendCalls();
  const batchId = typeof data === "string" ? data : data?.id;
  const { data: status } = useWaitForCallsStatus({ id: batchId, query: { enabled: !!batchId } });
  // EIP-5792 discovery: wallet_getCapabilities, keyed by chain. A plain EOA
  // typically answers "unsupported" or rejects the method; both are honest.
  const { data: capabilities } = useCapabilities({ account: address, query: { enabled: !!address } });
  const atomicByChain = capabilities
    ? Object.entries(capabilities as Record<string, { atomic?: { status?: string }; atomicBatch?: { supported?: boolean } }>)
        .map(([chain, c]) => `${chain}: ${c.atomic?.status ?? (c.atomicBatch?.supported ? "supported" : "unsupported")}`)
        .join(", ")
    : undefined;

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        className="btn btn-secondary btn-sm"
        disabled={!address || isPending}
        onClick={() =>
          address &&
          sendCalls({
            calls: [
              { to: address, value: BigInt(0) },
              { to: address, value: BigInt(0) },
            ],
          })
        }
      >
        {isPending ? "Sending batch..." : "Send Batch (2 calls) - EIP-5792"}
      </button>
      {atomicByChain && (
        <p className="text-xs m-0 opacity-70">Atomic capability {atomicByChain}</p>
      )}
      {batchId && (
        <p className="text-xs break-all m-0">
          Batch {batchId.slice(0, 18)}…{" "}
          {status
            ? `status: ${status.status} (${(status as { statusCode?: number }).statusCode ?? "-"}), atomic: ${String((status as { atomic?: boolean }).atomic)}, receipts: ${status.receipts?.length ?? 0}`
            : "waiting for wallet_getCallsStatus"}
        </p>
      )}
      {error && (
        <p className="text-xs text-error m-0">
          Rejected: {error.message.split(".")[0]} (expected for a wallet without EIP-5792)
        </p>
      )}
    </div>
  );
}
