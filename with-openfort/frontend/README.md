# with-openfort — Frontend

Vite + React + wagmi frontend for the **Formo + Openfort** example. It uses
Openfort embedded wallets (Shield), the Aave lending protocol, and the
[Formo Analytics SDK](https://docs.formo.so/).

👉 See the [main example README](../README.md) for prerequisites, environment
variables, setup steps, and how the Formo integration works.

## Quick reference

```sh
cp .env.example .env   # then fill in your Openfort + Formo keys
pnpm install
pnpm dev               # http://localhost:5173
```

The frontend needs the backend in [`../backend`](../backend) running (default
`http://localhost:3000`) to create Openfort Shield encryption sessions.
