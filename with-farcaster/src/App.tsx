import { sdk } from "@farcaster/frame-sdk";
import { useEffect, useState } from "react";
import { 
  useAccount, 
  useConnect, 
  useDisconnect,
  useSignMessage, 
  useSendTransaction, 
  useSendCalls 
} from "wagmi";
import { parseEther } from "viem";
import { useFormo } from "@formo/analytics";

function App() {
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize the SDK for mini app context
    const initializeSDK = async () => {
      try {
        console.log('Initializing Farcaster SDK...');
        console.log('SDK context:', sdk.context);
        await sdk.actions.ready();
        console.log('SDK initialized successfully');
        setSdkReady(true);
      } catch (error) {
        console.error('SDK initialization error:', error);
        setSdkError(error instanceof Error ? error.message : 'Unknown SDK error');
      }
    };
    
    initializeSDK();
  }, []);

  return (
    <div style={{ 
      padding: "20px", 
      fontFamily: "Arial, sans-serif",
      maxWidth: "600px",
      margin: "0 auto"
    }}>
      <h1>Formo SDK Test - Farcaster Mini App</h1>
      
      {/* SDK Status */}
      <div style={{ 
        padding: "10px", 
        marginBottom: "20px",
        backgroundColor: sdkReady ? "#f0fdf4" : sdkError ? "#fef2f2" : "#fef3c7",
        border: `1px solid ${sdkReady ? "#22c55e" : sdkError ? "#ef4444" : "#f59e0b"}`,
        borderRadius: "8px",
        color: "#111827"
      }}>
        <strong>SDK Status:</strong> {sdkReady ? "✅ Ready" : sdkError ? `❌ Error: ${sdkError}` : "⏳ Initializing..."}
      </div>

      <ConnectMenu />
      
      {/* Custom Track Event - Always visible at bottom */}
      <div style={{ marginTop: "20px" }}>
        <CustomTrackEventSection />
      </div>
    </div>
  );
}

function ConnectMenu() {
  const { isConnected, address } = useAccount();
  const { connect, connectors, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const [localError, setLocalError] = useState<string | null>(null);
  
  // Debug logging
  useEffect(() => {
    console.log('Connectors available:', connectors);
    console.log('Is connected:', isConnected);
    console.log('Connect error:', connectError);
  }, [connectors, isConnected, connectError]);

  if (isConnected) {
    return (
      <div style={{ marginTop: "20px" }}>
        <div style={{ 
          padding: "15px", 
          backgroundColor: "#f0f9ff", 
          border: "1px solid #0ea5e9",
          borderRadius: "8px",
          marginBottom: "20px"
        }}>
          <h3 style={{ margin: "0 0 10px 0", color: "#0369a1" }}>✅ Wallet Connected</h3>
          <div style={{ fontFamily: "monospace", fontSize: "14px", wordBreak: "break-all", marginBottom: "15px" }}>
            {address}
          </div>
          <button 
            type="button" 
            onClick={() => disconnect()}
            style={{
              padding: "8px 16px",
              fontSize: "14px",
              backgroundColor: "#dc2626",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer"
            }}
          >
            Disconnect Wallet
          </button>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <SignMessageSection />
          <SendTransactionSection />
          <BatchTransactionSection />
        </div>
      </div>
    );
  }

  const handleConnect = async (connectorIndex = 0) => {
    console.log('Connect button clicked');
    console.log('Available connectors:', connectors);
    setLocalError(null);
    
    if (connectors.length > connectorIndex) {
      try {
        console.log('Attempting to connect with connector:', connectors[connectorIndex]);
        await connect({ connector: connectors[connectorIndex] });
        console.log('Connection successful');
      } catch (error) {
        console.error('Connection failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
        setLocalError(errorMessage);
      }
    } else {
      const msg = 'No connectors available';
      console.error(msg);
      setLocalError(msg);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "40px" }}>
      <h3>Available Wallet Connectors:</h3>
      
      {connectors.length === 0 ? (
        <div style={{ 
          color: "#dc2626",
          backgroundColor: "#fef2f2",
          padding: "15px",
          borderRadius: "8px",
          marginBottom: "20px"
        }}>
          ❌ No connectors available. Check console for errors.
        </div>
      ) : (
        <div style={{ marginBottom: "20px" }}>
          {connectors.map((connector, index) => (
            <div key={connector.id} style={{ marginBottom: "10px" }}>
              <button 
                type="button" 
                onClick={() => handleConnect(index)}
                style={{
                  padding: "15px 30px",
                  fontSize: "16px",
                  backgroundColor: index === 0 ? "#8b5cf6" : "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  margin: "5px"
                }}
              >
                Connect with {connector.name}
                {index === 0 && " (Primary)"}
    </button>
            </div>
          ))}
        </div>
      )}
      
      {(connectError || localError) && (
        <div style={{ 
          marginTop: "15px",
          color: "#dc2626",
          backgroundColor: "#fef2f2",
          padding: "10px",
          borderRadius: "4px"
        }}>
          Connection Error: {localError || connectError?.message}
        </div>
      )}
      
      <div style={{ marginTop: "15px", fontSize: "12px", color: "#6b7280" }}>
        <div>Connectors available: {connectors.length}</div>
        {connectors.map((connector, index) => (
          <div key={connector.id}>
            {index + 1}. {connector.name} (ID: {connector.id})
          </div>
        ))}
        <div style={{ marginTop: "10px", fontSize: "10px" }}>
          💡 If running outside Farcaster, try the "Injected" connector with MetaMask
        </div>
      </div>
    </div>
  );
}

function SignMessageSection() {
  const [message, setMessage] = useState("Hello from Formo SDK!");
  const { signMessage, isPending, data, error } = useSignMessage();

  return (
    <div style={{ 
      padding: "20px", 
      border: "1px solid #e5e7eb", 
      borderRadius: "8px",
      backgroundColor: "#fafafa"
    }}>
      <h3 style={{ marginTop: 0 }}>📝 Sign Message</h3>
      <div style={{ marginBottom: "15px" }}>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter message to sign"
          style={{
            width: "100%",
            padding: "10px",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            fontSize: "14px"
          }}
        />
      </div>
      <button 
        type="button" 
        onClick={() => signMessage({ message })} 
        disabled={isPending || !message}
        style={{
          padding: "10px 20px",
          backgroundColor: isPending ? "#9ca3af" : "#10b981",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: isPending ? "not-allowed" : "pointer"
        }}
      >
        {isPending ? "Signing..." : "Sign Message"}
      </button>
      
      {data && (
        <div style={{ marginTop: "15px" }}>
          <div style={{ fontWeight: "bold", color: "#059669" }}>✅ Signature:</div>
          <div style={{ 
            fontFamily: "monospace", 
            fontSize: "12px", 
            wordBreak: "break-all",
            backgroundColor: "#f0fdf4",
            padding: "10px",
            borderRadius: "4px",
            marginTop: "5px"
          }}>
            {data}
          </div>
        </div>
      )}
      
      {error && (
        <div style={{ marginTop: "15px" }}>
          <div style={{ fontWeight: "bold", color: "#dc2626" }}>❌ Error:</div>
          <div style={{ 
            color: "#dc2626",
            backgroundColor: "#fef2f2",
            padding: "10px",
            borderRadius: "4px",
            marginTop: "5px"
          }}>
            {error.message}
          </div>
        </div>
      )}
    </div>
  );
}

function SendTransactionSection() {
  const [recipient, setRecipient] = useState("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");
  const [amount, setAmount] = useState("0.001");
  const { sendTransaction, isPending, data, error } = useSendTransaction();

  const handleSendTransaction = () => {
    try {
      sendTransaction({
        to: recipient as `0x${string}`,
        value: parseEther(amount),
      });
    } catch (err) {
      console.error("Transaction error:", err);
    }
  };

  return (
    <div style={{ 
      padding: "20px", 
      border: "1px solid #e5e7eb", 
      borderRadius: "8px",
      backgroundColor: "#fafafa"
    }}>
      <h3 style={{ marginTop: 0 }}>💸 Send Transaction</h3>
      
      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
          Recipient Address:
        </label>
        <input
          type="text"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          placeholder="0x..."
          style={{
            width: "100%",
            padding: "10px",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            fontSize: "14px",
            fontFamily: "monospace"
          }}
        />
      </div>
      
      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>
          Amount (ETH):
        </label>
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.001"
          style={{
            width: "100%",
            padding: "10px",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            fontSize: "14px"
          }}
        />
      </div>
      
      <button 
        type="button" 
        onClick={handleSendTransaction}
        disabled={isPending || !recipient || !amount}
        style={{
          padding: "10px 20px",
          backgroundColor: isPending ? "#9ca3af" : "#f59e0b",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: isPending ? "not-allowed" : "pointer"
        }}
      >
        {isPending ? "Sending..." : "Send Transaction"}
      </button>
      
      {data && (
        <div style={{ marginTop: "15px" }}>
          <div style={{ fontWeight: "bold", color: "#059669" }}>✅ Transaction Hash:</div>
          <div style={{ 
            fontFamily: "monospace", 
            fontSize: "12px", 
            wordBreak: "break-all",
            backgroundColor: "#f0fdf4",
            padding: "10px",
            borderRadius: "4px",
            marginTop: "5px"
          }}>
            {data}
          </div>
        </div>
      )}
      
      {error && (
        <div style={{ marginTop: "15px" }}>
          <div style={{ fontWeight: "bold", color: "#dc2626" }}>❌ Error:</div>
          <div style={{ 
            color: "#dc2626",
            backgroundColor: "#fef2f2",
            padding: "10px",
            borderRadius: "4px",
            marginTop: "5px"
          }}>
            {error.message}
          </div>
        </div>
      )}
    </div>
  );
}

function BatchTransactionSection() {
  const { sendCalls, isPending, data, error } = useSendCalls();

  const handleBatchTransaction = () => {
    sendCalls({
      calls: [
        {
          to: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          value: parseEther("0.001")
        },
        {
          to: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", 
          value: parseEther("0.001")
        }
      ]
    });
  };

  return (
    <div style={{ 
      padding: "20px", 
      border: "1px solid #e5e7eb", 
      borderRadius: "8px",
      backgroundColor: "#fafafa"
    }}>
      <h3 style={{ marginTop: 0 }}>🔄 Batch Transaction (EIP-5792)</h3>
      <p style={{ color: "#6b7280", fontSize: "14px", margin: "0 0 15px 0" }}>
        Send multiple transactions in a single confirmation. This will send 0.001 ETH to two different addresses.
      </p>
      
      <button 
        type="button" 
        onClick={handleBatchTransaction}
        disabled={isPending}
        style={{
          padding: "10px 20px",
          backgroundColor: isPending ? "#9ca3af" : "#8b5cf6",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: isPending ? "not-allowed" : "pointer"
        }}
      >
        {isPending ? "Sending Batch..." : "Send Batch Transaction"}
      </button>
      
      {data && (
        <div style={{ marginTop: "15px" }}>
          <div style={{ fontWeight: "bold", color: "#059669" }}>✅ Batch ID:</div>
          <div style={{
            fontFamily: "monospace",
            fontSize: "12px",
            wordBreak: "break-all",
            backgroundColor: "#f0fdf4",
            padding: "10px",
            borderRadius: "4px",
            marginTop: "5px"
          }}>
            {data.id}
          </div>
        </div>
      )}
      
      {error && (
        <div style={{ marginTop: "15px" }}>
          <div style={{ fontWeight: "bold", color: "#dc2626" }}>❌ Error:</div>
          <div style={{ 
            color: "#dc2626",
            backgroundColor: "#fef2f2",
            padding: "10px",
            borderRadius: "4px",
            marginTop: "5px"
          }}>
            {error.message}
          </div>
        </div>
      )}
    </div>
  );
}

function CustomTrackEventSection() {
  const analytics = useFormo();
  const [eventName, setEventName] = useState("Custom Test Event");
  const [eventProperties, setEventProperties] = useState('{"action": "test", "source": "formo_sdk_demo", "timestamp": ' + Date.now() + '}');
  const [isTracking, setIsTracking] = useState(false);
  const [trackResult, setTrackResult] = useState<string | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  const handleTrackEvent = async () => {
    setIsTracking(true);
    setTrackResult(null);
    setTrackError(null);

    try {
      // Parse the properties JSON
      let parsedProperties = {};
      if (eventProperties.trim()) {
        parsedProperties = JSON.parse(eventProperties);
      }

      console.log('Tracking custom event:', eventName, parsedProperties);

      if (!analytics) {
        throw new Error('Formo SDK not initialized');
      }
      await analytics.track(eventName, parsedProperties);
      
      setTrackResult(`✅ Event "${eventName}" tracked successfully!`);
      console.log('Track event sent successfully');
    } catch (error) {
      console.error('Track event failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown tracking error';
      setTrackError(errorMessage);
    } finally {
      setIsTracking(false);
    }
  };

  return (
    <div style={{ 
      padding: "20px", 
      border: "1px solid #e5e7eb", 
      borderRadius: "8px",
      backgroundColor: "#fafafa"
    }}>
      <h3 style={{ marginTop: 0, color: "#111827" }}>📊 Custom Track Event</h3>
      <p style={{ color: "#374151", fontSize: "14px", margin: "0 0 15px 0" }}>
        Send custom analytics events using the Formo SDK's analytics.track() function. 
      </p>
      
      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#111827" }}>
          Event Name:
        </label>
        <input
          type="text"
          value={eventName}
          onChange={(e) => setEventName(e.target.value)}
          placeholder="event_name"
          style={{
            width: "100%",
            padding: "10px",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            fontSize: "14px"
          }}
        />
      </div>
      
      <div style={{ marginBottom: "15px" }}>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold", color: "#111827" }}>
          Event Properties (JSON):
        </label>
        <textarea
          value={eventProperties}
          onChange={(e) => setEventProperties(e.target.value)}
          placeholder='{"key": "value", "another_key": 123}'
          rows={3}
          style={{
            width: "100%",
            padding: "10px",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
            fontSize: "14px",
            fontFamily: "monospace",
            resize: "vertical"
          }}
        />
      </div>
      
      <button 
        type="button" 
        onClick={handleTrackEvent}
        disabled={isTracking || !eventName}
        style={{
          padding: "10px 20px",
          backgroundColor: isTracking ? "#9ca3af" : "#3b82f6",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: isTracking ? "not-allowed" : "pointer"
        }}
      >
        {isTracking ? "Tracking..." : "Send Track Event"}
      </button>
      
      {trackResult && (
        <div style={{ marginTop: "15px" }}>
          <div style={{ 
            color: "#059669",
            backgroundColor: "#f0fdf4",
            padding: "10px",
            borderRadius: "4px"
          }}>
            {trackResult}
          </div>
        </div>
      )}
      
      {trackError && (
        <div style={{ marginTop: "15px" }}>
          <div style={{ fontWeight: "bold", color: "#dc2626" }}>❌ Error:</div>
          <div style={{ 
            color: "#dc2626",
            backgroundColor: "#fef2f2",
            padding: "10px",
            borderRadius: "4px",
            marginTop: "5px"
          }}>
            {trackError}
          </div>
        </div>
      )}
      
      <div style={{ marginTop: "15px", fontSize: "12px", color: "#374151" }}>
        <div>💡 Check the browser console and network tab to see the tracking requests being sent.</div>
        <div style={{ marginTop: "5px" }}>
          📈 <strong>Note:</strong> Formo SDK also automatically captures wallet events (connect, disconnect, signature, transaction) and page views without any setup required.
        </div>
      </div>
    </div>
  );
}

export default App;
