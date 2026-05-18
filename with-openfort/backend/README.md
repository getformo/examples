# with-openfort — Backend

Express server that mints Openfort Shield encryption sessions for the frontend.
It exposes a single endpoint — `POST /api/protected-create-encryption-session` —
and holds the Openfort **secret** keys, which must never reach the browser.

👉 See the [main example README](../README.md) for prerequisites, environment
variables, and setup steps.

## Quick reference

```sh
cp .env.example .env   # then fill in your Openfort secret + Shield keys
pnpm install
pnpm dev               # http://localhost:3000
```

The endpoint responds with a Shield session:

```json
{ "session": "cb44a4a1-5867-4b25-b5a0-57b496e14d78" }
```
