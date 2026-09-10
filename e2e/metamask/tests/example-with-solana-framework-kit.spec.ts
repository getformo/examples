import { chromium, expect, test, type Page } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SOLANA_WALLET } from "./solana-wallet";

// The with-solana-framework-kit EXAMPLE APP driven end to end in a real
// browser with a real Wallet Standard wallet registered in the page.
//
// This app hands the SDK the framework kit's own store instead of letting it
// watch the Wallet Standard directly, so it covers the other Solana path: the
// store hand-off, including a cluster change made on the store while the app
// is between wallets.
const EXAMPLE_URL = process.env.SOLANA_KIT_EXAMPLE_URL || "http://127.0.0.1:3009";
const WALLET_NAME = "E2E Wallet";
const ADDRESS = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";
const SHORT = ADDRESS.slice(0, 4);

const MAINNET = 900001;
const DEVNET = 900003;

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

test.setTimeout(180_000);

test("with-solana-framework-kit: the store hand-off reports connect, disconnect and a cluster change", async () => {
  const chromePath =
    process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
  const profile = await mkdtemp(join(tmpdir(), "formo-solana-kit-e2e-"));
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

    // Connect through the app's own wallet menu, on the configured cluster.
    await page.getByRole("button", { name: /Select Wallet/ }).click();
    await page.getByRole("button", { name: WALLET_NAME }).click();
    await expect(page.getByRole("button", { name: new RegExp(SHORT) })).toBeVisible({ timeout: 20_000 });
    await expect.poll(() => events(page), { timeout: 30_000 }).toContain(`connect@${DEVNET}/${SHORT}`);

    // This app requires the wallet to leave before the cluster can change, so
    // the departure is reported on the old cluster.
    await page.getByRole("button", { name: new RegExp(SHORT) }).click();
    await expect(page.getByRole("button", { name: /Select Wallet/ })).toBeVisible({ timeout: 20_000 });
    await expect.poll(() => events(page), { timeout: 30_000 }).toContain(`disconnect@${DEVNET}/${SHORT}`);

    // The cluster changes on the store itself, with no wallet attached.
    await page.getByRole("combobox").selectOption("mainnet");
    await page.waitForTimeout(1000);

    // Connecting again is reported on the new cluster, which proves the SDK
    // took the store's cluster change rather than keeping the old one.
    await page.getByRole("button", { name: /Select Wallet/ }).click();
    await page.getByRole("button", { name: WALLET_NAME }).click();
    await expect(page.getByRole("button", { name: new RegExp(SHORT) })).toBeVisible({ timeout: 20_000 });
    await expect.poll(() => events(page), { timeout: 30_000 }).toContain(`connect@${MAINNET}/${SHORT}`);

    // Leave again, on the new cluster.
    await page.getByRole("button", { name: new RegExp(SHORT) }).click();
    await expect(page.getByRole("button", { name: /Select Wallet/ })).toBeVisible({ timeout: 20_000 });
    await expect.poll(() => events(page), { timeout: 30_000 }).toContain(`disconnect@${MAINNET}/${SHORT}`);

    // Exactly one of each, no duplicates: the shape of every bug in this area.
    const all = await events(page);
    for (const e of [
      `connect@${DEVNET}/${SHORT}`,
      `disconnect@${DEVNET}/${SHORT}`,
      `connect@${MAINNET}/${SHORT}`,
      `disconnect@${MAINNET}/${SHORT}`,
    ]) {
      expect(all.filter((x: string) => x === e), e).toHaveLength(1);
    }
    const version = await page.evaluate(() => (window as any).__sent[0]?.context?.library_version);
    expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  } finally {
    await context.close();
    await rm(profile, { recursive: true, force: true });
  }
});
