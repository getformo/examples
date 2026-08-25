import { chromium, expect, test as base, type BrowserContext, type Page } from "@playwright/test";
import { MetaMask, getExtensionId } from "@synthetixio/synpress-metamask/playwright";
import { execFileSync } from "node:child_process";
import { access, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import basicSetup from "./wallet-setup/basic.setup";

type MetaMaskFixtures = {
  context: BrowserContext;
  extensionId: string;
  metamask: MetaMask;
  metamaskPage: Page;
  page: Page;
};

const extensionPath = resolve(".cache-synpress/metamask-chrome-11.9.1");

export const test = base.extend<MetaMaskFixtures>({
  context: async ({}, use, testInfo) => {
    await access(extensionPath).catch(() => {
      throw new Error("MetaMask is missing; run `node prepare-metamask.mjs` first.");
    });
    if (!process.env.CHROME_PATH) throw new Error("CHROME_PATH must point to Chrome 130.");
    const chromeVersion = execFileSync(process.env.CHROME_PATH, ["--version"], { encoding: "utf8" });
    if (!/\b130\./.test(chromeVersion)) throw new Error(`Expected Chrome 130, received: ${chromeVersion.trim()}`);
    const profilePath = await mkdtemp(join(tmpdir(), "formo-metamask-e2e-"));
    const args = [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      "--disable-background-networking",
    ];
    const context = await chromium.launchPersistentContext(profilePath, {
      args,
      baseURL: String(testInfo.project.use.baseURL),
      executablePath: process.env.CHROME_PATH,
      headless: false,
      viewport: { width: 1280, height: 720 },
    });
    try {
      await use(context);
    } finally {
      await context.close();
      await rm(profilePath, { recursive: true, force: true });
    }
  },

  extensionId: async ({ context }, use) => {
    await use(await getExtensionId(context, "MetaMask"));
  },

  metamaskPage: async ({ context, extensionId }, use) => {
    await expect
      .poll(() => context.pages().some((candidate) => candidate.url().startsWith(`chrome-extension://${extensionId}/`)), {
        timeout: 15_000,
      })
      .toBe(true);
    const walletPage = context.pages().find((candidate) => candidate.url().startsWith(`chrome-extension://${extensionId}/`))!;
    await basicSetup.fn(context, walletPage);
    const metamask = new MetaMask(context, walletPage, basicSetup.walletPassword, extensionId);
    if (await walletPage.getByTestId("unlock-password").count()) await metamask.unlock();
    for (const candidate of context.pages()) {
      if (candidate !== walletPage) await candidate.close();
    }
    await use(walletPage);
  },

  metamask: async ({ context, extensionId, metamaskPage }, use) => {
    await use(new MetaMask(context, metamaskPage, basicSetup.walletPassword, extensionId));
  },

  page: async ({ context, metamaskPage: _metamaskPage }, use) => {
    const page = await context.newPage();
    await page.goto("/");
    await use(page);
    await page.close();
  },
});

export { expect } from "@playwright/test";
