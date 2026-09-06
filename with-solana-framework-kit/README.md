# Formo + Solana framework-kit

A Next.js example for Formo's recommended Solana dapp integration with [framework-kit](https://github.com/solana-foundation/framework-kit).

It passes `@solana/client`'s `client.store` to `options.solana.store`, allowing Formo to autocapture wallet connections, cluster changes, and transactions recorded by framework-kit. Wallet Standard supplies wallet detection.

The app includes:

- Wallet selection, connection state, balance, and network switching
- Direct SOL transfer and transaction-pool demos
- Preset and editable custom analytics events
- Devnet, testnet, mainnet, and custom RPC configuration

For a lower-level `@solana/kit` stack without framework-kit, see [`with-solana`](../with-solana).

## Run

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Set `NEXT_PUBLIC_FORMO_WRITE_KEY` in `.env`, then open [http://localhost:3000](http://localhost:3000). The app defaults to Devnet; use `NEXT_PUBLIC_SOLANA_CLUSTER` and `NEXT_PUBLIC_SOLANA_RPC_URL` to override it.
