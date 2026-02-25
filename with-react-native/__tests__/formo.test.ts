import { FORMO_WRITE_KEY, createFormoOptions } from "../config/formo";

// Mock wagmi config
const mockWagmiConfig = {} as any;
const mockQueryClient = {} as any;

describe("Formo Configuration", () => {
  describe("FORMO_WRITE_KEY", () => {
    it("should be defined", () => {
      expect(FORMO_WRITE_KEY).toBeDefined();
    });

    it("should be a string", () => {
      expect(typeof FORMO_WRITE_KEY).toBe("string");
    });
  });

  describe("createFormoOptions", () => {
    it("should return options object", () => {
      const options = createFormoOptions(mockWagmiConfig, mockQueryClient);
      expect(options).toBeDefined();
      expect(typeof options).toBe("object");
    });

    it("should include app configuration", () => {
      const options = createFormoOptions(mockWagmiConfig, mockQueryClient);
      expect(options.app).toBeDefined();
      expect(options.app.name).toBe("Formo Analytics Demo");
      expect(options.app.version).toBe("1.0.0");
    });

    it("should include wagmi configuration", () => {
      const options = createFormoOptions(mockWagmiConfig, mockQueryClient);
      expect(options.wagmi).toBeDefined();
      expect(options.wagmi.config).toBe(mockWagmiConfig);
      expect(options.wagmi.queryClient).toBe(mockQueryClient);
    });

    it("should have flush settings", () => {
      const options = createFormoOptions(mockWagmiConfig, mockQueryClient);
      expect(options.flushAt).toBe(10);
      expect(options.flushInterval).toBe(15000);
    });
  });
});
