/**
 * The Formo SDK decodes signed-message payloads with Node's `Buffer`
 * (`Buffer.from(hex, 'hex')`). Webpack-based bundlers polyfill Node globals
 * automatically, but Angular's esbuild build does not — so expose `Buffer`
 * on the global scope before the app (and the SDK) start.
 */
import { Buffer } from 'buffer';

(globalThis as unknown as { Buffer?: typeof Buffer }).Buffer ??= Buffer;
