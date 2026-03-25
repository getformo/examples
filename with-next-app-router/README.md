# Formo Analytics — Next.js App Router Example

[Documentation](https://help.formo.so) |
[Website](https://formo.so)

A [Scaffold-ETH 2](https://scaffoldeth.io) app wired up with `@formo/analytics` for testing SDK features in a real Next.js + wagmi environment.

## Prerequisites

- Node.js >= 18.18.0
- Yarn (the repo pins yarn 3.2.3 via `packageManager`)
- The SDK repo at `../sdk` (used via `portal:` resolution)

## Quickstart

```bash
# 1. Build the SDK
cd ../sdk
npm run build

# 2. Install and start the example
cd ../examples/with-next-app-router
yarn install
yarn start   # starts Next.js dev server on port 3002
```

Visit http://localhost:3002.

## SDK Linking (local development)

To test against a local SDK build, add a Yarn `resolutions` field to `package.json`:

```json
{
  "resolutions": {
    "@formo/analytics": "portal:/path/to/sdk"
  }
}
```

Then run `yarn install` to relink. After changing SDK source, rebuild (`npm run build` in the SDK repo) and the Next.js dev server will pick up changes via Fast Refresh.

> **Note:** Do not commit the `resolutions` field — it uses an absolute local path that will break CI.

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

Set `NEXT_PUBLIC_FORMO_ANALYTICS_WRITE_KEY` in a `.env` file to use a real write key.

---

## Testing Cross-Subdomain Cookies

The `/cookies` page is a dedicated tool for verifying the `crossSubdomainCookies` SDK option. It displays all Formo cookies in real time (auto-refreshes every second).

### How it works

[lvh.me](http://lvh.me) is a public domain that resolves `*.lvh.me` to `127.0.0.1` — no `/etc/hosts` editing needed. By visiting two different subdomains you can verify whether identity cookies are shared.

### Test 1: Shared cookies (`crossSubdomainCookies: true`, the default)

1. Start the dev server: `yarn start`
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

## Scaffold-ETH 2

This example is built on top of [Scaffold-ETH 2](https://github.com/scaffold-eth/scaffold-eth-2). See their [docs](https://docs.scaffoldeth.io) for info on smart contract development, the debug page, and the local chain setup.
