# Formo + Solana framework-kit

A focused Next.js example for Formo's optional [framework-kit](https://github.com/solana-foundation/framework-kit) store integration.

The app passes `@solana/client`'s `client.store` to `options.solana.store`. Formo reads connect, disconnect, cluster, and transaction lifecycle state from that store while Wallet Standard discovery supplies `detect` events.

For the recommended Solana Kit stack and Formo's store-free Wallet Standard integration, see [`with-solana`](../with-solana).

## Run

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).
