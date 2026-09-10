// A Wallet Standard wallet, registered the way a real Solana extension
// registers itself: it answers "wallet-standard:app-ready" and fires
// "wallet-standard:register-wallet". Injected into the page before any app
// code runs, so the app and the SDK discover it exactly as they discover
// Phantom or Solflare.
//
// It is a page script, serialised as a string for addInitScript, so it may not
// reference anything outside itself.
export const SOLANA_WALLET = (name: string, address: string) => `
(() => {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const decode = (s) => {
    const bytes = [0];
    for (const character of s) {
      let carry = ALPHABET.indexOf(character);
      if (carry < 0) throw new Error("bad base58");
      for (let i = 0; i < bytes.length; i++) { carry += bytes[i] * 58; bytes[i] = carry & 0xff; carry >>= 8; }
      while (carry) { bytes.push(carry & 0xff); carry >>= 8; }
    }
    for (const character of s) { if (character !== "1") break; bytes.push(0); }
    return new Uint8Array(bytes.reverse());
  };

  const ADDRESS = ${JSON.stringify(address)};
  const CHAINS = ["solana:mainnet", "solana:devnet", "solana:testnet"];
  const ICON = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciLz4=";

  const account = {
    address: ADDRESS,
    publicKey: decode(ADDRESS),
    chains: CHAINS,
    features: ["solana:signMessage", "solana:signTransaction", "solana:signAndSendTransaction"],
    label: ${JSON.stringify(name)},
    icon: ICON,
  };

  const listeners = [];
  const emitChange = (properties) => { for (const listener of listeners) listener(properties); };

  const wallet = {
    version: "1.0.0",
    name: ${JSON.stringify(name)},
    icon: ICON,
    chains: CHAINS,
    accounts: [],
    features: {
      "standard:connect": {
        version: "1.0.0",
        connect: async () => {
          wallet.accounts = [account];
          emitChange({ accounts: wallet.accounts });
          return { accounts: wallet.accounts };
        },
      },
      "standard:disconnect": {
        version: "1.0.0",
        disconnect: async () => {
          wallet.accounts = [];
          emitChange({ accounts: wallet.accounts });
        },
      },
      "standard:events": {
        version: "1.0.0",
        on: (event, listener) => {
          if (event !== "change") return () => {};
          listeners.push(listener);
          return () => { const at = listeners.indexOf(listener); if (at >= 0) listeners.splice(at, 1); };
        },
      },
      "solana:signMessage": {
        version: "1.0.0",
        signMessage: async (...inputs) => inputs.map((input) => ({ signedMessage: input.message, signature: new Uint8Array(64) })),
      },
      "solana:signTransaction": {
        version: "1.0.0",
        supportedTransactionVersions: ["legacy", 0],
        signTransaction: async (...inputs) => inputs.map((input) => ({ signedTransaction: input.transaction })),
      },
      "solana:signAndSendTransaction": {
        version: "1.0.0",
        supportedTransactionVersions: ["legacy", 0],
        signAndSendTransaction: async (...inputs) => inputs.map(() => ({ signature: new Uint8Array(64) })),
      },
    },
  };

  // The wallet is reachable from the test as well, to drive a disconnect that
  // the wallet itself initiates.
  window.__wallet = wallet;

  const register = (api) => { try { api.register(wallet); } catch {} };
  window.addEventListener("wallet-standard:app-ready", (event) => register(event.detail));
  window.dispatchEvent(new CustomEvent("wallet-standard:register-wallet", { detail: register }));
})();
`;
