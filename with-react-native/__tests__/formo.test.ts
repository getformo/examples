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

    it("should take app identity from app.json, not a hardcoded copy", () => {
      // These reach Formo as `app_version` and as the mobile `origin`. A
      // hardcoded value that drifts from app.json reports the wrong version on
      // every event indefinitely, so assert they are the SAME value rather than
      // pinning a literal here (which is how they drifted in the first place).
      const appJson = require("../app.json").expo;
      const options = createFormoOptions(mockWagmiConfig, mockQueryClient);

      expect(options.app).toBeDefined();
      expect(options.app!.name).toBe(appJson.name);
      expect(options.app!.version).toBe(appJson.version);
      expect(options.app!.bundleId).toBe(appJson.ios.bundleIdentifier);
    });

    it("keeps the iOS bundle id and Android package in sync", () => {
      // The SDK sends one bundleId for both platforms, so a mismatch would make
      // the same app report two different origins depending on the platform.
      const appJson = require("../app.json").expo;
      expect(appJson.ios.bundleIdentifier).toBe(appJson.android.package);
    });

    it("should include wagmi configuration", () => {
      const options = createFormoOptions(mockWagmiConfig, mockQueryClient);
      expect(options.wagmi).toBeDefined();
      expect(options.wagmi!.config).toBe(mockWagmiConfig);
      expect(options.wagmi!.queryClient).toBe(mockQueryClient);
    });

    it("should have flush settings", () => {
      const options = createFormoOptions(mockWagmiConfig, mockQueryClient);
      expect(options.flushAt).toBe(10);
      expect(options.flushInterval).toBe(15000);
    });
  });
});
