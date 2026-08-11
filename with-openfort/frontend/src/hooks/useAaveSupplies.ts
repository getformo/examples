import { useCallback, useEffect, useState } from "react";
import {
  chainId,
  type EvmAddress,
  type UserSupplyItem,
  useUserSuppliesAction,
} from "@aave/react";

export function useAaveSupplies(
  user: EvmAddress | undefined,
  connectedChainId: number | undefined,
) {
  const [fetchUserSupplies] = useUserSuppliesAction();
  const [userSupplyPositions, setUserSupplyPositions] = useState<
    UserSupplyItem[] | undefined
  >(undefined);
  const [suppliesLoading, setSuppliesLoading] = useState(true);
  const [suppliesError, setSuppliesError] = useState<Error | null>(null);

  const refreshUserSupplies = useCallback(async () => {
    if (!user || !connectedChainId) {
      setUserSupplyPositions(undefined);
      setSuppliesLoading(false);
      setSuppliesError(null);
      return;
    }

    setSuppliesLoading(true);
    setSuppliesError(null);

    const result = await fetchUserSupplies({
      query: {
        userChains: {
          chainIds: [chainId(connectedChainId)],
          user,
        },
      },
    });

    if (result.isErr()) {
      console.error("Failed to fetch user supplies:", result.error);
      setSuppliesError(result.error);
      setUserSupplyPositions(undefined);
    } else {
      setUserSupplyPositions(result.value);
    }

    setSuppliesLoading(false);
  }, [connectedChainId, fetchUserSupplies, user]);

  useEffect(() => {
    void refreshUserSupplies();
  }, [refreshUserSupplies]);

  return {
    userSupplyPositions,
    suppliesLoading,
    suppliesError,
    refreshUserSupplies,
  };
}
