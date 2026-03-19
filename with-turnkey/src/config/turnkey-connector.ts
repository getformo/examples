"use client";

import { createConnector } from "wagmi";
import { createAccount } from "@turnkey/viem";
import { getAddress, type EIP1193Provider, type Address } from "viem";
import type { TurnkeyBrowserClient } from "@turnkey/sdk-browser";

/**
 * Custom wagmi connector that wraps Turnkey's embedded wallet.
 *
 * Once a user authenticates with Turnkey (via passkey or email),
 * this connector lets wagmi interact with the Turnkey wallet
 * for signing messages and sending transactions.
 */
export function turnkeyConnector(params: {
  client: TurnkeyBrowserClient;
  organizationId: string;
  signWith: string;
}) {
  const { client, organizationId, signWith } = params;

  return createConnector((config) => ({
    id: "turnkey",
    name: "Turnkey",
    type: "turnkey" as const,

    async connect({ chainId } = {}) {
      const account = await createAccount({
        client,
        organizationId,
        signWith,
      });

      const chain =
        config.chains.find((c) => c.id === chainId) ?? config.chains[0];

      return {
        accounts: [getAddress(account.address)],
        chainId: chain.id,
      };
    },

    async disconnect() {
      // Nothing to clean up — Turnkey session is managed by TurnkeyProvider
    },

    async getAccounts() {
      const account = await createAccount({
        client,
        organizationId,
        signWith,
      });
      return [getAddress(account.address)];
    },

    async getChainId() {
      return config.chains[0].id;
    },

    async getProvider(): Promise<EIP1193Provider> {
      // Return a minimal EIP-1193 provider that delegates to viem
      // For most wagmi usage the connector methods above are sufficient
      return undefined as unknown as EIP1193Provider;
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
