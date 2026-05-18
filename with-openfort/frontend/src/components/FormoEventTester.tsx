import { useState } from "react";
import { useAccount, useSendTransaction, useSignMessage } from "wagmi";
import { useFormo } from "@formo/analytics";

/**
 * Formo Event Tester
 *
 * Buttons that trigger Formo event types on demand so you can watch them in
 * the browser console (the SDK logger is enabled in Providers.tsx) and in the
 * Formo dashboard:
 *
 * - Sign message       -> `signature` event   (free — signing costs no gas)
 * - Send 0 ETH to self -> `transaction` event (zero value; only needs gas,
 *                          which is sponsored if an Openfort fee policy is set)
 * - Track custom event -> `track` event       (free)
 *
 * The `page`, `connect`, `disconnect` and `chain` events are captured
 * automatically, and `identify` fires on connect (see App.tsx).
 */
export function FormoEventTester() {
  const { address, isConnected } = useAccount();
  const formo = useFormo();
  const { signMessageAsync, isPending: isSigning } = useSignMessage();
  const { sendTransactionAsync, isPending: isSending } = useSendTransaction();
  const [status, setStatus] = useState<string | null>(null);

  // Signing and sending need a connected wallet.
  if (!isConnected || !address) return null;

  const handleSignMessage = async () => {
    setStatus(null);
    try {
      await signMessageAsync({ message: "Formo Analytics — test signature" });
      setStatus("signature event sent ✓");
    } catch {
      setStatus("Signature request rejected");
    }
  };

  const handleSendZeroTx = async () => {
    setStatus(null);
    try {
      // Zero-value self-transfer: emits a `transaction` event without moving
      // any funds. Only network gas is required (sponsored when an Openfort
      // fee policy is configured).
      await sendTransactionAsync({ to: address, value: 0n });
      setStatus("transaction event sent ✓");
    } catch {
      setStatus("Transaction rejected or failed — the wallet needs a little gas");
    }
  };

  const handleTrackEvent = async () => {
    setStatus(null);
    try {
      await formo?.track("event_tester_clicked", { source: "with-openfort" });
      setStatus("track event sent ✓");
    } catch {
      setStatus("Track event failed");
    }
  };

  const buttonClass =
    "w-full bg-white text-black font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="bg-neutral-900 rounded-2xl border border-neutral-700 shadow-xl p-8 mb-6 flex flex-col items-center space-y-4 w-full max-w-md">
      <div className="text-center">
        <h2 className="text-white text-lg font-semibold">Formo Event Tester</h2>
        <p className="text-neutral-400 text-xs mt-1">
          Trigger Formo events and watch them in the console and dashboard.
        </p>
      </div>
      <div className="w-full space-y-3">
        <button
          onClick={handleSignMessage}
          disabled={isSigning}
          className={buttonClass}
        >
          {isSigning ? "Signing..." : "Sign message (signature)"}
        </button>
        <button
          onClick={handleSendZeroTx}
          disabled={isSending}
          className={buttonClass}
        >
          {isSending ? "Sending..." : "Send 0 ETH to self (transaction)"}
        </button>
        <button onClick={handleTrackEvent} className={buttonClass}>
          Track custom event (track)
        </button>
      </div>
      {status && <p className="text-neutral-300 text-sm">{status}</p>}
    </div>
  );
}
