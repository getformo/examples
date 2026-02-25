/// <reference types="vite/client" />

// Global polyfills
declare global {
  interface Window {
    Buffer: typeof import('buffer').Buffer;
  }
  var Buffer: typeof import('buffer').Buffer;
}
