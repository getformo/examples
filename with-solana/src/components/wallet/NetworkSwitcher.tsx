"use client";

import { useNetworkConfiguration, type Network } from "@/contexts/NetworkConfigurationProvider";

export function NetworkSwitcher() {
  const { networkConfiguration, setNetworkConfiguration } = useNetworkConfiguration();

  return (
    <select
      value={networkConfiguration}
      onChange={(e) => setNetworkConfiguration(e.target.value as Network)}
      className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      <option value="devnet">Devnet</option>
      <option value="mainnet-beta">Mainnet</option>
    </select>
  );
}
