"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { FormoAnalytics } from "@formo/analytics";
import { useWalletConnection } from "@solana/react-hooks";
import { client } from "@/lib/solana";
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
  const { wallet, status } = useWalletConnection();
  const [formo, setFormo] = useState<FormoAnalytics | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize the SDK once with the framework-kit store
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
        instance = await FormoAnalytics.init(writeKey, {
          tracking: true,
          logger: {
            enabled: true,
            levels: ["debug", "info", "warn", "error"],
          },
          solana: {
            store: client.store as any,
          },
        });

        if (mounted) {
          setFormo(instance);
          setIsInitialized(true);
          setError(null);
          console.log("[Formo] Initialized with framework-kit store");
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
  }, []);

  // Show toast notifications for wallet events
  useEffect(() => {
    if (!isInitialized) return;

    if (status === "connected" && wallet?.account.address) {
      const addr = wallet.account.address.toString();
      toast.success("Wallet Connected", {
        description: `${addr.slice(0, 8)}...${addr.slice(-8)}`,
      });
    }
  }, [status, wallet?.account.address, isInitialized]);

  return (
    <FormoContext.Provider value={{ formo, isInitialized, error }}>
      {children}
    </FormoContext.Provider>
  );
}
