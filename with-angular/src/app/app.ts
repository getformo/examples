import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { WalletService } from './services/wallet.service';
import { shortAddress } from './shorten';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="topbar">
      <a routerLink="/" class="brand">Formo <span>×</span> Angular</a>
      <nav>
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
          Home
        </a>
        <a routerLink="/about" routerLinkActive="active">About</a>
      </nav>
      @if (wallet.isConnected()) {
        <span class="wallet-pill" title="Connected wallet">
          {{ shorten(wallet.address()) }}
        </span>
      }
    </header>

    <main>
      <router-outlet />
    </main>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100vh;
    }
    .topbar {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border);
    }
    .brand {
      font-weight: 700;
      font-size: 1.05rem;
      color: var(--text);
      text-decoration: none;
    }
    .brand span {
      color: var(--accent);
    }
    nav {
      display: flex;
      gap: 1rem;
    }
    nav a {
      color: var(--text-dim);
      text-decoration: none;
      font-size: 0.95rem;
    }
    nav a.active {
      color: var(--text);
      font-weight: 600;
    }
    .wallet-pill {
      margin-left: auto;
      font-family: var(--mono);
      font-size: 0.85rem;
      padding: 0.35rem 0.7rem;
      border-radius: 999px;
      background: var(--accent-soft);
      color: var(--accent);
    }
    main {
      padding: 2rem 1.5rem;
    }
  `,
})
export class App {
  protected readonly wallet = inject(WalletService);
  protected readonly shorten = shortAddress;
}
