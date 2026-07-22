// Stands in for the Metro dev server. Deliberately NOT localhost: the fallback
// when hostUri is absent is localhost, so a hardcoded localhost would satisfy
// the host assertion below and the regression guard would never fail.
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: { hostUri: "192.168.1.5:8081" } },
}));

import { chains, wagmiConfig } from "../config/wagmi";

describe("Wagmi Configuration", () => {
  describe("chains", () => {
    it("should include Base Sepolia", () => {
      const baseSepolia = chains.find((chain) => chain.id === 84532);
      expect(baseSepolia).toBeDefined();
      expect(baseSepolia?.name).toBe("Base Sepolia");
    });

    it("should include Optimism Sepolia", () => {
      const optimismSepolia = chains.find((chain) => chain.id === 11155420);
      expect(optimismSepolia).toBeDefined();
      expect(optimismSepolia?.name).toBe("OP Sepolia");
    });

    it("should have exactly 2 chains configured", () => {
      expect(chains).toHaveLength(2);
    });

    // The mock connector reads chain.rpcUrls.default.http[0] directly and
    // ignores wagmi's `transports`, so the local-node override has to land
    // here or Send Tx / Sign Message silently talk to the public RPC instead.
    it("points each chain at a local node rather than the public RPC", () => {
      for (const chain of chains) {
        expect(chain.rpcUrls.default.http[0]).toMatch(/^http:\/\/[^/]+:854[56]$/);
      }
    });

    // Regression guard: hardcoding localhost only reaches the dev machine from
    // the iOS simulator. An Android emulator resolves it to the emulator and a
    // physical device to itself, so the host must come from Expo's dev-server
    // address — the machine actually running anvil.
    it("derives the RPC host from the Expo dev server, not localhost", () => {
      for (const chain of chains) {
        expect(chain.rpcUrls.default.http[0]).toContain("//192.168.1.5:");
        expect(chain.rpcUrls.default.http[0]).not.toContain("localhost");
      }
    });
  });

  describe("wagmiConfig", () => {
    it("should be defined", () => {
      expect(wagmiConfig).toBeDefined();
    });

    it("should have chains configured", () => {
      expect(wagmiConfig.chains).toBeDefined();
      expect(wagmiConfig.chains.length).toBeGreaterThan(0);
    });
  });
});
