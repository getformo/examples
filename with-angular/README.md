# Formo × Angular Example

An [Angular](https://angular.dev) application demonstrating the [Formo Analytics](https://formo.so)
Web SDK on the **non-wagmi, non-React path** — the framework-agnostic
`FormoAnalytics.init()` core wired into an Angular service, with wallets
connected over the bare EIP-1193 provider (`window.ethereum`).

Angular has no first-class Formo binding (the SDK's `FormoAnalyticsProvider` /
`useFormo()` helpers are React-only), so this example shows how to use the SDK
core directly. Everything here applies to any non-React framework.

## Features

- **Vanilla SDK core** — `FormoAnalytics.init()` wrapped in an injectable Angular service
- **Bare EIP-1193 wallet** — connect MetaMask via `window.ethereum`, no wagmi
- **viem** as a typed layer for `signMessage` / `sendTransaction`
- **Autocaptured events** — page views, wallet connect/disconnect, chain
  switches, signatures and transactions, all with no manual instrumentation
- **SPA route tracking for free** — Angular's router navigates with the History
  API, which the SDK hooks automatically
- **Typed `.env` config** via [`@ngx-env/builder`](https://github.com/chihab/ngx-env)

## Technologies Used

- **Angular 21** — standalone components, signals, zoneless change detection
- **TypeScript** for type safety
- **viem** for EIP-1193 wallet interactions
- **@ngx-env/builder** for `.env` support
- **Formo Analytics SDK** (`@formo/analytics`) for Web3 analytics

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm
- A Formo account and SDK write key
- A browser wallet such as [MetaMask](https://metamask.io)

### Installation

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Set up environment variables:

   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and add your write key (from your project settings at
   [app.formo.so](https://app.formo.so)):

   ```env
   NG_APP_FORMO_WRITE_KEY=your_formo_write_key_here
   ```

   Only variables prefixed with `NG_APP_` are exposed to the browser.

4. Start the dev server:

   ```bash
   pnpm start
   ```

5. Open [http://localhost:4200](http://localhost:4200).

## Project Structure

```
with-angular/
├── .env.example                        # NG_APP_FORMO_WRITE_KEY
├── src/
│   ├── env.d.ts                         # types for import.meta.env + window.ethereum
│   ├── polyfills.ts                     # exposes Node's Buffer for the SDK
│   └── app/
│       ├── app.config.ts                # provideAppInitializer → SDK init
│       ├── app.routes.ts                # Home + About routes
│       ├── app.ts                       # shell: nav + <router-outlet>
│       ├── chains.ts                    # chain id → network name lookup
│       ├── shorten.ts                   # address-formatting helper
│       ├── services/
│       │   ├── formo-analytics.service.ts  # wraps FormoAnalytics.init()
│       │   └── wallet.service.ts           # bare EIP-1193 + viem
│       └── pages/
│           ├── home.ts                  # wallet demo + action buttons
│           └── about.ts                 # how the integration works
```

## How It Works

### 1. The SDK core in an Angular service

`FormoAnalyticsService` wraps the framework-agnostic `FormoAnalytics.init()`
and exposes `identify()` / `track()` to the rest of the app. The SDK is
browser-only, so `init()` no-ops if `window` is unavailable (SSR/prerender).

### 2. Initialize before bootstrap

`init()` is run from `provideAppInitializer` in `app.config.ts`. This matters:
the SDK's autocapture works by wrapping `window.ethereum`, and that wrapper must
be installed **before** the user can interact with their wallet. An app
initializer runs before bootstrap; `ngOnInit` would leave a race window.

### 3. Wallet connection

`WalletService` connects with the bare EIP-1193 provider
(`window.ethereum.request({ method: 'eth_requestAccounts' })`) and uses viem
only as a typed convenience layer for signing and sending transactions. The
wallet events themselves are **not** reported from app code — the SDK's
autocapture emits them. The only manual SDK call tied to the wallet is
`identify({ address })` once an address is known.

### 4. SPA route tracking — automatic

Angular's router performs client-side navigation with `history.pushState`. The
Formo SDK wraps `pushState` on init, so route changes are captured as `page`
events automatically. No `NavigationEnd` subscription or manual `page()` call is
needed — adding one would double-count.

## Event Tracking

| Event | How |
| --- | --- |
| `page` | Autocaptured on load and on every route change |
| `connect` / `disconnect` | Autocaptured from the EIP-1193 provider |
| `chain` | Autocaptured on network switch |
| `signature` | Autocaptured on message signing |
| `transaction` | Autocaptured on `eth_sendTransaction` |
| `identify` | Called manually after a wallet connects |
| custom `track` | Called manually — see the "Track Custom Event" button |

Manual events use the service:

```ts
import { inject } from '@angular/core';
import { FormoAnalyticsService } from './services/formo-analytics.service';

const formo = inject(FormoAnalyticsService);
formo.track('custom_event', { source: 'home', framework: 'angular' });
```

## Testing the Integration

With debug logging on (configured in `formo-analytics.service.ts`) you should
see in the browser console:

- `[Formo] Analytics SDK initialized.`
- `Event enqueued: page` on load and on each route change
- `connect` / `signature` / `transaction` events as you use the wallet

and POST requests to the Formo ingest endpoint in the Network tab. If the write
key is missing or invalid you'll see `HTTP 403` — events are still sent, just
rejected.

## Notes on SDK compatibility

A couple of rough edges show up when using `@formo/analytics` outside a
Webpack-based toolchain (it has so far been used mainly with Next.js / CRA):

- **Node `Buffer` polyfill.** The SDK decodes signed-message payloads with
  Node's `Buffer`. Webpack auto-polyfills Node globals; Angular's esbuild build
  does not, so without a polyfill signing throws `ReferenceError: Buffer is not
  defined`. [`src/polyfills.ts`](src/polyfills.ts) exposes `Buffer` globally and
  is wired in via the `polyfills` option in `angular.json`.
- **React in the bundle.** The SDK's single entrypoint also re-exports its
  React provider, so a small amount of React is pulled in even though this
  example never uses it. It is harmless (the React code path never runs); the
  `allowedCommonJsDependencies` entry in `angular.json` silences the related
  build warnings.

Both would go away with a React-free, browser-native SDK entrypoint.

## Building

```bash
pnpm build
```

Build artifacts are written to `dist/`.
