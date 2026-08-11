import { useState } from "react";
import {
  bigDecimal,
  evmAddress,
  type ReserveId,
  useSupply,
  useWithdraw,
} from "@aave/react";
import {
  useSendTransaction,
  useSignTypedData,
} from "@aave/react/viem";
import { usePublicClient, useWalletClient } from "wagmi";
import { useFormo } from "@formo/analytics";

interface UsdcReserve {
  id: ReserveId;
  chainId: number;
  supplyCapReached: boolean;
}

interface UsdcSupplyData {
  rawBalance: string;
  apy: string;
}

export function useAaveOperations(
  usdcReserve: UsdcReserve | null,
  usdcSupplyData: UsdcSupplyData,
  refetchUsdcBalance: () => Promise<unknown>,
  refreshUserSupplies: () => Promise<void>,
) {
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();
  const formo = useFormo();
  const [sendTransaction, sending] = useSendTransaction(walletClient);
  const [signTypedData, signing] = useSignTypedData(walletClient);
  const [supply, supplying] = useSupply((plan) => {
    switch (plan.__typename) {
      case "TransactionRequest":
        return sendTransaction(plan);
      case "Erc20Approval":
        return plan.bySignature
          ? signTypedData(plan.bySignature)
          : sendTransaction(plan.byTransaction);
      case "PreContractActionRequired":
        return sendTransaction(plan.transaction);
    }
  });
  const [withdraw, withdrawing] = useWithdraw((plan) => {
    switch (plan.__typename) {
      case "TransactionRequest":
        return sendTransaction(plan);
      case "PreContractActionRequired":
        return sendTransaction(plan.transaction);
    }
  });
  const [isSupplying, setIsSupplying] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [supplyError, setSupplyError] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const handleDepositToAave = async () => {
    if (!walletClient?.account?.address || !usdcReserve) return;

    setIsSupplying(true);
    setSupplyError(null);
    try {
      const result = await supply({
        reserve: usdcReserve.id,
        amount: { erc20: { value: bigDecimal(0.1) } },
        sender: evmAddress(walletClient.account.address),
      });

      if (result.isErr()) {
        setSupplyError(result.error.message);
        return;
      }

      if (!publicClient) {
        setSupplyError("Unable to confirm the supply transaction");
        return;
      }
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: result.value.txHash,
      });
      if (receipt.status !== "success") {
        setSupplyError("Supply transaction reverted on-chain");
        return;
      }
      formo?.track("aave_supply", {
        asset: "USDC",
        amount: "0.1",
        reserve: usdcReserve.id,
        chainId: usdcReserve.chainId,
        txHash: result.value.txHash,
      });
      await refetchUsdcBalance();
      await refreshUserSupplies();
    } catch (error) {
      setSupplyError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsSupplying(false);
    }
  };

  const handleWithdrawFromAave = async () => {
    if (!walletClient?.account?.address || !usdcReserve) return;
    if (!usdcSupplyData.rawBalance || Number(usdcSupplyData.rawBalance) === 0) {
      setWithdrawError("No USDC supply to withdraw");
      return;
    }

    setIsWithdrawing(true);
    setWithdrawError(null);
    try {
      const result = await withdraw({
        reserve: usdcReserve.id,
        amount: { erc20: { max: true } },
        sender: evmAddress(walletClient.account.address),
      });

      if (result.isErr()) {
        setWithdrawError(result.error.message);
        return;
      }

      if (!publicClient) {
        setWithdrawError("Unable to confirm the withdrawal transaction");
        return;
      }
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: result.value.txHash,
      });
      if (receipt.status !== "success") {
        setWithdrawError("Withdraw transaction reverted on-chain");
        return;
      }
      formo?.track("aave_withdraw", {
        asset: "USDC",
        amount: usdcSupplyData.rawBalance,
        reserve: usdcReserve.id,
        chainId: usdcReserve.chainId,
        txHash: result.value.txHash,
      });
      await refetchUsdcBalance();
      await refreshUserSupplies();
    } catch (error) {
      setWithdrawError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsWithdrawing(false);
    }
  };

  const isLoading =
    supplying.loading ||
    withdrawing.loading ||
    sending.loading ||
    signing.loading ||
    isSupplying ||
    isWithdrawing;

  return {
    handleDepositToAave,
    handleWithdrawFromAave,
    isLoading,
    isSupplying,
    isWithdrawing,
    supplying,
    withdrawing,
    supplyError,
    withdrawError,
  };
}
