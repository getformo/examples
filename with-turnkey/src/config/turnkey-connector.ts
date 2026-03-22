"use client";

import { createConnector } from "wagmi";
import { createEIP1193Provider } from "@turnkey/eip-1193-provider";
import { getAddress, type Address, type EIP1193Provider } from "viem";
import type { TurnkeyBrowserClient } from "@turnkey/sdk-browser";
import type { AddEthereumChainParameter } from "viem";

type UUID = `${string}-${string}-${string}-${string}-${string}`;

/**
 * Custom wagmi connector that wraps Turnkey's embedded wallet
 * using the official @turnkey/eip-1193-provider package.
 *
 * This follows the approach outlined in the Turnkey docs:
 * https://docs.turnkey.com/wallets/wagmi
 */
export function turnkeyConnector(params: {
  client: TurnkeyBrowserClient;
  organizationId: string;
  walletId: string;
}) {
  const { client, organizationId, walletId } = params;

  let cachedProvider: EIP1193Provider | null = null;

  return createConnector((config) => ({
    id: "turnkey",
    name: "Turnkey",
    type: "turnkey" as const,

    async connect(parameters?) {
      const provider = await this.getProvider();
      const accounts = (await provider.request({
        method: "eth_requestAccounts",
      })) as Address[];

      let chainId: number;
      if (parameters?.chainId) {
        await this.switchChain!({ chainId: parameters.chainId });
        chainId = parameters.chainId;
      } else {
        const chainIdHex = (await provider.request({
          method: "eth_chainId",
        })) as string;
        chainId = parseInt(chainIdHex, 16);
      }

      if (parameters?.withCapabilities) {
        return {
          accounts: accounts.map((address) => ({
            address: getAddress(address),
            capabilities: {} as Record<string, unknown>,
          })),
          chainId,
        } as never;
      }

      return {
        accounts: accounts.map((a) => getAddress(a)) as readonly Address[],
        chainId,
      } as never;
    },

    async disconnect() {
      if (cachedProvider) {
        cachedProvider.removeListener("accountsChanged", this.onAccountsChanged);
        cachedProvider.removeListener("chainChanged", this.onChainChanged);
        cachedProvider.removeListener("disconnect", this.onDisconnect);
        cachedProvider = null;
      }
    },

    async getAccounts() {
      const provider = await this.getProvider();
      const accounts = (await provider.request({
        method: "eth_accounts",
      })) as Address[];
      return accounts.map((a) => getAddress(a));
    },

    async getChainId() {
      const provider = await this.getProvider();
      const chainIdHex = (await provider.request({
        method: "eth_chainId",
      })) as string;
      return parseInt(chainIdHex, 16);
    },

    async getProvider(): Promise<EIP1193Provider> {
      if (cachedProvider) return cachedProvider;

      // Build chain definitions from wagmi config for the EIP-1193 provider
      const chains: AddEthereumChainParameter[] = config.chains.map(
        (chain) => ({
          chainId: `0x${chain.id.toString(16)}`,
          chainName: chain.name,
          nativeCurrency: chain.nativeCurrency,
          rpcUrls: [...chain.rpcUrls.default.http],
          blockExplorerUrls: chain.blockExplorers?.default?.url
            ? [chain.blockExplorers.default.url]
            : undefined,
        })
      );

      const provider = await createEIP1193Provider({
        walletId: walletId as UUID,
        organizationId: organizationId as UUID,
        turnkeyClient: client,
        chains,
      });

      provider.on("accountsChanged", this.onAccountsChanged);
      provider.on("chainChanged", this.onChainChanged);
      provider.on("disconnect", this.onDisconnect);

      cachedProvider = provider as unknown as EIP1193Provider;
      return cachedProvider;
    },

    async switchChain({ chainId }) {
      const provider = await this.getProvider();
      await provider.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      });

      const chain = config.chains.find((c) => c.id === chainId);
      if (!chain) throw new Error(`Chain ${chainId} not configured`);

      config.emitter.emit("change", { chainId });
      return chain;
    },

    async isAuthorized() {
      try {
        const accounts = await this.getAccounts();
        return accounts.length > 0;
      } catch {
        return false;
      }
    },

    onAccountsChanged(accounts: string[]) {
      if (accounts.length === 0) {
        config.emitter.emit("disconnect");
      } else {
        config.emitter.emit("change", {
          accounts: accounts.map((a) => getAddress(a as Address)),
        });
      }
    },

    onChainChanged(chainId: string) {
      config.emitter.emit("change", {
        chainId: Number(chainId),
      });
    },

    onDisconnect() {
      config.emitter.emit("disconnect");
    },
  }));
}
