import { Injectable, computed, inject, signal } from '@angular/core';
import { createWalletClient, custom } from 'viem';
import type { Address } from 'viem';
import { FormoAnalyticsService } from './formo-analytics.service';

/**
 * Minimal wallet connection built on the bare EIP-1193 provider that browser
 * wallets (e.g. MetaMask) inject as `window.ethereum` — the non-wagmi path.
 *
 * viem is used purely as a typed convenience layer for `signMessage` and
 * `sendTransaction`. None of the wallet events are reported to Formo from
 * here: the SDK's autocapture wraps `window.ethereum` and emits the
 * connect / disconnect / chain / signature / transaction events itself.
 * The only manual SDK call is `identify()` once an address is known.
 */
@Injectable({ providedIn: 'root' })
export class WalletService {
  private readonly formo = inject(FormoAnalyticsService);

  /** Connected account address, or `null` when disconnected. */
  readonly address = signal<Address | null>(null);
  /** Current chain id (decimal), or `null` when disconnected. */
  readonly chainId = signal<number | null>(null);
  readonly isConnected = computed(() => this.address() !== null);

  private walletClient: ReturnType<typeof createWalletClient> | null = null;
  private listenersBound = false;

  constructor() {
    // Wallets don't re-emit `accountsChanged` for an already-authorized
    // connection after a page reload, so rehydrate from the provider on start.
    if (this.hasInjectedProvider) {
      this.bindProviderEvents();
      void this.hydrate();
    }
  }

  /** Whether a browser wallet has injected an EIP-1193 provider. */
  get hasInjectedProvider(): boolean {
    return typeof window !== 'undefined' && !!window.ethereum;
  }

  /** Prompt the wallet to connect, then identify the user with Formo. */
  async connect(): Promise<void> {
    const provider = this.requireProvider();
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    const chainIdHex = await provider.request({ method: 'eth_chainId' });

    this.bindProviderEvents();
    this.chainId.set(Number.parseInt(chainIdHex, 16));
    this.setAddress(accounts[0] ?? null);
  }

  /** Pick up an already-authorized wallet on load, without prompting the user. */
  private async hydrate(): Promise<void> {
    try {
      const provider = this.requireProvider();
      // `eth_accounts` returns authorized accounts silently (no popup).
      const accounts = await provider.request({ method: 'eth_accounts' });
      if (accounts.length === 0) return;
      const chainIdHex = await provider.request({ method: 'eth_chainId' });
      this.chainId.set(Number.parseInt(chainIdHex, 16));
      this.setAddress(accounts[0]);
    } catch {
      // No existing authorization — the user can still connect manually.
    }
  }

  /** Sign a personal message. Autocaptured by the SDK as a `signature` event. */
  async signMessage(message: string): Promise<string> {
    const account = this.requireAddress();
    return this.requireWalletClient().signMessage({ account, message });
  }

  /** Send a 0-value transaction to self. Autocaptured by the SDK as a `transaction` event. */
  async sendTransaction(): Promise<string> {
    const account = this.requireAddress();
    return this.requireWalletClient().sendTransaction({
      account,
      to: account,
      value: 0n,
      // `null` tells viem to use whatever chain the wallet is currently on.
      chain: null,
    });
  }

  /**
   * Forget the connected wallet. Injected wallets can't be force-disconnected,
   * so this asks the wallet to revoke the dapp's account permission. A
   * successful revoke makes the wallet emit `accountsChanged`, which the SDK
   * autocaptures as a `disconnect`; if revocation isn't supported the SDK is
   * notified directly so its attribution state doesn't go stale. Local state
   * is cleared either way.
   */
  async disconnect(): Promise<void> {
    const address = this.address() ?? undefined;
    const chainId = this.chainId() ?? undefined;

    let revoked = false;
    try {
      await this.requireProvider().request({
        method: 'wallet_revokePermissions',
        params: [{ eth_accounts: {} }],
      });
      revoked = true;
    } catch {
      // Wallet doesn't support programmatic permission revocation.
    }

    if (!revoked) this.formo.disconnect(address, chainId);
    this.setAddress(null);
  }

  private requireProvider(): NonNullable<typeof window.ethereum> {
    if (!this.hasInjectedProvider) {
      throw new Error('No wallet detected. Install MetaMask or another EIP-1193 wallet.');
    }
    return window.ethereum!;
  }

  private requireAddress(): Address {
    const account = this.address();
    if (!account) throw new Error('Connect a wallet first.');
    return account;
  }

  private requireWalletClient(): ReturnType<typeof createWalletClient> {
    if (!this.walletClient) {
      this.walletClient = createWalletClient({ transport: custom(this.requireProvider()) });
    }
    return this.walletClient;
  }

  /** Subscribe to wallet account/chain changes (registered once). */
  private bindProviderEvents(): void {
    if (this.listenersBound) return;
    const provider = this.requireProvider();

    provider.on('accountsChanged', (accounts) => {
      this.setAddress((accounts as Address[])[0] ?? null);
    });
    provider.on('chainChanged', (chainIdHex) => {
      this.chainId.set(Number.parseInt(chainIdHex, 16));
    });

    this.listenersBound = true;
  }

  private setAddress(account: Address | null): void {
    const previous = this.address();
    this.address.set(account);

    if (!account) {
      this.chainId.set(null);
      this.walletClient = null;
      return;
    }
    // Re-identify only when the address actually changes.
    if (account !== previous) {
      this.formo.identify(account);
    }
  }
}
