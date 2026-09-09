// Solana end-to-end scenarios against a BUILT SDK: the Wallet Standard
// registry, a framework-kit style store, and the hand-off between them.
//
// Usage: node solana.mjs <sdkPackageDir>
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";

const SDK_DIR = resolve(process.argv[2] ?? "");
if (!process.argv[2]) { console.error("usage: node solana.mjs <sdkPackageDir>"); process.exit(2); }
const sdkReq = createRequire(SDK_DIR + "/package.json");

const A = "FDKJvWcJNe6wecbgDYDFPCfgs14aJnVsUfWQRYWLn4Tn";
const B = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";
const MAINNET = 900001, DEVNET = 900003;
const settle = (ms = 40) => new Promise((r) => setTimeout(r, ms));

// --- one fresh DOM, SDK and event capture per scenario --------------------
let sent = [];
function freshDom() {
  const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "https://example.com/" });
  for (const k of ["window", "document", "location", "navigator", "localStorage", "sessionStorage"]) {
    Object.defineProperty(globalThis, k, { value: k === "window" ? dom.window : dom.window[k], writable: true, configurable: true });
  }
  globalThis.self = dom.window;
  globalThis.Event = dom.window.Event;
  globalThis.CustomEvent = dom.window.CustomEvent;
  globalThis.addEventListener = dom.window.addEventListener.bind(dom.window);
  globalThis.removeEventListener = dom.window.removeEventListener.bind(dom.window);
  globalThis.dispatchEvent = dom.window.dispatchEvent.bind(dom.window);
  sent = [];
  globalThis.fetch = async (_url, init) => {
    try {
      const body = JSON.parse(init?.body ?? "{}");
      for (const e of Array.isArray(body) ? body : [body]) {
        const pr = e.properties ?? {};
        sent.push(`${e.type === "track" ? "track(" + e.event + ")" : e.type}@${pr.chain_id ?? e.chain_id ?? "-"}/${(e.address ?? "-").slice(0, 4)}`);
      }
    } catch { /* non-JSON */ }
    return { ok: true, status: 200, json: async () => ({}), text: async () => "" };
  };
  return dom;
}
async function initSdk(options) {
  // A fresh module instance per scenario: the SDK keeps page-level state.
  for (const k of Object.keys(sdkReq.cache)) delete sdkReq.cache[k];
  const { FormoAnalytics } = sdkReq(SDK_DIR);
  const formo = await FormoAnalytics.init("wk_e2e", { tracking: true, flushAt: 1, flushInterval: 10, ...options });
  await settle();
  return formo;
}
const walletEvents = (events) => events.filter((e) => !/^page@/.test(e));

// --- fakes ------------------------------------------------------------------
function makeWallet(name) {
  const listeners = [];
  const wallet = {
    version: "1.0.0", name, icon: "data:image/svg+xml;base64,", chains: ["solana:mainnet", "solana:devnet"],
    features: { "standard:events": { version: "1.0.0", on: (_e, l) => { listeners.push(l); return () => listeners.splice(listeners.indexOf(l), 1); } } },
    accounts: [],
    setAccounts(accounts) { wallet.accounts = accounts; for (const l of [...listeners]) l({ accounts }); },
  };
  return wallet;
}
const account = (address) => ({ address, chains: ["solana:mainnet"] });
function registerWallet(wallet) {
  window.dispatchEvent(new CustomEvent("wallet-standard:register-wallet", { detail: (api) => api.register(wallet) }));
}
function makeStore(initial = {}) {
  let state = { transactions: {}, wallet: { status: "disconnected" }, cluster: { endpoint: "https://api.devnet.solana.com", status: { status: "ready" } }, lastUpdatedAt: Date.now(), ...initial };
  const listeners = [];
  return {
    getState: () => state,
    subscribe: (l) => { listeners.push(l); return () => listeners.splice(listeners.indexOf(l), 1); },
    setState(partial) { const prev = state; state = { ...state, ...partial }; for (const l of [...listeners]) l(state, prev); },
  };
}
const connected = (connectorId, name, address = A) => ({ status: "connected", connectorId, session: { account: { address }, connector: { id: connectorId, name }, disconnect: async () => undefined } });

// --- scenarios --------------------------------------------------------------
const scenarios = [
  ["store: a connector change on the same address keeps the wallet", async () => {
    freshDom();
    const store = makeStore({ wallet: connected("backpack", "Backpack") });
    const formo = await initSdk({ solana: { store } });
    store.setState({ wallet: connected("phantom", "Phantom") });
    await settle();
    return [[formo.currentAddress, A, "the reconnected wallet is still active"], [walletEvents(sent).join(","), `connect@${DEVNET}/FDKJ,disconnect@${DEVNET}/FDKJ,connect@${DEVNET}/FDKJ`]];
  }],
  ["store: a cluster change with chain capture off still gates later events", async () => {
    freshDom();
    const store = makeStore({ wallet: connected("backpack", "Backpack") });
    const formo = await initSdk({ solana: { store }, autocapture: { chain: false }, tracking: { excludeChains: [MAINNET] } });
    store.setState({ cluster: { endpoint: "https://api.mainnet-beta.solana.com", status: { status: "ready" } } });
    await settle();
    const before = sent.length;
    await formo.track("Order Placed", { market: "SOL" });
    await settle();
    return [[formo.currentChainId, MAINNET, "central state follows the store's cluster"], [sent.slice(before).join(","), "", "the track on the excluded cluster is dropped"]];
  }],
  ["store: a wallet the registry only recorded never takes the slot", async () => {
    freshDom();
    const store = makeStore({ wallet: connected("backpack", "Backpack") });
    const formo = await initSdk({ solana: { store } });
    const phantom = makeWallet("Phantom");
    registerWallet(phantom);
    phantom.setAccounts([account(B)]); // authorized, but the store owns wallet events
    await settle();
    store.setState({ wallet: { status: "disconnected" } });
    await settle();
    return [[formo.currentAddress, undefined, "no connect event exists for the recorded wallet"], [walletEvents(sent).join(","), `connect@${DEVNET}/FDKJ,detect@-/FDKJ,disconnect@${DEVNET}/FDKJ`]];
  }],
  ["registry: the newest remaining wallet takes the slot when the active one leaves", async () => {
    freshDom();
    const formo = await initSdk({});
    const solflare = makeWallet("Solflare"), phantom = makeWallet("Phantom");
    registerWallet(solflare); registerWallet(phantom);
    solflare.setAccounts([account(B)]);
    phantom.setAccounts([account(A)]);
    await settle();
    phantom.setAccounts([]);
    await settle();
    return [[formo.currentAddress, B, "Solflare is still connected"], [walletEvents(sent).join(","), `detect@-/-,detect@-/-,connect@${MAINNET}/9WzD,connect@${MAINNET}/FDKJ,disconnect@${MAINNET}/FDKJ`]];
  }],
  ["queue: a dropped duplicate answers its callback with a coded error", async () => {
    freshDom();
    const formo = await initSdk({});
    const codes = [];
    const cb = (err) => codes.push(err ? err.code ?? "error" : "ok");
    await formo.track("Order Placed", { market: "SOL" }, undefined, cb);
    await formo.track("Order Placed", { market: "SOL" }, undefined, cb);
    await settle();
    return [[codes.join(","), "ok,duplicate"]];
  }],
  ["queue: property bags built in a different order are one event", async () => {
    freshDom();
    const formo = await initSdk({});
    await formo.track("Order Placed", { market: "SOL", volume: 10 });
    await formo.track("Order Placed", { volume: 10, market: "SOL" });
    await settle();
    return [[sent.filter((e) => e.startsWith("track(")).length, 1]];
  }],
];

let failed = 0;
for (const [name, run] of scenarios) {
  let problems = [];
  try {
    for (const [got, want, label] of await run()) {
      if (got !== want) problems.push(`${label ?? "events"}: got ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
    }
  } catch (e) { problems.push(`crashed: ${e?.stack?.split("\n")[0] ?? e}`); }
  if (problems.length) { failed++; console.log(`  FAIL ${name}\n       ${problems.join("\n       ")}`); }
  else console.log(`  ok   ${name}`);
}
console.log(failed ? `${failed} of ${scenarios.length} scenario(s) failed` : `all ${scenarios.length} scenarios passed`);
process.exit(failed ? 1 : 0);
