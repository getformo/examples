import { testWithSynpress } from "@synthetixio/synpress";
import { MetaMask, metaMaskFixtures } from "@synthetixio/synpress/playwright";
import basicSetup from "../wallet-setup/basic.setup";

// Real MetaMask, real prompts, the published SDK. The page announces no fake
// wallet: the extension is the only provider, discovered over EIP-6963 the
// way it is for every customer. Events are intercepted in-page and never
// leave the machine; the only chain touched is a local anvil.
const test = testWithSynpress(metaMaskFixtures(basicSetup));
const { expect } = test;



const events = (page: any) =>
  page.evaluate(() =>
    (window as any).__sent.map((e: any) => e.type + (e.properties?.status ? ":" + e.properties.status : "") + "@" + (e.properties?.chain_id ?? "-"))
  );

test("the SDK sees a real MetaMask connect, sign, chain switch and transaction", async ({ context, page, metamaskPage, extensionId }) => {
  // The fixture has already opened the harness at baseURL.
  const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId);
  await page.evaluate(() => (window as any).__ready);

  // Discovery over EIP-6963: only the real extension.
  const discovered = await page.evaluate(() => (window as any).formo.providers.map((d: any) => d.info.rdns));
  expect(discovered).toEqual(["io.metamask"]);


  // Connect. Fire the request WITHOUT awaiting: it blocks until the extension
  // prompt is answered, and Synpress answers it on the next line.
  // Connect through the provider the SDK wrapped: that is the path every
  // customer takes, so it is the one this test must exercise.
  await page.waitForTimeout(1500);
  const connectP = page.evaluate(() =>
    (window as any).formo.providers[0].provider.request({ method: "eth_requestAccounts" })
      .then((a: string[]) => ({ ok: a }), (e: any) => ({ err: { code: e?.code, message: e?.message } }))
  );
  await metamask.connectToDapp();
  const connected = await connectP;
  expect(connected, "eth_requestAccounts must resolve").not.toHaveProperty("err");
  await expect.poll(() => events(page)).toContain("connect@1");

  // Sign. This is the path that was silently dropped in every browser
  // before 1.36.0, because it decoded the message with Node's Buffer.
  const msg = "Formo real-MetaMask e2e";
  const hex = "0x" + Buffer.from(msg, "utf8").toString("hex");
  const address: string = await page.evaluate(() => (window as any).formo.currentAddress);
  const signP = page.evaluate(([h, a]) => (window as any).formo.providers[0].provider.request({ method: "personal_sign", params: [h, a] }), [hex, address]);
  await metamask.confirmSignature();
  await signP;
  await expect.poll(() => events(page)).toContain("signature:confirmed@1");
  const decoded = await page.evaluate(() => (window as any).__sent.find((e: any) => e.type === "signature")?.properties?.message);
  expect(decoded).toBe(msg);

  // Add and switch to the local chain the way a dapp does. MetaMask shows one
  // prompt for the add and, on current builds, switches in the same step.
  const addP = page.evaluate(() => (window as any).formo.providers[0].provider.request({
    method: "wallet_addEthereumChain",
    params: [{ chainId: "0x7a69", chainName: "Anvil (local)", rpcUrls: ["http://127.0.0.1:8545"], nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 } }],
  }));
  await metamask.approveNewNetwork();
  await addP;
  await metamask.approveSwitchNetwork().catch(() => undefined); // older builds prompt separately
  await expect.poll(() => events(page), { timeout: 20_000 }).toContain("chain@31337");

  // A real transaction on anvil. The account is funded by the test.
  const txP = page.evaluate(([a]) => (window as any).formo.providers[0].provider.request({ method: "eth_sendTransaction", params: [{ from: a, to: a, value: "0x1" }] }), [address]);
  await metamask.confirmTransaction();
  await txP;
  await expect.poll(() => events(page), { timeout: 30_000 }).toContain("transaction:confirmed@31337");

  // Exactly one of each, no duplicates: the shape of every bug in this area.
  const all = await events(page);
  for (const e of ["connect@1", "signature:requested@1", "signature:confirmed@1", "chain@31337", "transaction:started@31337", "transaction:broadcasted@31337", "transaction:confirmed@31337"]) {
    expect(all.filter((x: string) => x === e), e).toHaveLength(1);
  }
});

test("a rejected signature is reported as rejected, once", async ({ context, page, metamaskPage, extensionId }) => {
  // The fixture has already opened the harness at baseURL.
  const metamask = new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId);
  await page.evaluate(() => (window as any).__ready);
  const connectP = page.evaluate(() => (window as any).formo.providers[0].provider.request({ method: "eth_requestAccounts" }));
  await metamask.connectToDapp();
  await connectP;
  const address: string = await page.evaluate(() => (window as any).formo.currentAddress);

  const signP = page.evaluate(([a]) => (window as any).formo.providers[0].provider.request({ method: "personal_sign", params: ["0x68656c6c6f", a] }).catch((e: any) => e?.code), [address]);
  await metamask.rejectSignature();
  expect(await signP).toBe(4001);
  await expect.poll(() => events(page)).toContain("signature:rejected@1");
  const all = await events(page);
  expect(all.filter((x: string) => x.startsWith("signature:")), "one requested, one rejected").toEqual(["signature:requested@1", "signature:rejected@1"]);
});
