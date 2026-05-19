"use client";

import { useState } from "react";
import { useWallet, EVMWallet } from "@crossmint/client-sdk-react-ui";
import { useFormo, SignatureStatus } from "@formo/analytics";
import { cn } from "@/lib/utils";
import { CHAIN_ID } from "@/lib/chain";

const SIGN_MESSAGE = "Formo Analytics — test signature";

/**
 * Formo Event Tester
 *
 * Buttons that emit Formo events on demand so you can watch them in the
 * browser console (the SDK logger is enabled in `providers.tsx`) and in the
 * Formo dashboard:
 *
 *   - Sign message       → `signature` event  (free — signing costs no gas)
 *   - Track custom event → `track` event      (free)
 *
 * `page`, `identify` and `connect` fire automatically on login (see
 * `formo-bridge.tsx`); `transaction` fires from the Transfer card.
 */
export function FormoEventTester() {
  const { wallet } = useWallet();
  const formo = useFormo();
  const [status, setStatus] = useState<string | null>(null);
  const [isSigning, setIsSigning] = useState(false);

  // Signing needs a ready wallet.
  if (!wallet) return null;
  const address = wallet.address;

  const handleSignMessage = async () => {
    setStatus(null);
    setIsSigning(true);

    // Formo: signature requested.
    formo?.signature({
      status: SignatureStatus.REQUESTED,
      chainId: CHAIN_ID,
      address,
      message: SIGN_MESSAGE,
    });

    try {
      // The embedded wallet is a smart wallet — view it as an EVM wallet to
      // access signMessage().
      await EVMWallet.from(wallet).signMessage({ message: SIGN_MESSAGE });

      // Formo: signature confirmed.
      formo?.signature({
        status: SignatureStatus.CONFIRMED,
        chainId: CHAIN_ID,
        address,
        message: SIGN_MESSAGE,
      });
      setStatus("signature event sent ✓");
    } catch {
      // Formo: signature rejected.
      formo?.signature({
        status: SignatureStatus.REJECTED,
        chainId: CHAIN_ID,
        address,
        message: SIGN_MESSAGE,
      });
      setStatus("Signature request rejected");
    } finally {
      setIsSigning(false);
    }
  };

  const handleTrackEvent = async () => {
    setStatus(null);
    await formo?.track("event_tester_clicked", { source: "with-crossmint" });
    setStatus("track event sent ✓");
  };

  const buttonClass =
    "w-full py-3 px-4 rounded-full text-sm font-medium transition-colors bg-gray-900 text-white hover:bg-gray-800 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed";

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">Formo event tester</h3>
          <p className="text-sm text-gray-500">
            Emit Formo events on demand and watch them in the console and
            dashboard.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleSignMessage}
            disabled={isSigning}
            className={buttonClass}
          >
            {isSigning ? "Signing..." : "Sign message (signature)"}
          </button>
          <button onClick={handleTrackEvent} className={cn(buttonClass)}>
            Track custom event (track)
          </button>
        </div>

        {status ? (
          <p className="text-sm text-gray-600 text-center">{status}</p>
        ) : null}
      </div>
    </div>
  );
}
