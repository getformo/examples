# Formo Analytics — Next.js App Router Example

[Documentation](https://help.formo.so) |
[Website](https://formo.so)

A [Scaffold-ETH 2](https://scaffoldeth.io) app wired up with `@formo/analytics` for testing SDK features in a real Next.js + wagmi environment.

## Prerequisites

- Node.js >= 18.18.0
- pnpm 11 (the repo pins `pnpm@11.1.2` via `packageManager`; `corepack enable` will pick it up)
- For local SDK testing only: the [`@formo/analytics` SDK repo](https://github.com/getformo/sdk) cloned as a sibling of the `examples` repo so it resolves at `../../sdk` (see [SDK Linking](#sdk-linking-local-development))

## Quickstart

```bash
pnpm install
pnpm start   # starts the Next.js dev server on port 3002
```

Visit http://localhost:3002. This uses the published `@formo/analytics` from npm. To test against a local SDK build instead, see [SDK Linking](#sdk-linking-local-development) below.

## SDK Linking (local development)

To run the example against a **local** SDK build instead of the published npm package, point the `@formo/analytics` dependency at your local SDK checkout using pnpm's `file:` protocol.

1. Clone the SDK repo so it sits at `../../sdk` relative to this example (a sibling of the `examples` repo):

   ```
   your-code/
   ├── examples/
   │   └── with-next-app-router/   ← you are here
   └── sdk/                        ← github.com/getformo/sdk
   ```

2. Build the SDK — the `file:` protocol consumes its `dist/`, not its source:

   ```bash
   cd ../../sdk
   pnpm install
   pnpm build
   ```

3. In this example's `package.json`, change the `@formo/analytics` dependency to the local path:

   ```diff
     "dependencies": {
   -   "@formo/analytics": "^1.29.1"
   +   "@formo/analytics": "file:../../sdk"
     }
   ```

4. Re-install so pnpm relinks, then start the dev server:

   ```bash
   cd ../examples/with-next-app-router   # back to this example
   pnpm install
   pnpm start
   ```

After editing SDK source, rebuild it (`pnpm build` in `../../sdk`) and restart the dev server to pick up the new `dist/`.

### Why `file:` and not `pnpm link`

`pnpm link` (or a `link:` override) creates a **symlink**. The SDK's `peerDependencies` — `react`, `wagmi`, `viem`, `@tanstack/react-query`, `@types/react` — then resolve from `../../sdk/node_modules` instead of this project, so you load **two copies** of React and wagmi at once. That causes `Invalid hook call`, "must be used within `WagmiProvider`" errors, and a react-query cache that isn't shared. pnpm warns about exactly this:

> The linked in dependency will not resolve the peer dependencies from the target node_modules. … To resolve this, you may use the "file:" protocol.

The `file:` protocol resolves the SDK's peers from **this** project, keeping a single React/wagmi/viem instance.

> **Note:** the `file:` change dirties `package.json` **and** `pnpm-lock.yaml` with a machine-specific path that will break CI. **Do not commit it.** Before committing, restore the registry version:
>
> ```bash
> git checkout package.json pnpm-lock.yaml
> pnpm install
> ```

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Main page — wallet connect, sign/send transactions, custom event tracking, consent management |
| `/cookies` | Cross-subdomain cookie testing (see below) |
| `/debug` | Scaffold-ETH contract debugger |
| `/blockexplorer` | Local block explorer |

## SDK Configuration

The SDK is initialized in `packages/nextjs/components/ScaffoldEthAppWithProviders.tsx`:

```tsx
<AnalyticsProvider
  writeKey={WRITE_KEY}
  options={{
    tracking: true,
    crossSubdomainCookies: true,
    flushInterval: 5000,
    logger: { enabled: true, levels: ["debug", "error", "warn", "info"] },
    autocapture: { connect: true, disconnect: true, signature: true, transaction: true, chain: true },
    apiHost: "/api/events",
    wagmi: { config: wagmiConfig, queryClient },
  }}
>
```

### Write key (`.env` location)

Set your Formo project write key via the `NEXT_PUBLIC_FORMO_ANALYTICS_WRITE_KEY` env var. `ScaffoldEthAppWithProviders.tsx` reads it as `process.env.NEXT_PUBLIC_FORMO_ANALYTICS_WRITE_KEY` and passes it to `<AnalyticsProvider writeKey={...}>`.

Copy `.env.example` to `.env` **at the example root** and fill in your key — same as every other example in this repo:

```bash
cp .env.example .env   # at with-next-app-router/ (the example root)
# then edit .env:
# NEXT_PUBLIC_FORMO_ANALYTICS_WRITE_KEY=<your real write key>
```

> **Why the example root, even though this is a pnpm workspace?**
>
> `pnpm start` runs `next dev` with its working directory set to `packages/nextjs/`, and Next.js natively only reads `.env*` from that directory — not the monorepo root. To keep env config in one obvious place (next to `.env.example`, matching the other examples), `packages/nextjs/next.config.js` explicitly loads the example-root `.env` via Next's own `@next/env` loader before `NEXT_PUBLIC_*` vars are inlined. So **put your key in `with-next-app-router/.env`**, not in `packages/nextjs/`.

Env-file precedence at the example root (highest wins): `.env.local` → `.env.development` → `.env`. The root `.env` is gitignored.

> **Restart the dev server after changing the key.** `NEXT_PUBLIC_*` values are inlined at server start, so a running `pnpm start` keeps serving the old value until restarted (then hard-reload the browser). A missing/invalid key makes the ingestion endpoint return `403 "...explicit deny in an identity-based policy"` (AWS) — see [Troubleshooting](#troubleshooting).

---

## Testing Cross-Subdomain Cookies

The `/cookies` page is a dedicated tool for verifying the `crossSubdomainCookies` SDK option. It displays all Formo cookies in real time (auto-refreshes every second).

### How it works

[lvh.me](http://lvh.me) is a public domain that resolves `*.lvh.me` to `127.0.0.1` — no `/etc/hosts` editing needed. By visiting two different subdomains you can verify whether identity cookies are shared.

### Test 1: Shared cookies (`crossSubdomainCookies: true`, the default)

1. Start the dev server: `pnpm start`
2. Open http://app.lvh.me:3002/cookies
3. Note the `anonymous-id` cookie value
4. Open DevTools > Application > Cookies — confirm the cookie domain is `.lvh.me` (apex)
5. Open http://www.lvh.me:3002/cookies
6. The `anonymous-id` value should be **identical** (shared via `.lvh.me`)

### Test 2: Host-only cookies (`crossSubdomainCookies: false`)

1. In `packages/nextjs/components/ScaffoldEthAppWithProviders.tsx`, change:
   ```ts
   crossSubdomainCookies: false,
   ```
2. Clear browser cookies for `lvh.me`
3. Visit http://app.lvh.me:3002/cookies — note the `anonymous-id` value
4. Visit http://www.lvh.me:3002/cookies — it should have a **different** `anonymous-id`
5. In DevTools, confirm each cookie is scoped to its respective host (`app.lvh.me`, `www.lvh.me`)

### Expected cookie scoping

| Cookie | `crossSubdomainCookies: true` | `crossSubdomainCookies: false` |
|--------|-------------------------------|-------------------------------|
| `formo_{hash}_anonymous-id` | `.lvh.me` (apex) | `app.lvh.me` (host-only) |
| `formo_{hash}_user-id` | `.lvh.me` (apex) | `app.lvh.me` (host-only) |
| Session cookies (`wallet-detected`, etc.) | Always host-scoped | Always host-scoped |
| Consent cookies (`formo_{hash}_*`) | Always apex-scoped | Always apex-scoped |

### Fallback: /etc/hosts

If `lvh.me` doesn't resolve (some corporate networks block it), add to `/etc/hosts`:

```
127.0.0.1  app.local.test
127.0.0.1  www.local.test
```

Then use `http://app.local.test:3002/cookies` and `http://www.local.test:3002/cookies`.

---

## Troubleshooting

### `POST /api/events` → `403` `"User is not authorized to access this resource with an explicit deny in an identity-based policy"`

Your write key is missing or invalid. The browser sends `Authorization: Bearer <writeKey>`; `/api/events` is rewritten (`next.config.js`) to `https://events.formo.so/v0/raw_events`, which is AWS-fronted and explicitly denies unrecognized keys with this IAM message (a *missing* key returns `401 Unauthorized` instead).

Checklist:

1. `NEXT_PUBLIC_FORMO_ANALYTICS_WRITE_KEY` is set to a **real** project key in `with-next-app-router/.env` (the example root — see [Write key](#write-key-env-location)). The default `ci_test_key` placeholder is rejected.
2. You **restarted the dev server** after editing `.env` (`NEXT_PUBLIC_*` is inlined at server start) and hard-reloaded the browser.
3. Confirm the running app picked it up: the browser console should log `[Formo SDK] Successfully initialized FormoAnalytics SDK` followed by `Events sent successfully`. No `[Formo SDK]` logs at all means the key is empty (provider skips init).

### Unrelated console noise (safe to ignore)

These come from the Scaffold-ETH base app / wallet libraries, not Formo: `eth.merkle.io` CORS / `ERR_FAILED` (Uniswap ETH-price hook), `logo.svg 404`, `@metamask/sdk` `@react-native-async-storage/async-storage` not found, `WalletConnect Core is already initialized`, `Lit is in dev mode`.

---

## Scaffold-ETH 2

This example is built on top of [Scaffold-ETH 2](https://github.com/scaffold-eth/scaffold-eth-2). See their [docs](https://docs.scaffoldeth.io) for info on smart contract development, the debug page, and the local chain setup.
