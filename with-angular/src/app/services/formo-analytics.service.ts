import { Injectable } from '@angular/core';
import { FormoAnalytics } from '@formo/analytics/core';
import type { IFormoAnalytics, IFormoEventProperties } from '@formo/analytics/core';

/**
 * Thin singleton wrapper around the framework-agnostic Formo Web SDK.
 *
 * The SDK has no Angular bindings (its `FormoAnalyticsProvider` / `useFormo`
 * helpers are React-only), so we use the vanilla `FormoAnalytics.init()` core
 * directly and expose it to the app through this service.
 */
@Injectable({ providedIn: 'root' })
export class FormoAnalyticsService {
  private analytics: IFormoAnalytics | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the SDK. Wired into an Angular app initializer (see
   * `app.config.ts`) so it runs before bootstrap — the SDK's autocapture
   * wraps `window.ethereum` on init, and that wrapper must be in place
   * before the user can interact with their wallet.
   */
  init(): Promise<void> {
    // The SDK is browser-only; no-op during any non-browser (SSR/prerender) pass.
    if (typeof window === 'undefined') return Promise.resolve();
    if (this.initPromise) return this.initPromise;

    const writeKey = import.meta.env.NG_APP_FORMO_WRITE_KEY;
    if (!writeKey) {
      console.warn(
        '[Formo] NG_APP_FORMO_WRITE_KEY is not set — analytics are disabled. ' +
          'Copy .env.example to .env and add your write key from https://app.formo.so',
      );
      return Promise.resolve();
    }

    this.initPromise = FormoAnalytics.init(writeKey, {
      // Track on localhost too, so the example reports events during development.
      tracking: true,
      // Autocapture wraps the injected EIP-1193 provider: wallet connect,
      // disconnect, chain switch, signature and transaction events are all
      // captured automatically — no manual SDK calls needed for them.
      autocapture: {
        connect: true,
        disconnect: true,
        chain: true,
        signature: true,
        transaction: true,
      },
      logger: { enabled: true, levels: ['debug', 'info', 'warn', 'error'] },
      flushInterval: 5000,
    })
      .then((instance) => {
        this.analytics = instance;
        console.info('[Formo] Analytics SDK initialized.');
      })
      .catch((err) => {
        console.error('[Formo] Failed to initialize the analytics SDK:', err);
      });

    return this.initPromise;
  }

  /** Whether the SDK finished initializing — `false` when no write key is set. */
  get isReady(): boolean {
    return this.analytics !== null;
  }

  /** The underlying SDK instance, or `null` until `init()` has resolved. */
  get instance(): IFormoAnalytics | null {
    return this.analytics;
  }

  /** Link the current session to a wallet address. */
  identify(address: string): void {
    void this.analytics?.identify({ address })?.catch((err) => {
      console.error('[Formo] identify failed:', err);
    });
  }

  /** Emit a custom event. Wallet events are autocaptured, so use this for app-specific actions. */
  track(event: string, properties?: IFormoEventProperties): void {
    void this.analytics?.track(event, properties)?.catch((err) => {
      console.error('[Formo] track failed:', err);
    });
  }

  /**
   * Report a wallet disconnect. Only needed when the wallet can't be revoked —
   * a successful revoke makes the wallet emit `accountsChanged`, which the SDK
   * autocaptures as a disconnect on its own.
   */
  disconnect(address?: string, chainId?: number): void {
    void this.analytics?.disconnect({ address, chainId })?.catch((err) => {
      console.error('[Formo] disconnect failed:', err);
    });
  }
}
