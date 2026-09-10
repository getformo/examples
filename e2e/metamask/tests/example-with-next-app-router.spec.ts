import type { BrowserContext, Page } from "@playwright/test";
import { expect, test } from "../fixtures";

// The with-next-app-router EXAMPLE APP (scaffold-eth 2: Next.js app router,
// wagmi 2, RainbowKit) driven end to end with a real MetaMask extension. Every
// step goes through the app's own UI: the RainbowKit connect modal, the app's
// sign-message and sign-typed-data forms, its network dropdown and its
// disconnect item. The app configures the SDK itself and proxies events
// through /api/events, which this test intercepts in-page; nothing leaves the
// machine.
//
// The extension starts on Ethereum mainnet while the app targets Base Sepolia
// and Optimism Sepolia, so the app shows its "Wrong network" dropdown until
// the switch. That is the shape of a real first visit. The message signature is
// therefore captured on mainnet and the typed-data signature on Base Sepolia.
const EXAMPLE_URL = process.env.EXAMPLE_URL || "http://127.0.0.1:3007";

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

const events = (page: Page) =>
  page.evaluate(() =>
    (window as any).__sent.map((e: any) => e.type + (e.properties?.status ? ":" + e.properties.status : "") + "@" + (e.properties?.chain_id ?? "-"))
  );

const isNotificationPage = (candidate: Page, extensionId: string) =>
  !candidate.isClosed() && candidate.url().includes(`chrome-extension://${extensionId}/notification.html`);

const notificationPage = async (context: BrowserContext, extensionId: string): Promise<Page> => {
  await expect.poll(() => context.pages().some((candidate) => isNotificationPage(candidate, extensionId)), { timeout: 20_000 }).toBe(true);
  return context.pages().find((candidate) => isNotificationPage(candidate, extensionId))!;
};

const expectNotificationClosed = async (notification: Page) => {
  await expect.poll(() => notification.isClosed(), { timeout: 20_000 }).toBe(true);
};

// The primary button of whichever notification is open: "Approve" for adding a
// network, "Switch network" for switching to it.
const primaryActionText = async (context: BrowserContext, extensionId: string): Promise<string> => {
  for (const candidate of context.pages().filter((page) => isNotificationPage(page, extensionId))) {
    const primaryAction = candidate.locator(".confirmation-footer__actions button.btn-primary, button.btn-primary").first();
    if (await primaryAction.count()) return (await primaryAction.innerText()).trim();
  }
  return "";
};

test.setTimeout(240_000);

test("with-next-app-router: RainbowKit connect, sign, typed data, network switch and disconnect reach the SDK", async ({ context, metamask, extensionId }) => {
  const page = await context.newPage();
  await page.addInitScript(CAPTURE);
  await page.goto(EXAMPLE_URL);

  // Connect through the app's RainbowKit modal. The modal lists the real
  // extension, discovered over EIP-6963.
  await page.getByRole("button", { name: "Connect Wallet" }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: /MetaMask/ }).first().click();
  const connectNotification = await notificationPage(context, extensionId);
  await metamask.connectToDapp();
  await expectNotificationClosed(connectNotification);
  await expect(page.getByRole("button", { name: "Sign Message" })).toBeEnabled({ timeout: 20_000 });
  await expect.poll(() => events(page), { timeout: 30_000 }).toContain("connect@1");

  // personal_sign through the app's own form.
  const msg = "Formo example e2e " + Date.now();
  await page.getByRole("textbox", { name: "Enter a message to sign" }).first().fill(msg);
  await page.getByRole("button", { name: "Sign Message" }).click();
  const signNotification = await notificationPage(context, extensionId);
  await metamask.confirmSignature();
  await expectNotificationClosed(signNotification);
  await expect.poll(() => events(page), { timeout: 30_000 }).toContain("signature:confirmed@1");
  const decoded = await page.evaluate(() => (window as any).__sent.find((e: any) => e.type === "signature")?.properties?.message);
  expect(decoded).toBe(msg);

  // Switch network through the app's own dropdown. The extension asks to add
  // the network first, then to switch to it.
  await page.locator("label.dropdown-toggle", { hasText: "Wrong network" }).click();
  await page.getByRole("button", { name: /Switch to\s*Base Sepolia/ }).click();
  await notificationPage(context, extensionId);
  for (let prompts = 0; prompts < 2; prompts++) {
    let action = "";
    await expect.poll(async () => (action = await primaryActionText(context, extensionId)), { timeout: 20_000 }).toMatch(/approve|switch/i);
    if (/approve/i.test(action)) {
      await metamask.approveNewNetwork();
      continue;
    }
    await metamask.approveSwitchNetwork();
    break;
  }
  await expect.poll(() => events(page), { timeout: 40_000 }).toContain("chain@84532");
  // The app now considers the network supported and shows the address menu.
  await expect(page.locator("details.dropdown summary")).toBeVisible({ timeout: 30_000 });

  // eth_signTypedData_v4 through the app's own form. The app pins the typed
  // data domain to Base Sepolia, so this only works once the wallet is there:
  // a second signature, on a second chain.
  await page.getByRole("textbox", { name: "Enter a message to sign typed data" }).fill("typed " + msg);
  await page.getByRole("button", { name: "Sign Typed Data" }).click();
  const typedNotification = await notificationPage(context, extensionId);
  await metamask.confirmSignature();
  await expectNotificationClosed(typedNotification);
  await expect.poll(() => events(page), { timeout: 30_000 }).toContain("signature:confirmed@84532");

  // Disconnect through the app's address menu.
  await page.locator("details.dropdown summary").first().click();
  await page.getByRole("button", { name: "Disconnect" }).click();
  await expect(page.getByRole("button", { name: "Connect Wallet" }).first()).toBeVisible({ timeout: 20_000 });
  await expect.poll(() => events(page), { timeout: 30_000 }).toContain("disconnect@84532");

  // Exactly one of each, no duplicates: the shape of every bug in this area.
  const all = await events(page);
  for (const e of ["connect@1", "chain@84532", "disconnect@84532"]) {
    expect(all.filter((x: string) => x === e), e).toHaveLength(1);
  }
  for (const e of ["signature:requested@1", "signature:confirmed@1", "signature:requested@84532", "signature:confirmed@84532"]) {
    expect(all.filter((x: string) => x === e), e).toHaveLength(1);
  }
  const version = await page.evaluate(() => (window as any).__sent[0]?.context?.library_version);
  expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  await page.close();
});
