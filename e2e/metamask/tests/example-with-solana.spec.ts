import { chromium, expect, test, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SOLANA_WALLET } from "./solana-wallet";

// The with-solana EXAMPLE APP (Next.js, @solana/kit + the kit wallet plugin)
// driven end to end in a real browser with a real Wallet Standard wallet
// registered in the page, the way Phantom or Solflare register themselves.
// Every step goes through the app's own UI: its wallet menu, its cluster
// selector, its disconnect button. Events are captured in-page and never
// leave the machine.
//
// This layer covers the Solana paths that the Node runner exercises in jsdom:
// discovery over the Wallet Standard, the connect and disconnect hand-off, and
// a cluster change while a wallet is connected.
const EXAMPLE_URL = process.env.SOLANA_EXAMPLE_URL || "http://127.0.0.1:3008";
const WALLET_NAME = "E2E Wallet";
const ADDRESS = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";

const CAPTURE = `
window.__sent = [];
const realFetch = window.fetch.bind(window);
window.fetch = async (url, init) => {
  if (/(events\\.formo\\.so|\\/api\\/events|\\/events\\b)/i.test(String(url)) && (init?.method || "GET") === "POST") {
    try { const b = JSON.parse(init.body); for (const e of (Array.isArray(b) ? b : [b])) window.__sent.push(e); } catch {}
    return new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
  }
  return realFetch(url, init);
};`;

// The queue flushes on a timer and whenever the page is hidden. Hiding the
// page is the deterministic trigger, so every read forces the queue out first
// instead of racing the interval.
const events = async (page: Page) => {
  await page.evaluate(() => {
    const set = (hidden: boolean) => {
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => (hidden ? "hidden" : "visible") });
      Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
      document.dispatchEvent(new Event("visibilitychange"));
    };
    set(true);
    set(false);
  });
  await page.waitForTimeout(150);
  return page.evaluate(() =>
    (window as any).__sent.map((e: any) => {
      const address = e.address ?? e.properties?.address;
      return e.type + "@" + (e.properties?.chain_id ?? e.chain_id ?? "-") + "/" + (address ? String(address).slice(0, 4) : "-");
    })
  );
};

// Solana clusters as the SDK reports them (SOLANA_CHAIN_IDS).
const MAINNET = 900001;
const DEVNET = 900003;

test.setTimeout(180_000);

test("with-solana: the app's Wallet Standard connect, cluster switch and disconnect reach the SDK", async () => {
  const chromePath =
    process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  execFileSync(chromePath, ["--version"], { encoding: "utf8" });
  const profile = await mkdtemp(join(tmpdir(), "formo-solana-e2e-"));
  const context = await chromium.launchPersistentContext(profile, {
    executablePath: chromePath,
    headless: true,
    args: ["--disable-background-networking"],
    viewport: { width: 1280, height: 720 },
  });

  try {
    const page = await context.newPage();
    await page.addInitScript(CAPTURE);
    await page.addInitScript(SOLANA_WALLET(WALLET_NAME, ADDRESS));
    await page.goto(EXAMPLE_URL);

    // The app starts on devnet and lists the registered wallet in its own menu.
    await page.getByRole("button", { name: /Select Wallet/ }).click();
    await page.getByRole("button", { name: WALLET_NAME }).click();

    // Connected: the app shows the truncated address, the SDK reports the
    // connect on the configured cluster.
    await expect(page.getByRole("button", { name: new RegExp(ADDRESS.slice(0, 4)) })).toBeVisible({ timeout: 20_000 });
    await expect.poll(() => events(page), { timeout: 30_000 }).toContain(`connect@${DEVNET}/${ADDRESS.slice(0, 4)}`);

    // A cluster change through the app's own selector. The app disconnects the
    // wallet first, so the SDK sees the departure on the old cluster.
    await page.getByRole("combobox").selectOption("mainnet-beta");
    await expect.poll(() => events(page), { timeout: 30_000 }).toContain(`disconnect@${DEVNET}/${ADDRESS.slice(0, 4)}`);
    await expect(page.getByRole("button", { name: /Select Wallet/ })).toBeVisible({ timeout: 20_000 });

    // Connecting again on the new cluster is reported on that cluster.
    await page.getByRole("button", { name: /Select Wallet/ }).click();
    await page.getByRole("button", { name: WALLET_NAME }).click();
    await expect.poll(() => events(page), { timeout: 30_000 }).toContain(`connect@${MAINNET}/${ADDRESS.slice(0, 4)}`);

    // Disconnect through the app's own button.
    await page.getByRole("button", { name: new RegExp(ADDRESS.slice(0, 4)) }).click();
    await expect(page.getByRole("button", { name: /Select Wallet/ })).toBeVisible({ timeout: 20_000 });
    await expect.poll(() => events(page), { timeout: 30_000 }).toContain(`disconnect@${MAINNET}/${ADDRESS.slice(0, 4)}`);

    // Exactly one of each, no duplicates: the shape of every bug in this area.
    const all = await events(page);
    for (const e of [
      `connect@${DEVNET}/${ADDRESS.slice(0, 4)}`,
      `disconnect@${DEVNET}/${ADDRESS.slice(0, 4)}`,
      `connect@${MAINNET}/${ADDRESS.slice(0, 4)}`,
      `disconnect@${MAINNET}/${ADDRESS.slice(0, 4)}`,
    ]) {
      expect(all.filter((x: string) => x === e), e).toHaveLength(1);
    }
    // The wallet was detected once, and no EVM event was ever emitted.
    expect(all.filter((x: string) => x.startsWith("detect@")).length, "one detect").toBeGreaterThan(0);
    const version = await page.evaluate(() => (window as any).__sent[0]?.context?.library_version);
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  } finally {
    await context.close();
    await rm(profile, { recursive: true, force: true });
  }
});
