"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  ReactNode,
} from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { FormoAnalytics } from "@formo/analytics";
import { useNetworkConfiguration } from "./NetworkConfigurationProvider";
import { toast } from "sonner";

interface FormoContextState {
  formo: FormoAnalytics | null;
  isInitialized: boolean;
  error: string | null;
}

const FormoContext = createContext<FormoContextState>({
  formo: null,
  isInitialized: false,
  error: null,
});

export function useFormo() {
  return useContext(FormoContext);
}

export function FormoProvider({ children }: { children: ReactNode }) {
  const wallet = useWallet();
  const { connection } = useConnection();
  const { networkConfiguration } = useNetworkConfiguration();
  const [formo, setFormo] = useState<FormoAnalytics | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref to hold the current wallet to avoid re-init on every wallet state change
  const walletRef = useRef(wallet);
  walletRef.current = wallet;

  // Initialize the SDK once
  useEffect(() => {
    let instance: FormoAnalytics | null = null;
    let mounted = true;

    const initFormo = async () => {
      const writeKey = process.env.NEXT_PUBLIC_FORMO_WRITE_KEY;

      if (!writeKey || writeKey === "your_write_key_here") {
        const errorMsg = "Missing NEXT_PUBLIC_FORMO_WRITE_KEY";
        setError(errorMsg);
        console.warn("[Formo]", errorMsg);
        return;
      }

      try {
        // NOTE: The `solana` option requires an SDK build with Solana support.
        // Using type assertion until @formo/analytics publishes Solana types.
        instance = await FormoAnalytics.init(writeKey, {
          tracking: true,
          logger: {
            enabled: true,
            levels: ["debug", "info", "warn", "error"] as ("debug" | "info" | "warn" | "error")[],
          },
          solana: {
            wallet: walletRef.current as any,
            connection,
            cluster: networkConfiguration,
          },
        } as any);

        if (mounted) {
          setFormo(instance);
          setIsInitialized(true);
          setError(null);
          console.log("[Formo] Initialized with Solana support", {
            cluster: networkConfiguration,
            endpoint: connection.rpcEndpoint,
          });
        } else {
          instance.cleanup();
        }
      } catch (err) {
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : "Unknown error";
          setError(errorMessage);
          console.error("[Formo] Initialization failed:", err);
        }
      }
    };

    initFormo();

    return () => {
      mounted = false;
      if (instance) {
        instance.cleanup();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Initialize once — network/connection updates handled below

  // When network changes, update the SDK instead of re-creating it
  // NOTE: `.solana` requires an SDK build with Solana support (types not yet published)
  useEffect(() => {
    if (!(formo as any)?.solana) return;

    (formo as any).solana.setCluster(networkConfiguration);
    (formo as any).solana.setConnection(connection);
    console.log("[Formo] Network updated", {
      cluster: networkConfiguration,
      endpoint: connection.rpcEndpoint,
    });
  }, [formo, networkConfiguration, connection]);

  // Update SDK when wallet state changes (connect/disconnect/switch)
  // The SDK's setWallet() has a fast-path that skips teardown when the
  // inner adapter hasn't changed, so passing the full wallet object is safe.
  useEffect(() => {
    if (!(formo as any)?.solana) return;

    (formo as any).solana.setWallet(wallet);
  }, [formo, wallet]);

  // Show toast notifications for wallet events
  useEffect(() => {
    if (!isInitialized) return;

    if (wallet.connected && wallet.publicKey) {
      toast.success("Wallet Connected", {
        description: `${wallet.publicKey.toBase58().slice(0, 8)}...${wallet.publicKey.toBase58().slice(-8)}`,
      });
    }
  }, [wallet.connected, wallet.publicKey, isInitialized]);

  return (
    <FormoContext.Provider value={{ formo, isInitialized, error }}>
      {children}
    </FormoContext.Provider>
  );
}
