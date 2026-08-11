import { useUser } from "@openfort/react";
import { useEffect, useMemo } from "react";
import { useAccount, useReadContract } from "wagmi";
import { useFormo } from "@formo/analytics";
import { usdcAbi, USDC_ADDRESSES } from "./contracts/usdc";
import { chainId, evmAddress, useReserves } from "@aave/react";
import { MainLayout } from "./components/MainLayout";
import { WalletBalanceCard } from "./components/WalletBalanceCard";
import { AaveSupplyCard } from "./components/AaveSupplyCard";
import { ActionButtons } from "./components/ActionButtons";
import { FormoEventTester } from "./components/FormoEventTester";
import { useAaveSupplies } from "./hooks/useAaveSupplies";
import { useAaveOperations } from "./hooks/useAaveOperations";

function App() {
  const { address, chainId: currentChainId } = useAccount();
  const { isAuthenticated } = useUser();
  const formo = useFormo();

  // Tie the visitor to their wallet address once a wallet is connected.
  // This emits a Formo `identify` event.
  useEffect(() => {
    if (address) {
      formo?.identify({ address });
    }
  }, [address, formo]);

  const usdcAddress = currentChainId
    ? USDC_ADDRESSES[currentChainId]
    : undefined;

  // Read USDC balance
  const { data: usdcBalance, refetch: refetchUsdcBalance } = useReadContract({
    address: usdcAddress,
    abi: usdcAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!usdcAddress,
    },
  }) as { data: bigint | undefined; refetch: () => Promise<unknown> };

  const user = address ? evmAddress(address) : undefined;

  // Fetch Aave v4 reserves on the connected chain.
  const { data: reserves } = useReserves({
    query: {
      chainIds: currentChainId ? [chainId(currentChainId)] : [],
    },
    user,
    pause: !currentChainId,
  });

  // Use custom hooks
  const {
    userSupplyPositions,
    suppliesLoading,
    suppliesError,
    refreshUserSupplies,
  } = useAaveSupplies(user, currentChainId);

  // Find USDC supply balance and APY
  const usdcSupplyData = useMemo(() => {
    if (!userSupplyPositions || userSupplyPositions.length === 0) {
      return { rawBalance: "0", apy: "0.00" };
    }
    const usdcSupply = userSupplyPositions.find(
      (supply) => supply.balance.token.info.symbol === "USDC",
    );
    if (usdcSupply) {
      return {
        rawBalance: String(usdcSupply.balance.amount.value),
        apy: (Number(usdcSupply.reserve.summary.supplyApy.value) * 100).toFixed(
          2,
        ),
      };
    }
    return { rawBalance: "0", apy: "0.00" };
  }, [userSupplyPositions]);

  // Get USDC reserve for operations
  const usdcReserve = useMemo(() => {
    if (!reserves || reserves.length === 0) return null;
    const reserve = reserves.find(
      (candidate) =>
        candidate.summary.supplied.token.info.symbol === "USDC",
    );
    if (reserve) {
      return {
        id: reserve.id,
        chainId: reserve.chain.chainId,
        supplyCapReached:
          Number(reserve.summary.suppliable.amount.value) <= 0,
      };
    }
    return null;
  }, [reserves]);

  // Use Aave operations hook
  const {
    handleDepositToAave,
    handleWithdrawFromAave,
    isLoading,
    isSupplying,
    isWithdrawing,
    supplying,
    withdrawing,
    supplyError,
    withdrawError,
  } = useAaveOperations(
    usdcReserve,
    usdcSupplyData,
    refetchUsdcBalance,
    refreshUserSupplies,
  );

  return (
    <MainLayout>
      {/* Balance Cards Container */}
      <div className="flex flex-col md:flex-row gap-6 mb-6 justify-center items-center">
        <WalletBalanceCard
          isConnected={isAuthenticated}
          address={address}
          usdcBalance={usdcBalance}
        />
        <AaveSupplyCard
          isConnected={isAuthenticated}
          address={address}
          suppliesLoading={suppliesLoading}
          usdcSupplyData={usdcSupplyData}
          suppliesError={suppliesError}
        />
      </div>

      <ActionButtons
        isConnected={isAuthenticated}
        isLoading={isLoading}
        usdcReserve={usdcReserve}
        usdcBalance={usdcBalance}
        usdcSupplyData={usdcSupplyData}
        isSupplying={isSupplying}
        supplyingLoading={supplying.loading}
        isWithdrawing={isWithdrawing}
        withdrawingLoading={withdrawing.loading}
        onDepositToAave={handleDepositToAave}
        onWithdrawFromAave={handleWithdrawFromAave}
        supplyError={supplyError}
        withdrawError={withdrawError}
      />

      <FormoEventTester />
    </MainLayout>
  );
}

export default App;
