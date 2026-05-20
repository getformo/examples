// Ambient type definitions for environment variables and the injected wallet provider.
// This file is a global script (no top-level import/export), so the declarations
// below augment the global scope across the whole app.

/**
 * Environment variables exposed to the browser by @ngx-env/builder.
 * Only variables prefixed with `NG_APP_` are bundled into the client.
 * See https://github.com/chihab/ngx-env
 */
declare interface Env {
  readonly NODE_ENV: string;
  /** Formo SDK write key — create one at https://app.formo.so (undefined until a .env is added) */
  readonly NG_APP_FORMO_WRITE_KEY: string | undefined;
  [key: string]: string | undefined;
}

// Access environment variables via `import.meta.env.NG_APP_*`.
declare interface ImportMeta {
  readonly env: Env;
}

/**
 * The EIP-1193 provider injected by browser wallets such as MetaMask.
 * `import('viem')` is a type-only reference, so this file stays a global script.
 */
interface Window {
  ethereum?: import('viem').EIP1193Provider;
}
