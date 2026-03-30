import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import {
  useAccount,
  useChainId,
  useConnect,
  useDisconnect,
  useSignMessage,
  useSendTransaction,
  useSwitchChain,
} from "wagmi";
import { chains } from "../config/wagmi";
import { parseEther } from "viem";
import { useFormo } from "@formo/react-native-analytics";

// Mock address for direct SDK testing
const TEST_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

export default function WalletScreen() {
  const formo = useFormo();
  const [baseSepolia, optimismSepolia] = chains;
  const { address, isConnected } = useAccount();
  const [eventLog, setEventLog] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setEventLog((prev) =>
      [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 30)
    );
  };

  useEffect(() => {
    formo.screen("Wallet");
  }, [formo]);

  const chainId = useChainId();
  const { connectors, connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();
  const currentChain = chains.find((c) => c.id === chainId);

  const {
    signMessage,
    isPending: isSigningPending,
    data: signedMessage,
    reset: resetSignature,
  } = useSignMessage();

  const {
    sendTransaction,
    isPending: isSendingPending,
    data: txHash,
    reset: resetTransaction,
  } = useSendTransaction();

  // --- Wagmi-connected handlers ---

  const handleConnect = (connector: (typeof connectors)[number]) => {
    addLog(`Connecting with ${connector.name}...`);
    connect(
      { connector },
      {
        onSuccess: (data) =>
          addLog(
            `Connected: ${data.accounts[0]?.slice(0, 10)}... chain ${data.chainId}`
          ),
        onError: (error) => {
          addLog(`Connect error: ${error.message}`);
          Alert.alert("Connection Error", error.message);
        },
      }
    );
  };

  const handleDisconnect = () => {
    addLog("Disconnecting...");
    disconnect(undefined, {
      onSuccess: () => addLog("Disconnected"),
    });
    resetSignature();
    resetTransaction();
  };

  const handleSignMessage = () => {
    addLog("Requesting signature...");
    signMessage(
      { message: "Sign this message to verify wallet ownership" },
      {
        onSuccess: (data) => addLog(`Signed: ${data.slice(0, 20)}...`),
        onError: (error) => addLog(`Sign error: ${error.message}`),
      }
    );
  };

  const handleSendTransaction = () => {
    if (!address) return;
    addLog("Sending transaction...");
    sendTransaction(
      { to: address, value: parseEther("0.0001") },
      {
        onSuccess: (hash) => addLog(`Tx sent: ${hash.slice(0, 20)}...`),
        onError: (error) => addLog(`Tx error: ${error.message}`),
      }
    );
  };

  const handleSwitchChain = (targetChainId: number) => {
    addLog(`Switching to chain ${targetChainId}...`);
    switchChain(
      { chainId: targetChainId },
      {
        onSuccess: (chain) => addLog(`Switched to ${chain.name}`),
        onError: (error) => addLog(`Switch error: ${error.message}`),
      }
    );
  };

  // --- Direct SDK method handlers (no wallet needed) ---

  const handleDirectConnect = async () => {
    try {
      addLog("SDK: connect()");
      await formo.connect({ chainId: baseSepolia.id, address: TEST_ADDRESS });
      addLog("SDK: connect tracked");
    } catch (e: any) {
      addLog(`SDK: connect error: ${e.message}`);
    }
  };

  const handleDirectDisconnect = async () => {
    try {
      addLog("SDK: disconnect()");
      await formo.disconnect({ chainId: baseSepolia.id, address: TEST_ADDRESS });
      addLog("SDK: disconnect tracked");
    } catch (e: any) {
      addLog(`SDK: disconnect error: ${e.message}`);
    }
  };

  const handleDirectChain = async () => {
    try {
      addLog("SDK: chain()");
      await formo.chain({ chainId: optimismSepolia.id, address: TEST_ADDRESS });
      addLog("SDK: chain switch tracked");
    } catch (e: any) {
      addLog(`SDK: chain error: ${e.message}`);
    }
  };

  const handleDirectSignature = async () => {
    try {
      addLog("SDK: signature(requested)");
      await formo.signature({
        status: "requested",
        chainId: baseSepolia.id,
        address: TEST_ADDRESS,
        message: "Test message for SDK testing",
      });
      addLog("SDK: signature(confirmed)");
      await formo.signature({
        status: "confirmed",
        chainId: baseSepolia.id,
        address: TEST_ADDRESS,
        message: "Test message for SDK testing",
        signatureHash: "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
      });
      addLog("SDK: signature events tracked");
    } catch (e: any) {
      addLog(`SDK: signature error: ${e.message}`);
    }
  };

  const handleDirectTransaction = async () => {
    try {
      addLog("SDK: transaction(started)");
      await formo.transaction({
        status: "started",
        chainId: baseSepolia.id,
        address: TEST_ADDRESS,
        to: TEST_ADDRESS,
        value: "100000000000000",
      });
      addLog("SDK: transaction(broadcasted)");
      await formo.transaction({
        status: "broadcasted",
        chainId: baseSepolia.id,
        address: TEST_ADDRESS,
        to: TEST_ADDRESS,
        value: "100000000000000",
        transactionHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      });
      addLog("SDK: transaction events tracked");
    } catch (e: any) {
      addLog(`SDK: transaction error: ${e.message}`);
    }
  };

  const handleDirectTrack = async () => {
    try {
      addLog("SDK: track(test_event)");
      await formo.track("test_event", {
        source: "wallet_screen",
        timestamp: new Date().toISOString(),
      });
      addLog("SDK: custom event tracked");
    } catch (e: any) {
      addLog(`SDK: track error: ${e.message}`);
    }
  };

  // Sort mock connector first
  const sortedConnectors = [...connectors].sort((a, b) => {
    if (a.id === "mock") return -1;
    if (b.id === "mock") return 1;
    return 0;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Direct SDK Testing */}
      <View style={[styles.section, styles.sdkSection]}>
        <Text style={styles.sectionTitle}>Direct SDK Testing</Text>
        <Text style={styles.description}>
          Call Formo SDK methods directly — no wallet needed
        </Text>
        <View style={styles.buttonGrid}>
          <TouchableOpacity style={[styles.sdkButton, styles.sdkConnect]} onPress={handleDirectConnect}>
            <Text style={styles.sdkButtonText}>Connect</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sdkButton, styles.sdkDisconnect]} onPress={handleDirectDisconnect}>
            <Text style={styles.sdkButtonText}>Disconnect</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sdkButton, styles.sdkChain]} onPress={handleDirectChain}>
            <Text style={styles.sdkButtonText}>Chain Switch</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sdkButton, styles.sdkSign]} onPress={handleDirectSignature}>
            <Text style={styles.sdkButtonText}>Signature</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sdkButton, styles.sdkTx]} onPress={handleDirectTransaction}>
            <Text style={styles.sdkButtonText}>Transaction</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.sdkButton, styles.sdkTrack]} onPress={handleDirectTrack}>
            <Text style={styles.sdkButtonText}>Track Event</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Wagmi Wallet Connection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wagmi Wallet</Text>
        {!isConnected ? (
          <View style={styles.connectorList}>
            {sortedConnectors.map((connector) => (
              <TouchableOpacity
                key={connector.uid}
                style={[
                  styles.connectorButton,
                  connector.id === "mock" && styles.mockButton,
                  isConnecting && styles.buttonDisabled,
                ]}
                onPress={() => handleConnect(connector)}
                disabled={isConnecting}
              >
                <Text style={styles.connectorButtonText}>
                  {isConnecting ? "Connecting..." : connector.name}
                </Text>
                {connector.id === "mock" && (
                  <Text style={styles.connectorSubtext}>
                    Auto-tracks via wagmi integration
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {address?.slice(0, 10)}...{address?.slice(-8)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Chain</Text>
              <Text style={styles.infoValue}>{currentChain?.name || chainId}</Text>
            </View>

            <View style={styles.actionRow}>
              {chains.map((chain) => (
                <TouchableOpacity
                  key={chain.id}
                  style={[
                    styles.smallButton,
                    chainId === chain.id && styles.smallButtonActive,
                  ]}
                  onPress={() => handleSwitchChain(chain.id)}
                  disabled={chainId === chain.id || isSwitchingChain}
                >
                  <Text style={styles.smallButtonText}>{chain.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.button, isSigningPending && styles.buttonDisabled]}
                onPress={handleSignMessage}
                disabled={isSigningPending}
              >
                <Text style={styles.buttonText}>
                  {isSigningPending ? "Signing..." : "Sign Message"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonSend, isSendingPending && styles.buttonDisabled]}
                onPress={handleSendTransaction}
                disabled={isSendingPending}
              >
                <Text style={styles.buttonText}>
                  {isSendingPending ? "Sending..." : "Send Tx"}
                </Text>
              </TouchableOpacity>
            </View>

            {signedMessage && (
              <View style={styles.result}>
                <Text style={styles.resultLabel}>Signature:</Text>
                <Text style={styles.resultValue} numberOfLines={1}>{signedMessage.slice(0, 42)}...</Text>
              </View>
            )}
            {txHash && (
              <View style={styles.result}>
                <Text style={styles.resultLabel}>Tx Hash:</Text>
                <Text style={styles.resultValue} numberOfLines={1}>{txHash.slice(0, 42)}...</Text>
              </View>
            )}

            <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
              <Text style={styles.disconnectButtonText}>Disconnect</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Event Log */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Event Log</Text>
        {eventLog.length === 0 ? (
          <Text style={styles.emptyLog}>No events yet — tap buttons above</Text>
        ) : (
          eventLog.map((log, i) => (
            <Text key={i} style={styles.logEntry}>{log}</Text>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
    padding: 16,
  },
  section: {
    backgroundColor: "#16213e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sdkSection: {
    borderWidth: 1,
    borderColor: "#8b5cf6",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  description: {
    color: "#888",
    fontSize: 13,
    marginBottom: 12,
  },
  buttonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sdkButton: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    minWidth: "30%",
    alignItems: "center",
  },
  sdkButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  sdkConnect: { backgroundColor: "#22c55e" },
  sdkDisconnect: { backgroundColor: "#ef4444" },
  sdkChain: { backgroundColor: "#f59e0b" },
  sdkSign: { backgroundColor: "#3b82f6" },
  sdkTx: { backgroundColor: "#e91e63" },
  sdkTrack: { backgroundColor: "#8b5cf6" },
  connectorList: { gap: 10 },
  connectorButton: {
    backgroundColor: "#3b82f6",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  mockButton: { backgroundColor: "#8b5cf6" },
  connectorButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  connectorSubtext: {
    color: "#c4b5fd",
    fontSize: 12,
    marginTop: 2,
  },
  disconnectButton: {
    backgroundColor: "#ef4444",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  disconnectButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#3a3a5a",
  },
  infoLabel: { color: "#aaa", fontSize: 14 },
  infoValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    maxWidth: "60%",
    textAlign: "right",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  smallButton: {
    flex: 1,
    backgroundColor: "#252540",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#3a3a5a",
  },
  smallButtonActive: {
    backgroundColor: "#1e3a5f",
    borderColor: "#3b82f6",
  },
  smallButtonText: { color: "#ccc", fontSize: 13, fontWeight: "500" },
  button: {
    flex: 1,
    backgroundColor: "#009688",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonSend: { backgroundColor: "#e91e63" },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  result: {
    marginTop: 8,
    backgroundColor: "#1a1a2e",
    padding: 10,
    borderRadius: 8,
  },
  resultLabel: { color: "#888", fontSize: 11, marginBottom: 2 },
  resultValue: { color: "#4ade80", fontSize: 11, fontFamily: "monospace" },
  emptyLog: { color: "#555", fontSize: 13, fontStyle: "italic" },
  logEntry: {
    color: "#a0a0b0",
    fontSize: 11,
    fontFamily: "monospace",
    paddingVertical: 3,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#2a2a4a",
  },
});
