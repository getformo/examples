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
