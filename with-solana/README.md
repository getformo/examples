# Formo + Solana Kit

A Next.js app demonstrating [Formo Analytics](https://github.com/getformo/sdk) with the lower-level [Solana Kit](https://github.com/anza-xyz/kit) stack:

- `@solana/kit`
- `@solana/kit-plugin-wallet`
- `@solana/kit-plugin-rpc`
- `@solana/react`

This is the store-free Solana integration. Formo observes Wallet Standard directly, so the app does not pass a wallet store or add manual connect/disconnect calls.

For the recommended Solana dapp setup with framework-kit and its reactive store, see [`with-solana-framework-kit`](../with-solana-framework-kit).

## Events

| Event | Source |
|---|---|
| `detect` | A compatible wallet registers through Wallet Standard |
| `connect` | The wallet publishes an authorized Solana account |
| `disconnect` | The wallet removes its authorized accounts |
| `transaction` | The demo calls `formo.transaction()` around its chain-aware send flow |
| `track` | The demo calls `formo.track()` for product events |

Wallet Standard does not expose the app's active cluster, signatures, or transaction lifecycle. The example passes the selected cluster to Formo and tracks its transaction explicitly.

## Run

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

The environment defaults to Devnet:

```env
NEXT_PUBLIC_FORMO_WRITE_KEY=your_write_key_here
NEXT_PUBLIC_SOLANA_CLUSTER=devnet
```

Set `NEXT_PUBLIC_SOLANA_RPC_URL` when using a custom endpoint. It must serve the same cluster named by `NEXT_PUBLIC_SOLANA_CLUSTER`.

## Formo setup

The SDK only needs the active cluster; there is no framework-kit store:

```tsx
<FormoAnalyticsProvider
  writeKey={process.env.NEXT_PUBLIC_FORMO_WRITE_KEY!}
  options={{
    evm: false,
    solana: { cluster },
  }}
>
  {children}
</FormoAnalyticsProvider>
```

`evm: false` is optional and avoids EVM provider discovery in this Solana-only app.

## Testing with a local SDK build

Build the SDK branch, then link it into this example:

```bash
# In the SDK repository
pnpm build

# In this directory
pnpm link /absolute/path/to/sdk
pnpm dev
```

Restore the published dependency afterward with `pnpm unlink @formo/analytics`.

## Testing checklist

- [ ] Load with a Wallet Standard wallet installed → `detect`
- [ ] Connect → one `connect` on the selected cluster
- [ ] Disconnect → one `disconnect`
- [ ] Reload an authorized session → `connect`
- [ ] Change network → disconnect, then reconnect on the new cluster
- [ ] Send the transfer → explicit transaction started and confirmed/rejected

## Related links

- [Formo Solana documentation](https://docs.formo.so/sdks/web#solana-integration)
- [Solana Kit](https://github.com/anza-xyz/kit)
- [Kit plugins](https://github.com/anza-xyz/kit-plugins)
- [Wallet Standard](https://github.com/wallet-standard/wallet-standard)
