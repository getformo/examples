"use client";

import { useEffect, useRef } from "react";
import { useWallet, useCrossmintAuth } from "@crossmint/client-sdk-react-ui";
import { useFormo } from "@formo/analytics";
import { CHAIN_ID } from "@/lib/chain";

/**
 * Bridges the Crossmint wallet lifecycle to Formo Analytics.
 *
 * Crossmint embedded wallets are smart wallets: there is no `window.ethereum`
 * and no wagmi config for Formo to hook into, so wallet events can't be
 * auto-captured. This component emits the lifecycle events manually:
 *
 *   - `identify` + `connect` — once the embedded wallet is ready
 *   - `disconnect`           — when the user logs out
 *
 * `signature` and `transaction` events are emitted from the components that
 * perform those actions (see `formo-event-tester.tsx` and `transfer.tsx`).
 *
 * Renders nothing.
 */
export function FormoCrossmintBridge() {
  const formo = useFormo();
  const { wallet } = useWallet();
  const { status: authStatus, user } = useCrossmintAuth();

  const address = wallet?.address;

  // The address we've already emitted connect/identify for (dedupes effects).
  const connectedAddress = useRef<string | null>(null);
  // The last logged-in address, so we can name it in the disconnect event.
  const lastAddress = useRef<string | null>(null);

  // identify + connect — fires once when the embedded wallet becomes available.
  // We wait for user?.id so identify() is never emitted without the userId —
  // otherwise a race where user loads after the wallet would silently drop the
  // stitching info.
  useEffect(() => {
    if (!formo || !address || !user?.id || authStatus !== "logged-in") return;
    if (connectedAddress.current === address) return;

    connectedAddress.current = address;
    lastAddress.current = address;

    // identify ties the anonymous visitor to their wallet address and their
    // Crossmint user id (so sessions before/after login stitch together).
    formo.identify({ address, userId: user.id });

    // connect records the wallet "connection" (login + wallet ready).
    formo.connect({ chainId: CHAIN_ID, address });
  }, [formo, address, authStatus, user]);

  // disconnect — fires once when the user logs out.
  useEffect(() => {
    if (!formo) return;
    if (authStatus === "logged-out" && connectedAddress.current != null) {
      formo.disconnect({
        chainId: CHAIN_ID,
        address: lastAddress.current ?? undefined,
      });
      connectedAddress.current = null;
      lastAddress.current = null;
    }
  }, [formo, authStatus]);

  return null;
}
