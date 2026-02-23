# Formo + Farcaster Mini App Example

This example demonstrates how to integrate [Formo Analytics SDK](https://formo.so) with a [Farcaster Mini App](https://miniapps.farcaster.xyz/docs/getting-started), built with [Vite](https://vitejs.dev) and bootstrapped with [`@farcaster/create-mini-app`](https://github.com/farcasterxyz/miniapps/tree/main/packages/create-mini-app).

## Features

- **Farcaster Mini App**: Runs inside the Farcaster client as a mini app
- **Formo Analytics with Wagmi**: Automatic tracking of wallet events via wagmi integration
- **Wallet Actions**: Connect, sign messages, send transactions, and batch transactions (EIP-5792)
- **Custom Event Tracking**: Track custom events with properties

## Quick Start

1. **Clone the repository:**

   ```bash
   git clone https://github.com/getformo/examples.git
   cd examples/with-farcaster
   ```

2. **Install dependencies:**

   ```bash
   yarn install
   ```

3. **Configure environment variables:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your keys:

   ```env
   VITE_WC_PROJECT_ID=your_walletconnect_project_id
   VITE_FORMO_ANALYTICS_WRITE_KEY=your_formo_write_key
   ```

4. **Start the development server:**

   ```bash
   yarn dev
   ```

## `farcaster.json`

The `/.well-known/farcaster.json` is served from the [public
directory](https://vite.dev/guide/assets) and can be updated by editing
`./public/.well-known/farcaster.json`.

You can also use the `public` directory to serve a static image for `splashBackgroundImageUrl`.

## Frame Embed

Add the `fc:frame` meta tag in `index.html` to make your root app URL sharable in feeds:

```html
  <head>
    <!--- other tags --->
    <meta name="fc:frame" content='{"version":"next","imageUrl":"https://placehold.co/900x600.png?text=Frame%20Image","button":{"title":"Open","action":{"type":"launch_frame","name":"App Name","url":"https://app.com"}}}' />
  </head>
```

## Resources

- [Formo Documentation](https://docs.formo.so)
- [Farcaster Mini Apps Documentation](https://miniapps.farcaster.xyz/docs/getting-started)
- [Vite Documentation](https://vitejs.dev)

## License

MIT
