"use client";

import { useWalletConnection } from "@solana/react-hooks";

export default function Home() {
  const { connectors, connect, disconnect, status, wallet } =
    useWalletConnection();
  const connected = status === "connected" ? wallet : undefined;

  return (
    <main
      style={{
        margin: "0 auto",
        maxWidth: 720,
        padding: "5rem 1.5rem",
        display: "grid",
        gap: "1.5rem",
      }}
    >
      <header>
        <p style={{ color: "#14f195", margin: 0 }}>Formo Analytics</p>
        <h1>Solana framework-kit integration</h1>
        <p style={{ color: "#a1a1aa", lineHeight: 1.6 }}>
          This example passes framework-kit&apos;s client store to Formo. The
          store provides wallet, cluster, and recorded transaction lifecycle
          events while Wallet Standard continues to provide wallet detection.
        </p>
      </header>

      <section
        style={{
          border: "1px solid #27272a",
          borderRadius: "0.75rem",
          padding: "1.5rem",
          display: "grid",
          gap: "1rem",
        }}
      >
        <strong>Status: {status}</strong>
        {connected ? (
          <>
            <code>{connected.account.address.toString()}</code>
            <button onClick={() => disconnect()}>Disconnect</button>
          </>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            {connectors.map((connector) => (
              <button
                key={connector.id}
                onClick={() => connect(connector.id)}
                disabled={status === "connecting"}
              >
                Connect {connector.name}
              </button>
            ))}
            {connectors.length === 0 && <span>No wallets detected.</span>}
          </div>
        )}
      </section>
    </main>
  );
}
