import { defineWalletSetup } from "@synthetixio/synpress";
import { MetaMask } from "@synthetixio/synpress/playwright";

// A THROWAWAY seed phrase. It is the well-known Hardhat/anvil test mnemonic:
// every key derived from it is public, funded only on local dev chains, and
// worth nothing anywhere else. Never replace this with a real one.
const SEED_PHRASE = "test test test test test test test test test test test junk";
const PASSWORD = "Formo-e2e-throwaway-1";

export default defineWalletSetup(PASSWORD, async (context, walletPage) => {
  const metamask = new MetaMask(context, walletPage, PASSWORD);
  await metamask.importWallet(SEED_PHRASE);
  // The local chain is NOT added here. Synpress's addNetwork drives
  // MetaMask's settings UI, whose selectors drift between extension builds
  // and broke on first run. The test adds it the way a dapp does, through
  // wallet_addEthereumChain, and approves that prompt instead.
});
