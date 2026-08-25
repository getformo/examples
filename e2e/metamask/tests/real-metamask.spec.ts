import type { BrowserContext, Page } from "@playwright/test";
import { expect, test } from "../fixtures";

// Real MetaMask, real prompts, the published SDK. The page announces no fake
// wallet: the extension is the only provider, discovered over EIP-6963 the
// way it is for every customer. Events are intercepted in-page and never
// leave the machine; the only chain touched is a local anvil.
const events = (page: any) =>
  page.evaluate(() =>
    (window as any).__sent.map((e: any) => e.type + (e.properties?.status ? ":" + e.properties.status : "") + "@" + (e.properties?.chain_id ?? "-"))
  );

const startConnectFromUserGesture = async (page: Page) => {
  await page.evaluate(() => {
    const button = document.createElement("button");
    button.id = "connect-wallet";
    button.textContent = "Connect wallet";
    button.addEventListener("click", () => {
      (window as any).__connectResult = (window as any).formo.providers[0].provider
        .request({ method: "eth_requestAccounts" })
        .then((accounts: string[]) => ({ ok: accounts }), (error: any) => ({ err: { code: error?.code, message: error?.message } }));
    });
    document.body.append(button);
  });
  await page.getByRole("button", { name: "Connect wallet" }).click();
  return page.evaluate(() => (window as any).__connectResult);
};

const notificationPage = async (context: BrowserContext, extensionId: string): Promise<Page> => {
  const matches = (candidate: Page) =>
    !candidate.isClosed() && candidate.url().includes(`chrome-extension://${extensionId}/notification.html`);

  const existing = context.pages().find(matches);
  if (existing) return existing;
  await expect.poll(() => context.pages().some(matches), { timeout: 15_000 }).toBe(true);
  return context.pages().find(matches)!;
};

const expectNotificationClosed = async (notification: Page) => {
  await expect.poll(() => notification.isClosed()).toBe(true);
};

test("the SDK sees a real MetaMask connect, sign, chain switch and transaction", async ({ context, page, metamask, extensionId }) => {
  await page.evaluate(() => (window as any).__ready);

  // Discovery over EIP-6963: only the real extension.
  const discovered = await page.evaluate(() => (window as any).formo.providers.map((d: any) => d.info.rdns));
  expect(discovered).toEqual(["io.metamask"]);


  // Connect. Fire the request WITHOUT awaiting: it blocks until the extension
  // prompt is answered, and Synpress answers it on the next line.
  // Connect through the provider the SDK wrapped: that is the path every
  // customer takes, so it is the one this test must exercise.
  await page.waitForTimeout(1500);
  const connectP = startConnectFromUserGesture(page);
  const connectNotification = await notificationPage(context, extensionId);
  await metamask.connectToDapp();
  const connected = await connectP;
  await expectNotificationClosed(connectNotification);
  expect(connected, "eth_requestAccounts must resolve").not.toHaveProperty("err");
  await expect.poll(() => events(page)).toContain("connect@1");

  // Sign. This is the path that was silently dropped in every browser
  // before 1.36.0, because it decoded the message with Node's Buffer.
  const msg = "Formo real-MetaMask e2e";
  const hex = "0x" + Buffer.from(msg, "utf8").toString("hex");
  const address: string = await page.evaluate(() => (window as any).formo.currentAddress);
  const signP = page.evaluate(([h, a]) => (window as any).formo.providers[0].provider.request({ method: "personal_sign", params: [h, a] }), [hex, address]);
  const signNotification = await notificationPage(context, extensionId);
  await metamask.confirmSignature();
  await signP;
  await expectNotificationClosed(signNotification);
  await expect.poll(() => events(page)).toContain("signature:confirmed@1");
  const decoded = await page.evaluate(() => (window as any).__sent.find((e: any) => e.type === "signature")?.properties?.message);
  expect(decoded).toBe(msg);

  // Add and switch to the local chain the way a dapp does. The MetaMask build
  // pinned by Synpress presents these as two confirmations; the request only
  // resolves after both have been approved.
  const addP = page.evaluate(() => (window as any).formo.providers[0].provider.request({
    method: "wallet_addEthereumChain",
    params: [{ chainId: "0x7a69", chainName: "Anvil (local)", rpcUrls: ["http://127.0.0.1:8545"], nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 } }],
  }));
  const addNotification = await notificationPage(context, extensionId);
  await metamask.approveNewNetwork();
  const switchNotification = await notificationPage(context, extensionId);
  await metamask.approveSwitchNetwork();
  await addP;
  await expectNotificationClosed(addNotification);
  await expectNotificationClosed(switchNotification);
  await expect.poll(() => events(page), { timeout: 20_000 }).toContain("chain@31337");

  // A real transaction on anvil. The account is funded by the test.
  const txP = page.evaluate(([a]) => (window as any).formo.providers[0].provider.request({ method: "eth_sendTransaction", params: [{ from: a, to: a, value: "0x1" }] }), [address]);
  const txNotification = await notificationPage(context, extensionId);
  await metamask.confirmTransaction();
  await txP;
  await expectNotificationClosed(txNotification);
  await expect.poll(() => events(page), { timeout: 30_000 }).toContain("transaction:confirmed@31337");

  // Exactly one of each, no duplicates: the shape of every bug in this area.
  const all = await events(page);
  for (const e of ["connect@1", "signature:requested@1", "signature:confirmed@1", "chain@31337", "transaction:started@31337", "transaction:broadcasted@31337", "transaction:confirmed@31337"]) {
    expect(all.filter((x: string) => x === e), e).toHaveLength(1);
  }
});

test("a rejected signature is reported as rejected, once", async ({ context, page, metamask, extensionId }) => {
  await page.evaluate(() => (window as any).__ready);
  const connectP = startConnectFromUserGesture(page);
  const connectNotification = await notificationPage(context, extensionId);
  await metamask.connectToDapp();
  expect(await connectP).not.toHaveProperty("err");
  await expectNotificationClosed(connectNotification);
  const address: string = await page.evaluate(() => (window as any).formo.currentAddress);

  const signP = page.evaluate(([a]) => (window as any).formo.providers[0].provider.request({ method: "personal_sign", params: ["0x68656c6c6f", a] }).catch((e: any) => e?.code), [address]);
  const signNotification = await notificationPage(context, extensionId);
  await metamask.rejectSignature();
  expect(await signP).toBe(4001);
  await expectNotificationClosed(signNotification);
  await expect.poll(() => events(page)).toContain("signature:rejected@1");
  const all = await events(page);
  expect(all.filter((x: string) => x.startsWith("signature:")), "one requested, one rejected").toEqual(["signature:requested@1", "signature:rejected@1"]);
});
