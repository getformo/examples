"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useSolanaClient } from "@solana/react-hooks";
import { TransactionStatus, useFormo } from "@formo/analytics";
import {
  TransactionFailedError,
  waitForConfirmation,
} from "@/lib/transactions";
import { toast } from "sonner";

export type PendingTransaction = {
  address: string;
  chainId: number;
  explorerCluster: string;
  hash: string;
};

type PendingTransactionConfirmationContextValue = {
  dismiss: () => void;
  isChecking: boolean;
  pendingTransaction: PendingTransaction | null;
  retryConfirmation: () => Promise<void>;
  setPendingTransaction: Dispatch<SetStateAction<PendingTransaction | null>>;
};

const PendingTransactionConfirmationContext =
  createContext<PendingTransactionConfirmationContextValue | null>(null);

export function PendingTransactionConfirmationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const client = useSolanaClient();
  const formo = useFormo();
  const [pendingTransaction, setPendingTransaction] =
    useState<PendingTransaction | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const retryConfirmation = useCallback(async () => {
    if (!pendingTransaction) return;

    setIsChecking(true);
    try {
      await waitForConfirmation(client, pendingTransaction.hash);
      setPendingTransaction(null);
      formo?.transaction({
        status: TransactionStatus.CONFIRMED,
        chainId: pendingTransaction.chainId,
        address: pendingTransaction.address,
        transactionHash: pendingTransaction.hash,
      });
      toast.success("Transaction Confirmed!", {
        action: {
          label: "View",
          onClick: () =>
            window.open(
              `https://explorer.solana.com/tx/${pendingTransaction.hash}?cluster=${pendingTransaction.explorerCluster}`,
              "_blank",
            ),
        },
      });
    } catch (error: unknown) {
      if (error instanceof TransactionFailedError) {
        setPendingTransaction(null);
        formo?.transaction({
          status: TransactionStatus.REVERTED,
          chainId: pendingTransaction.chainId,
          address: pendingTransaction.address,
          transactionHash: pendingTransaction.hash,
        });
        toast.error("Transaction Failed", { description: error.message });
        return;
      }

      toast.warning("Confirmation still pending", {
        description: "Try again later or view the transaction in Explorer.",
      });
    } finally {
      setIsChecking(false);
    }
  }, [client, formo, pendingTransaction]);

  const dismiss = useCallback(() => setPendingTransaction(null), []);

  const value = {
    dismiss,
    isChecking,
    pendingTransaction,
    retryConfirmation,
    setPendingTransaction,
  };

  return createElement(
    PendingTransactionConfirmationContext.Provider,
    { value },
    children,
  );
}

export function usePendingTransactionConfirmation() {
  const context = useContext(PendingTransactionConfirmationContext);
  if (!context) {
    throw new Error(
      "usePendingTransactionConfirmation must be used within PendingTransactionConfirmationProvider",
    );
  }
  return context;
}
