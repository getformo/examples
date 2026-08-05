"use client";

import {
  CrossmintProvider,
  CrossmintAuthProvider,
  CrossmintWalletProvider,
} from "@crossmint/client-sdk-react-ui";
import { FormoAnalyticsProvider } from "@formo/analytics";
import { FormoCrossmintBridge } from "@/components/formo-bridge";
import { SUPPORTED_CHAINS, type SupportedChain } from "@/lib/chain";

// Validate NEXT_PUBLIC_CHAIN against the supported list so mis-configurations
// surface immediately rather than silently creating wallets on the wrong chain.
const rawChain = process.env.NEXT_PUBLIC_CHAIN ?? "base-sepolia";
const chain: SupportedChain =
  rawChain in SUPPORTED_CHAINS
    ? (rawChain as SupportedChain)
    : (() => {
        throw new Error(
          `[with-crossmint] Unsupported chain: "${rawChain}". ` +
            `Supported values: ${Object.keys(SUPPORTED_CHAINS).join(", ")}`,
        );
      })();

const customAppearance = {
  colors: {
    accent: "#020617",
  },
};

/**
 * Small fallback shown when the Crossmint API key is missing or clearly not a
 * Crossmint key, so the app (and `next build`) never crash on a fresh clone.
 */
function ConfigError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <div className="max-w-md text-center bg-white border rounded-2xl shadow-sm p-8">
        <h2 className="text-xl font-semibold text-gray-900">
          Configuration required
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          Set <code className="font-mono">NEXT_PUBLIC_CROSSMINT_API_KEY</code>{" "}
          in a <code className="font-mono">.env</code> file. Copy{" "}
          <code className="font-mono">.env.example</code> and add your keys.
        </p>
      </div>
    </div>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const crossmintApiKey = process.env.NEXT_PUBLIC_CROSSMINT_API_KEY;
  const formoWriteKey = process.env.NEXT_PUBLIC_FORMO_WRITE_KEY;

  // Crossmint client keys are `ck_`-prefixed and cryptographically signed, so
  // a placeholder can never be valid. Check the shape as well as presence:
  // without this, a stand-in value (CI fills empty vars with `ci_test_key`)
  // passes the truthiness check and then fails signature validation while
  // Next prerenders the page, failing the build rather than rendering this
  // fallback.
  if (!crossmintApiKey?.startsWith("ck_")) {
    return <ConfigError />;
  }

  const crossmintTree = (
    <CrossmintProvider apiKey={crossmintApiKey}>
      <CrossmintAuthProvider
        authModalTitle="Welcome"
        loginMethods={["google", "email"]}
        appearance={customAppearance}
        termsOfServiceText={
          <p>
            By continuing, you accept the{" "}
            <a
              href="https://www.crossmint.com/legal/terms-of-service"
              target="_blank"
            >
              Wallet&apos;s Terms of Service
            </a>
            , and to recieve marketing communications from Crossmint.
          </p>
        }
      >
        <CrossmintWalletProvider
          appearance={customAppearance}
          createOnLogin={{
            chain,
            recovery: {
              type: "email",
            },
          }}
        >
          {/* Emits Formo identify/connect/disconnect for the embedded wallet. */}
          {formoWriteKey ? <FormoCrossmintBridge /> : null}
          {children}
        </CrossmintWalletProvider>
      </CrossmintAuthProvider>
    </CrossmintProvider>
  );

  // Formo is optional: without a write key the app still runs, just untracked.
  if (!formoWriteKey) {
    if (typeof window !== "undefined") {
      console.warn(
        "[with-crossmint] NEXT_PUBLIC_FORMO_WRITE_KEY is not set — Formo Analytics is disabled.",
      );
    }
    return crossmintTree;
  }

  return (
    <FormoAnalyticsProvider
      writeKey={formoWriteKey}
      options={{
        // Crossmint embedded wallets are smart wallets — they expose no
        // EIP-1193 provider and no wagmi config, so Formo cannot auto-capture
        // wallet events. We turn autocapture off and emit every wallet event
        // manually instead (see components/formo-bridge.tsx, transfer.tsx and
        // formo-event-tester.tsx).
        autocapture: false,
        // Don't wrap window.ethereum either — a MetaMask the user happens to
        // have installed is unrelated to the Crossmint embedded wallet.
        evm: false,
        // Track on localhost too (the SDK skips localhost by default).
        tracking: true,
        // Log SDK activity to the console — handy while developing.
        logger: {
          enabled: true,
          levels: ["info", "warn", "error"],
        },
      }}
    >
      {crossmintTree}
    </FormoAnalyticsProvider>
  );
}
