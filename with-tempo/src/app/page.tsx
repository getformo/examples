"use client";

import { useState, useEffect } from "react";
import {
  useChains,
  useConnect,
  useConnection,
  useConnectors,
  useDisconnect,
  useSendTransaction,
  useSignMessage,
  useSwitchChain,
} from "wagmi";
import { stringify } from "viem";
import { useFormo } from "@formo/analytics";

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
  const getStatusClass = () => {
    switch (status) {
      case "connected":
        return "badge-success";
      case "connecting":
      case "reconnecting":
        return "badge-warning";
      case "disconnected":
        return "badge-muted";
      default:
        return "badge-muted";
    }
  };

  return <span className={`badge ${getStatusClass()}`}>{status}</span>;
}

// Connection Section
function ConnectionSection() {
  const { address, status } = useConnection();
  const { mutate: connect, isPending: isConnecting, error: connectError } = useConnect();
  const { mutate: disconnect } = useDisconnect();
  const connectors = useConnectors();
  const isConnected = status === "connected";

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Wallet Connection</h2>

      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--muted)]">Status</span>
          <StatusBadge status={status} />
        </div>

        {address && (
          <div className="flex flex-col gap-1">
            <span className="text-sm text-[var(--muted)]">Address</span>
            <code className="code">{address}</code>
          </div>
        )}
      </div>

      {isConnected ? (
        <button onClick={() => disconnect()} className="btn btn-danger w-full">
          Disconnect
        </button>
      ) : (
        <div className="space-y-2">
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              onClick={() => connect({ connector })}
              disabled={isConnecting}
              className="btn btn-primary w-full"
            >
              {isConnecting ? "Connecting..." : `Connect with ${connector.name}`}
            </button>
          ))}
        </div>
      )}

      {connectError && (
        <p className="mt-3 text-sm text-[var(--error)]">{connectError.message}</p>
      )}
    </div>
  );
}

// Chain Switcher Section
function ChainSwitcherSection() {
  const { chainId, status } = useConnection();
  const chains = useChains();
  const { mutate: switchChain, isPending, error } = useSwitchChain();

  if (status !== "connected") return null;

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Chain Switcher</h2>

      <div className="mb-4">
        <span className="text-sm text-[var(--muted)]">Current Chain ID: </span>
        <span className="font-mono">{chainId}</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {chains.map((chain) => (
          <button
            key={chain.id}
            onClick={() => switchChain({ chainId: chain.id })}
            disabled={isPending || chain.id === chainId}
            className={`btn ${chain.id === chainId ? "btn-primary" : "btn-outline"}`}
          >
            {chain.name}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-3 text-sm text-[var(--error)]">{error.message}</p>
      )}
    </div>
  );
}

// Transaction Section
function TransactionSection() {
  const { sendTransaction, data: hash, isPending, error, reset } = useSendTransaction();
  const { address, status } = useConnection();

  if (status !== "connected") return null;

  const handleSendToSelf = () => {
    if (!address) return;
    sendTransaction({
      to: address,
      value: BigInt(0),
    });
  };

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Transactions</h2>
      <p className="text-sm text-[var(--muted)] mb-4">
        Test transaction events - Formo SDK will automatically capture this
      </p>

      <div className="space-y-4">
        <button
          onClick={handleSendToSelf}
          disabled={isPending}
          className="btn btn-primary w-full"
        >
          {isPending ? "Check Wallet..." : "Send Transaction to Self"}
        </button>

        {hash && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-[var(--muted)]">Transaction Hash</span>
              <button
                onClick={() => reset()}
                className="text-xs text-[var(--primary)] hover:underline"
              >
                Clear
              </button>
            </div>
            <code className="code block">{hash}</code>
          </div>
        )}

        {error && (
          <p className="text-sm text-[var(--error)]">{error.message}</p>
        )}
      </div>
    </div>
  );
}

// Sign Message Section
function SignMessageSection() {
  const [message, setMessage] = useState("Hello from Tempo + Formo!");
  const { mutate: signMessage, data: signature, isPending, error, reset } = useSignMessage();
  const { status } = useConnection();

  if (status !== "connected") return null;

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Sign Message</h2>
      <p className="text-sm text-[var(--muted)] mb-4">
        Test signature events - Formo SDK will automatically capture this
      </p>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-[var(--muted)] block mb-1">Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="input min-h-[80px] resize-none"
            placeholder="Enter message to sign"
          />
        </div>

        <button
          onClick={() => signMessage({ message })}
          disabled={isPending || !message}
          className="btn btn-primary w-full"
        >
          {isPending ? "Check Wallet..." : "Sign Message"}
        </button>

        {signature && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-[var(--muted)]">Signature</span>
              <button
                onClick={() => reset()}
                className="text-xs text-[var(--primary)] hover:underline"
              >
                Clear
              </button>
            </div>
            <code className="code block">{signature}</code>
          </div>
        )}

        {error && (
          <p className="text-sm text-[var(--error)]">{error.message}</p>
        )}
      </div>
    </div>
  );
}

// Identify User Section
function IdentifySection() {
  const formo = useFormo();
  const { address, status } = useConnection();
  const connectors = useConnectors();
  const [identified, setIdentified] = useState(false);

  if (status !== "connected") return null;

  const connector = connectors[0];

  const handleIdentify = async () => {
    if (!address) return;
    await formo.identify({
      address,
      providerName: connector?.name,
    });
    setIdentified(true);
    setTimeout(() => setIdentified(false), 2000);
  };

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Identify User</h2>
      <p className="text-sm text-[var(--muted)] mb-4">
        Associate the current wallet with a Formo user profile
      </p>

      <div className="space-y-4">
        <div className="bg-[var(--background)] border border-[var(--card-border)] rounded-lg p-3 text-xs font-mono">
          <p className="text-[var(--muted)]">Address: {address?.slice(0, 10)}...{address?.slice(-8)}</p>
          <p className="text-[var(--muted)]">Connector: {connector?.name || "Unknown"}</p>
        </div>

        <button
          onClick={handleIdentify}
          className="btn btn-primary w-full"
        >
          Identify User
        </button>

        {identified && (
          <p className="text-sm text-[var(--success)]">User identified successfully!</p>
        )}
      </div>
    </div>
  );
}

// Custom Events Section
function CustomEventsSection() {
  const formo = useFormo();
  const [eventName, setEventName] = useState("button_clicked");
  const [eventData, setEventData] = useState('{"button": "cta", "page": "home"}');
  const [isJsonValid, setIsJsonValid] = useState(true);
  const [lastTracked, setLastTracked] = useState<string | null>(null);

  const validateJson = (str: string) => {
    try {
      JSON.parse(str);
      setIsJsonValid(true);
    } catch {
      setIsJsonValid(false);
    }
  };

  const handleTrack = async () => {
    if (!eventName || !isJsonValid) return;

    try {
      const properties = eventData ? JSON.parse(eventData) : {};
      await formo.track(eventName, properties);
      setLastTracked(`Tracked: ${eventName} at ${new Date().toLocaleTimeString()}`);
    } catch (err) {
      console.error("Failed to track event:", err);
    }
  };

  const handlePageEvent = async () => {
    await formo.page("Demo", "Home Page", { source: "tempo-example" });
    setLastTracked(`Page event tracked at ${new Date().toLocaleTimeString()}`);
  };

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Custom Events</h2>
      <p className="text-sm text-[var(--muted)] mb-4">
        Track custom events manually using the Formo SDK
      </p>

      <div className="space-y-4">
        <button onClick={handlePageEvent} className="btn btn-outline w-full">
          Track Page Event
        </button>

        <hr className="border-[var(--card-border)]" />

        <div>
          <label className="text-sm text-[var(--muted)] block mb-1">Event Name</label>
          <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            className="input"
            placeholder="button_clicked"
          />
        </div>

        <div>
          <label className="text-sm text-[var(--muted)] block mb-1">
            Event Properties (JSON)
          </label>
          <textarea
            value={eventData}
            onChange={(e) => {
              setEventData(e.target.value);
              validateJson(e.target.value);
            }}
            className={`input min-h-[80px] resize-none ${
              !isJsonValid ? "border-[var(--error)]" : ""
            }`}
            placeholder='{"key": "value"}'
          />
          {!isJsonValid && (
            <p className="text-xs text-[var(--error)] mt-1">Invalid JSON format</p>
          )}
        </div>

        <button
          onClick={handleTrack}
          disabled={!eventName || !isJsonValid}
          className="btn btn-primary w-full"
        >
          Track Custom Event
        </button>

        {lastTracked && (
          <p className="text-sm text-[var(--success)]">{lastTracked}</p>
        )}
      </div>
    </div>
  );
}

// Consent Management Section
function ConsentSection() {
  const formo = useFormo();
  const [hasOptedOut, setHasOptedOut] = useState(false);

  useEffect(() => {
    setHasOptedOut(formo.hasOptedOutTracking());
  }, [formo]);

  const handleOptOut = () => {
    formo.optOutTracking();
    setHasOptedOut(true);
  };

  const handleOptIn = () => {
    formo.optInTracking();
    setHasOptedOut(false);
  };

  return (
    <div className="card">
      <h2 className="text-lg font-semibold mb-4">Consent Management</h2>
      <p className="text-sm text-[var(--muted)] mb-4">
        Control tracking consent with the Formo SDK
      </p>

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm">Tracking Status</span>
        <span className={`badge ${hasOptedOut ? "badge-error" : "badge-success"}`}>
          {hasOptedOut ? "Opted Out" : "Opted In"}
        </span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleOptIn}
          disabled={!hasOptedOut}
          className="btn btn-outline flex-1"
        >
          Opt In
        </button>
        <button
          onClick={handleOptOut}
          disabled={hasOptedOut}
          className="btn btn-outline flex-1"
        >
          Opt Out
        </button>
      </div>
    </div>
  );
}

// Main App
export default function App() {
  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Tempo + Formo SDK Demo
          </h1>
          <p className="text-[var(--muted)]">
            Test Tempo Accounts SDK wallet integration with Formo Analytics SDK event tracking
          </p>
          <div className="flex gap-4 mt-4 text-sm">
            <a
              href="https://docs.tempo.xyz/accounts"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--primary)] hover:underline"
            >
              Tempo Docs
            </a>
            <a
              href="https://docs.formo.so"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--primary)] hover:underline"
            >
              Formo Docs
            </a>
            <a
              href="https://github.com/getformo/examples"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--primary)] hover:underline"
            >
              GitHub
            </a>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ConnectionSection />
          <ChainSwitcherSection />
          <TransactionSection />
          <SignMessageSection />
          <IdentifySection />
          <CustomEventsSection />
          <ConsentSection />
        </div>

        {/* Footer */}
        <footer className="mt-8 pt-4 border-t border-[var(--card-border)] text-center text-sm text-[var(--muted)]">
          <p>
            Built with{" "}
            <a
              href="https://wagmi.sh"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--primary)] hover:underline"
            >
              Wagmi
            </a>
            ,{" "}
            <a
              href="https://tempo.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--primary)] hover:underline"
            >
              Tempo
            </a>
            , and{" "}
            <a
              href="https://formo.so"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--primary)] hover:underline"
            >
              Formo
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
