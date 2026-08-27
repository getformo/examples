import { useCallback, useEffect, useRef, useState } from "react";
import { FormoAnalytics } from "@formo/analytics";
import { EthereumProvider } from "@walletconnect/ethereum-provider";

/**
 * Formo + WalletConnect, on the plain EIP-1193 path (no wagmi).
 *
 * WHY THIS EXAMPLE EXISTS. The SDK discovers wallets through EIP-6963
 * announcements and `window.ethereum` - which is every injected wallet and
 * nothing else. A WalletConnect provider is CONSTRUCTED by the app
 * (`EthereumProvider.init`) and announces nothing, so before SDK 1.38.0 its
 * whole session was invisible to analytics: no connect, no signatures, no
 * transactions. `registerProvider` is the fix: hand the SDK the provider
 * you built, and it takes the same pipeline a discovered wallet takes.
 *
 * The one integration line that matters:
 *
 *     formo.registerProvider(wcProvider);
 *
 * Call it as soon as the provider exists - before or after the session
 * connects, both work. A session that already exists is adopted on the
 * spot. Events name the REAL wallet behind the transport (Ledger Live,
 * MetaMask Mobile, ...) from the session's peer metadata, live per event.
 */

const WC_PROJECT_ID = import.meta.env.VITE_WC_PROJECT_ID as string | undefined;
const FORMO_WRITE_KEY =
  (import.meta.env.VITE_FORMO_WRITE_KEY as string | undefined) ?? "demo_write_key";

type WcProvider = Awaited<ReturnType<typeof EthereumProvider.init>>;

export default function App() {
  const formoRef = useRef<FormoAnalytics | null>(null);
  const providerRef = useRef<WcProvider | null>(null);
  const [status, setStatus] = useState("initializing");
  const [registered, setRegistered] = useState<boolean | null>(null);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [chainId, setChainId] = useState<number | null>(null);
  const [peer, setPeer] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string>("");
  const syncRef = useRef<() => void>(() => undefined);
  const disposeRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // 1. Formo first. In a real app the order does not matter:
      //    registerProvider adopts a session that already exists.
      const formo = await FormoAnalytics.init(FORMO_WRITE_KEY, {
        tracking: true,
      });
      if (cancelled) return;
      formoRef.current = formo;

      if (!WC_PROJECT_ID) {
        setStatus("missing VITE_WC_PROJECT_ID - copy .env.example to .env");
        return;
      }

      // 2. The constructed provider the SDK could never discover.
      const provider = await EthereumProvider.init({
        projectId: WC_PROJECT_ID,
        chains: [11155111], // Sepolia. Testnet on purpose.
        optionalChains: [1],
        showQrModal: true,
        metadata: {
          name: "Formo + WalletConnect Example",
          description: "Demonstrates registerProvider on the EIP-1193 path",
          url: window.location.origin,
          icons: [],
        },
      });
      if (cancelled) return;
      providerRef.current = provider;

      // 3. THE LINE. Without it, nothing below produces analytics.
      const ok = formo.registerProvider(provider);
      setRegistered(ok);

      const syncSession = () => {
        // provider.accounts has been observed EMPTY on a live session
        // (MetaMask Mobile). The session namespaces are the ground truth:
        // "eip155:11155111:0xabc..." entries. A session can authorize
        // different accounts per chain, so prefer entries for the ACTIVE
        // chain before falling back to any eip155 entry.
        const direct = provider.accounts ?? [];
        const entries = provider.session?.namespaces?.eip155?.accounts ?? [];
        const activePrefix = `eip155:${provider.chainId}:`;
        const forChain = entries
          .filter((a: string) => a.startsWith(activePrefix))
          .map((a: string) => a.split(":")[2]);
        const any = entries.map((a: string) => a.split(":")[2]).filter(Boolean);
        setAccounts([...(direct.length ? direct : forChain.length ? forChain : any)]);
        setChainId(provider.chainId ?? null);
        setPeer(provider.session?.peer?.metadata?.name ?? null);
      };
      syncRef.current = syncSession;
      // Belt and braces: the provider does not reliably emit `connect` on a
      // QR approval, so the UI also re-syncs after every action and on a
      // slow poll. The SDK does not have this problem - it adopts from
      // state and wraps requests - this is purely demo display state.
      const events = ["connect", "accountsChanged", "chainChanged", "disconnect", "session_update"] as const;
      for (const ev of events) provider.on(ev as never, syncSession as never);
      const pollId = window.setInterval(syncSession, 1500);
      disposeRef.current = () => {
        window.clearInterval(pollId);
        for (const ev of events) provider.removeListener(ev as never, syncSession as never);
      };
      syncSession();
      setStatus("ready");
    })().catch((e) => setStatus(`init failed: ${String(e).slice(0, 120)}`));
    return () => {
      cancelled = true;
      // Unmount/HMR must not leak the poll or the five listeners; each
      // remount would otherwise stack another live set.
      disposeRef.current();
      formoRef.current?.cleanup?.();
    };
  }, []);

  const act = useCallback(async (label: string, fn: () => Promise<unknown>) => {
    try {
      setLastAction(`${label}...`);
      const result = await fn();
      setLastAction(`${label}: ${result === undefined ? "ok" : String(result).slice(0, 240)}`);
    } catch (e) {
      setLastAction(`${label} failed: ${String((e as Error)?.message ?? e).slice(0, 90)}`);
    } finally {
      syncRef.current();
    }
  }, []);

  const provider = providerRef.current;
  const address = accounts[0];

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", maxWidth: 640, margin: "3rem auto", lineHeight: 1.5 }}>
      <h1>Formo + WalletConnect</h1>
      <p>
        A WalletConnect provider is constructed, not injected, so wallet
        discovery cannot see it. This example tracks it with one call:{" "}
        <code>formo.registerProvider(provider)</code>. Connect a wallet below
        (Ledger Live included) and every event names the real signer.
      </p>

      <dl>
        <dt>Status</dt>
        <dd>{status}</dd>
        <dt>registerProvider</dt>
        <dd>{registered === null ? "not called yet" : registered ? "accepted - session tracked" : "refused"}</dd>
        <dt>Session</dt>
        <dd>{address ? `${address.slice(0, 6)}...${address.slice(-4)} on chain ${chainId}` : "not connected"}</dd>
        <dt>Wallet behind WalletConnect</dt>
        <dd>{peer ?? "none yet - shown from session peer metadata after connect"}</dd>
      </dl>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          disabled={!provider || !!address}
          onClick={() =>
            act("connect", async () => {
              await provider!.connect();
              const p = provider!;
              const ns = p.session?.namespaces?.eip155?.accounts ?? [];
              return `accounts=[${(p.accounts ?? []).join(", ") || "EMPTY"}] ns=[${ns.join(", ") || "EMPTY"}] chain=${p.chainId} peer=${p.session?.peer?.metadata?.name ?? "?"}`;
            })
          }
        >
          Connect (QR)
        </button>
        <button
          disabled={!address}
          onClick={() =>
            act("personal_sign", () =>
              provider!.request({
                method: "personal_sign",
                params: [
                  "0x" + Array.from(new TextEncoder().encode("Hello from Formo + WalletConnect"))
                    .map((b) => b.toString(16).padStart(2, "0"))
                    .join(""),
                  address,
                ],
              })
            )
          }
        >
          Sign Message
        </button>
        <button
          disabled={!address}
          onClick={() =>
            act("eth_sendTransaction", () =>
              provider!.request({
                method: "eth_sendTransaction",
                params: [{ from: address, to: address, value: "0x0" }],
              })
            )
          }
        >
          Send Transaction (0 ETH to self)
        </button>
        <button disabled={!address} onClick={() => act("disconnect", () => provider!.disconnect())}>
          Disconnect
        </button>
      </div>

      <p style={{ marginTop: 12 }}>
        <small>{lastAction}</small>
      </p>

      <h2>What Formo captures here</h2>
      <ul>
        <li><code>detect</code> and <code>connect</code> on registration or session approval - adopted even when the session predates the SDK</li>
        <li><code>signature</code> requested / confirmed / rejected from <code>personal_sign</code></li>
        <li><code>transaction</code> started / broadcasted / confirmed from <code>eth_sendTransaction</code></li>
        <li><code>disconnect</code>, and chain changes, from the provider's own events</li>
        <li>every event attributed to the wallet behind the transport, not to "WalletConnect"</li>
      </ul>
      <p>
        <small>
          Transactions here send 0 ETH to yourself on Sepolia. Watch the
          network tab for <code>events.formo.so</code> payloads; with a demo
          write key the server answers 403 but the payloads show exactly what
          would be recorded.
        </small>
      </p>
    </main>
  );
}
