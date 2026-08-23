import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { join } from "node:path";

// Serves the harness page and the PUBLISHED SDK bundle on a fixed local port
// for the whole run. Started by Playwright's globalSetup; stopped by the
// returned teardown.
const SDK_DIR = process.env.SDK_DIR || join(process.cwd(), "..", "..", "node_modules", "@formo", "analytics");
const PORT = 8766;

const PAGE = `<!doctype html><html><head><meta charset="utf-8"><title>Formo real-MetaMask e2e</title></head><body>
<script>
window.__sent = [];
const realFetch = window.fetch.bind(window);
window.fetch = async (url, init) => {
  if (/events|formo\\.so/i.test(String(url)) && (init?.method || "GET") === "POST") {
    try { const b = JSON.parse(init.body); for (const e of (Array.isArray(b) ? b : [b])) window.__sent.push(e); } catch {}
    return new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
  }
  return realFetch(url, init);
};
</script>
<script src="/sdk.js"></script>
<script>
window.__ready = new Promise((resolve) => {
  window.formofy("e2e-write-key", { tracking: true, flushAt: 1, logger: { enabled: false }, ready: resolve });
});
</script></body></html>`;

export default async function globalSetup() {
  const sdk = readFileSync(join(SDK_DIR, "dist/index.umd.min.js"));
  const server = createServer((req, res) => {
    if (req.url?.startsWith("/sdk.js")) { res.setHeader("content-type", "text/javascript"); res.end(sdk); return; }
    res.setHeader("content-type", "text/html"); res.end(PAGE);
  });
  await new Promise<void>((r) => server.listen(PORT, "127.0.0.1", r));
  return () => server.close();
}
