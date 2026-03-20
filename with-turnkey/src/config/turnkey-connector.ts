"use client";

import { createConnector } from "wagmi";
import { createAccount } from "@turnkey/viem";
import {
  getAddress,
  type EIP1193Provider,
  type Address,
  type LocalAccount,
  hexToNumber,
} from "viem";
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

  // Mutable state shared across connector methods
  let cachedAccount: LocalAccount | null = null;
  let currentChainId: number = 1;

  async function getAccount(): Promise<LocalAccount> {
    if (!cachedAccount) {
      cachedAccount = await createAccount({
        client,
        organizationId,
        signWith,
      });
    }
    return cachedAccount;
  }

  /**
   * Forward an RPC call to the chain's public endpoint.
   * Used for methods the connector doesn't handle directly
   * (e.g. eth_getTransactionCount, eth_sendRawTransaction).
   */
  async function forwardToRpc(
    rpcUrl: string,
    method: string,
    params: unknown[] = [],
  ): Promise<unknown> {
    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    const json = await res.json();
    if (json.error) {
      throw new Error(json.error.message ?? JSON.stringify(json.error));
    }
    return json.result;
  }

  return createConnector((config) => {
    /** Resolve the RPC URL for the current chain */
    function getRpcUrl(): string {
      const chain = config.chains.find((c) => c.id === currentChainId) ?? config.chains[0];
      const httpRpc = chain.rpcUrls.default.http[0];
      return httpRpc;
    }

    // Cached provider instance so event subscriptions persist across getProvider() calls
    let cachedProvider: EIP1193Provider | null = null;
    const listeners = new Map<string, Set<(...args: unknown[]) => void>>();

    return {
      id: "turnkey",
      name: "Turnkey",
      type: "turnkey" as const,

      async connect(parameters?) {
        const account = await getAccount();
        const chain =
          config.chains.find((c) => c.id === parameters?.chainId) ?? config.chains[0];
        currentChainId = chain.id;

        const accounts = [getAddress(account.address)] as const;

        if (parameters?.withCapabilities) {
          return {
            accounts: accounts.map((address) => ({
              address,
              capabilities: {} as Record<string, unknown>,
            })),
            chainId: chain.id,
          } as never;
        }

        return {
          accounts,
          chainId: chain.id,
        } as never;
      },

      async disconnect() {
        cachedAccount = null;
        cachedProvider = null;
        listeners.clear();
      },

      async getAccounts() {
        const account = await getAccount();
        return [getAddress(account.address)];
      },

      async getChainId() {
        return currentChainId;
      },

      async getProvider(): Promise<EIP1193Provider> {
        if (cachedProvider) return cachedProvider;

        const account = await getAccount();
        const accountAddress = getAddress(account.address);

        cachedProvider = {
          on(event: string, handler: (...args: unknown[]) => void) {
            if (!listeners.has(event)) listeners.set(event, new Set());
            listeners.get(event)!.add(handler);
            return cachedProvider!;
          },
          removeListener(event: string, handler: (...args: unknown[]) => void) {
            listeners.get(event)?.delete(handler);
            return cachedProvider!;
          },
          emit(event: string, ...args: unknown[]) {
            listeners.get(event)?.forEach((h) => h(...args));
            return listeners.has(event) && listeners.get(event)!.size > 0;
          },
          async request({ method, params }: { method: string; params?: unknown[] }) {
            switch (method) {
              case "eth_accounts":
              case "eth_requestAccounts":
                return [accountAddress];

              case "eth_chainId":
                return `0x${currentChainId.toString(16)}`;

              case "personal_sign": {
                const [message, _address] = params as [string, string];
                return account.signMessage({
                  message: { raw: message as `0x${string}` },
                });
              }

              case "eth_signTypedData_v4": {
                const [_address, typedDataJson] = params as [string, string];
                const typedData = JSON.parse(typedDataJson);
                return account.signTypedData({
                  domain: typedData.domain,
                  types: typedData.types,
                  primaryType: typedData.primaryType,
                  message: typedData.message,
                });
              }

              case "eth_sendTransaction": {
                const [txParams] = params as [Record<string, string>];
                const rpcUrl = getRpcUrl();

                // Build a serializable transaction object from the RPC params.
                // We use Record<string, unknown> because the tx may be legacy
                // (gasPrice) or EIP-1559 (maxFeePerGas), which are separate
                // union members in viem's TransactionSerializable type.
                const tx: Record<string, unknown> = {
                  to: txParams.to as Address,
                  value: txParams.value ? BigInt(txParams.value) : 0n,
                  data: txParams.data as `0x${string}` | undefined,
                  gas: txParams.gas ? BigInt(txParams.gas) : undefined,
                  gasPrice: txParams.gasPrice ? BigInt(txParams.gasPrice) : undefined,
                  maxFeePerGas: txParams.maxFeePerGas
                    ? BigInt(txParams.maxFeePerGas)
                    : undefined,
                  maxPriorityFeePerGas: txParams.maxPriorityFeePerGas
                    ? BigInt(txParams.maxPriorityFeePerGas)
                    : undefined,
                  nonce: txParams.nonce ? hexToNumber(txParams.nonce as `0x${string}`) : undefined,
                  chainId: currentChainId,
                };

                // Fill in missing gas/nonce from the node if needed
                if (tx.nonce === undefined) {
                  const nonceHex = (await forwardToRpc(rpcUrl, "eth_getTransactionCount", [
                    accountAddress,
                    "pending",
                  ])) as string;
                  tx.nonce = hexToNumber(nonceHex as `0x${string}`);
                }

                if (!tx.gas) {
                  tx.gas = (await forwardToRpc(rpcUrl, "eth_estimateGas", [
                    txParams,
                  ])) as bigint;
                  if (typeof tx.gas === "string") tx.gas = BigInt(tx.gas);
                }

                if (!tx.maxFeePerGas && !tx.gasPrice) {
                  const feeHistory = (await forwardToRpc(rpcUrl, "eth_gasPrice", [])) as string;
                  tx.gasPrice = BigInt(feeHistory);
                }

                // Sign the transaction via Turnkey
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const signedTx = await account.signTransaction(tx as any);

                // Broadcast the signed transaction
                const txHash = await forwardToRpc(rpcUrl, "eth_sendRawTransaction", [signedTx]);
                return txHash;
              }

              default:
                // Forward any other RPC call to the chain's node
                return forwardToRpc(getRpcUrl(), method, (params as unknown[]) ?? []);
            }
          },
        } as EIP1193Provider;

        return cachedProvider;
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
        currentChainId = Number(chainId);
        config.emitter.emit("change", {
          chainId: Number(chainId),
        });
      },

      onDisconnect() {
        config.emitter.emit("disconnect");
      },
    };
  });
}
