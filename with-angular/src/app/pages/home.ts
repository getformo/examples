import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { chainName } from '../chains';
import { FormoAnalyticsService } from '../services/formo-analytics.service';
import { WalletService } from '../services/wallet.service';
import { shortAddress } from '../shorten';

@Component({
  selector: 'app-home',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hero">
      <img src="formo.svg" alt="Formo" class="logo" />
      <span class="cross" aria-hidden="true">×</span>
      <img src="angular.png" alt="Angular" class="logo" />
    </section>

    <section class="intro">
      <h1>Formo Web SDK on Angular</h1>
      <p>
        This example wires the framework-agnostic
        <code>&#64;formo/analytics</code> core into an Angular service and connects a wallet over
        the bare EIP-1193 provider — no wagmi, no React. Wallet events below are
        <strong>autocaptured</strong> by the SDK; only the custom event is sent manually.
      </p>
    </section>

    <div class="card">
      <div class="card-head">
        <h2>Wallet</h2>
        @if (wallet.isConnected()) {
          <button class="link" type="button" (click)="disconnect()" [disabled]="busy()">
            Disconnect
          </button>
        }
      </div>

      @if (wallet.isConnected()) {
        <dl class="facts">
          <div>
            <dt>Address</dt>
            <dd class="mono addr">
              <span>{{ shorten(wallet.address()) }}</span>
              <button
                class="icon-btn"
                type="button"
                (click)="copyAddress()"
                [title]="copied() ? 'Copied!' : 'Copy address'"
                aria-label="Copy address"
              >
                @if (copied()) {
                  <svg
                    viewBox="0 0 24 24"
                    width="15"
                    height="15"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                } @else {
                  <svg
                    viewBox="0 0 24 24"
                    width="15"
                    height="15"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                }
              </button>
            </dd>
          </div>
          <div>
            <dt>Network</dt>
            <dd class="mono">{{ network() }}</dd>
          </div>
          <div>
            <dt>Chain ID</dt>
            <dd class="mono">{{ wallet.chainId() }}</dd>
          </div>
        </dl>
      } @else {
        <p class="muted">
          @if (wallet.hasInjectedProvider) {
            Connect a wallet to sign messages and send a test transaction.
          } @else {
            No browser wallet detected. Install
            <a href="https://metamask.io" target="_blank" rel="noreferrer">MetaMask</a>
            to try this example.
          }
        </p>
      }

      <div class="actions">
        @if (!wallet.isConnected()) {
          <button (click)="connect()" [disabled]="busy() || !wallet.hasInjectedProvider">
            Connect Wallet
          </button>
        } @else {
          <label class="field">
            Message to sign
            <input type="text" [(ngModel)]="message" [disabled]="busy()" />
          </label>
          <div class="button-row">
            <button (click)="signMessage()" [disabled]="busy()">Sign Message</button>
            <button (click)="sendTransaction()" [disabled]="busy()">Send 0-ETH Tx</button>
            <button (click)="trackEvent()" [disabled]="busy()" class="ghost">
              Track Custom Event
            </button>
          </div>
        }
      </div>

      @if (status()) {
        <p class="status mono">{{ status() }}</p>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      max-width: 640px;
      margin: 0 auto;
    }
    .hero {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
      padding: 1.5rem 1.5rem 0;
      margin-bottom: 3rem;
    }
    .hero .logo {
      height: 44px;
      width: auto;
    }
    .hero .cross {
      font-size: 1.7rem;
      font-weight: 300;
      color: #9aa0aa;
    }
    .intro h1 {
      margin: 0 0 0.5rem;
      font-size: 1.6rem;
    }
    .intro p {
      color: var(--text-dim);
      line-height: 1.6;
    }
    .card {
      margin-top: 1.5rem;
      padding: 1.5rem;
      border: 1px solid var(--border);
      border-radius: 12px;
      background: var(--surface);
    }
    .card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }
    .card-head h2 {
      margin: 0;
      font-size: 1.1rem;
    }
    .facts {
      display: grid;
      gap: 0.5rem;
      margin: 0 0 1rem;
    }
    .facts div {
      display: flex;
      justify-content: space-between;
    }
    .facts dt {
      color: var(--text-dim);
    }
    .facts dd {
      margin: 0;
    }
    .addr {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }
    .icon-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.2rem;
      background: transparent;
      border: 0;
      border-radius: 5px;
      color: var(--text-dim);
      cursor: pointer;
    }
    .icon-btn:hover {
      color: var(--text);
      background: var(--accent-soft);
    }
    .link {
      padding: 0;
      background: transparent;
      border: 0;
      color: var(--text-dim);
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
    }
    .link:hover:not(:disabled) {
      color: var(--text);
      text-decoration: underline;
    }
    .muted {
      color: var(--text-dim);
    }
    .field {
      display: block;
      font-size: 0.85rem;
      color: var(--text-dim);
      margin-bottom: 0.85rem;
    }
    .field input {
      display: block;
      width: 100%;
      margin-top: 0.35rem;
      padding: 0.55rem 0.7rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--bg);
      color: var(--text);
      font-size: 0.95rem;
      box-sizing: border-box;
    }
    .button-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
    }
    button {
      padding: 0.55rem 1rem;
      border: 0;
      border-radius: 8px;
      background: var(--accent);
      color: #fff;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
    }
    button.ghost {
      background: var(--accent-soft);
      color: var(--accent);
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .status {
      margin: 1.1rem 0 0;
      padding: 0.7rem 0.85rem;
      border-radius: 8px;
      background: var(--bg);
      border: 1px solid var(--border);
      font-size: 0.85rem;
      word-break: break-all;
    }
  `,
})
export class Home {
  protected readonly wallet = inject(WalletService);
  private readonly formo = inject(FormoAnalyticsService);
  protected readonly shorten = shortAddress;

  /** Human-readable name for the connected network. */
  protected readonly network = computed(() => chainName(this.wallet.chainId()));

  protected readonly message = signal('Hello from Formo Analytics on Angular!');
  protected readonly status = signal<string | null>(null);
  protected readonly busy = signal(false);
  protected readonly copied = signal(false);

  protected connect(): Promise<void> {
    return this.run('Connecting wallet…', async () => {
      await this.wallet.connect();
      return `Connected ${this.wallet.address()}`;
    });
  }

  protected signMessage(): Promise<void> {
    return this.run('Awaiting signature…', async () => {
      const signature = await this.wallet.signMessage(this.message());
      return `Message signed — signature ${signature.slice(0, 24)}…`;
    });
  }

  protected sendTransaction(): Promise<void> {
    return this.run('Awaiting transaction approval…', async () => {
      const hash = await this.wallet.sendTransaction();
      return `Transaction broadcast — hash ${hash}`;
    });
  }

  protected trackEvent(): void {
    if (!this.formo.isReady) {
      this.status.set('Analytics is disabled — set NG_APP_FORMO_WRITE_KEY in .env.');
      return;
    }
    this.formo.track('custom_event', { source: 'home', framework: 'angular' });
    this.status.set('Sent custom_event to Formo — check your dashboard.');
  }

  /** Copy the full connected address to the clipboard. */
  protected async copyAddress(): Promise<void> {
    const address = this.wallet.address();
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1500);
    } catch {
      this.status.set('Could not copy the address — clipboard access was denied.');
    }
  }

  /** Disconnect the wallet and reset the card. */
  protected async disconnect(): Promise<void> {
    await this.wallet.disconnect();
    this.status.set(null);
  }

  /** Run an async wallet action with shared busy/status handling. */
  private async run(pending: string, action: () => Promise<string>): Promise<void> {
    this.busy.set(true);
    this.status.set(pending);
    try {
      this.status.set(await action());
    } catch (err) {
      this.status.set(err instanceof Error ? err.message : String(err));
    } finally {
      this.busy.set(false);
    }
  }
}
