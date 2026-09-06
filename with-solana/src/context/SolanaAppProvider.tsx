"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { ClientProvider } from "@solana/react";
import type { SolanaCluster } from "@formo/analytics";
import {
  configuredCluster,
  createSolanaClient,
  type AppClient,
} from "@/lib/solana";

interface SolanaAppContextValue {
  client: AppClient;
  cluster: SolanaCluster;
  setCluster: (cluster: SolanaCluster) => void;
}

const SolanaAppContext = createContext<SolanaAppContextValue | undefined>(
  undefined
);

export function SolanaAppProvider({ children }: { children: React.ReactNode }) {
  const [cluster, setCluster] = useState<SolanaCluster>(configuredCluster);
  const client = useMemo(() => createSolanaClient(cluster), [cluster]);
  const value = useMemo(
    () => ({ client, cluster, setCluster }),
    [client, cluster]
  );

  return (
    <SolanaAppContext.Provider value={value}>
      <ClientProvider client={client}>{children}</ClientProvider>
    </SolanaAppContext.Provider>
  );
}

export function useSolanaApp(): SolanaAppContextValue {
  const value = useContext(SolanaAppContext);
  if (!value) {
    throw new Error("useSolanaApp must be used within SolanaAppProvider");
  }
  return value;
}
