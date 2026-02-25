import { useEffect } from "react";
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
  useBalance,
  useChainId,
  useConnect,
  useDisconnect,
  useSignMessage,
  useSendTransaction,
  useSwitchChain,
} from "wagmi";
import { chains } from "../config/wagmi";
import { formatUnits, parseEther } from "viem";
import { useFormo } from "@formo/react-native-analytics";

export default function WalletScreen() {
  const formo = useFormo();
  const { address, isConnected } = useAccount();

  // Track screen view on mount and when SDK initializes
  useEffect(() => {
    formo.screen("Wallet");
  }, [formo]);

  // Note: Wallet connect/disconnect, signature, and transaction events
  // are automatically tracked by the SDK via wagmi integration

  const chainId = useChainId();
  const { data: balance } = useBalance({ address });
  const { connectors, connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitchingChain } = useSwitchChain();

  const currentChain = chains.find((c) => c.id === chainId);
  const isOnSupportedChain = currentChain !== undefined;

  // Note: All wallet events (connect, disconnect, signature, transaction) are
  // automatically tracked by the SDK via wagmi's MutationCache and config.subscribe().
  // No need to override mutation callbacks for tracking.

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

  const handleSignMessage = () => {
    signMessage({ message: "Sign this message to verify wallet ownership" });
  };

  const handleSendTransaction = () => {
    // Send a small amount to yourself (0.0001 ETH)
    if (address) {
      sendTransaction({
        to: address,
        value: parseEther("0.0001"),
      });
    }
  };

  const handleConnect = (connector: (typeof connectors)[number]) => {
    connect(
      { connector },
      {
        onError: (error) => {
          Alert.alert("Connection Error", error.message);
        },
      }
    );
  };

  const handleDisconnect = () => {
    disconnect();
    // Clear mutation state; disconnect event is tracked automatically by SDK
    resetSignature();
    resetTransaction();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wallet Connection</Text>
        {!isConnected ? (
          <View style={styles.connectorList}>
            {connectors.map((connector) => (
              <TouchableOpacity
                key={connector.uid}
                style={[styles.connectorButton, isConnecting && styles.buttonDisabled]}
                onPress={() => handleConnect(connector)}
                disabled={isConnecting}
              >
                <Text style={styles.connectorButtonText}>
                  {isConnecting ? "Connecting..." : `Connect with ${connector.name}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <TouchableOpacity style={styles.disconnectButton} onPress={handleDisconnect}>
            <Text style={styles.disconnectButtonText}>Disconnect Wallet</Text>
          </TouchableOpacity>
        )}
      </View>

      {isConnected && address && (
        <>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Info</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address</Text>
              <Text style={styles.infoValue} numberOfLines={1}>
                {address.slice(0, 10)}...{address.slice(-8)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Network</Text>
              <Text style={[styles.infoValue, !isOnSupportedChain && styles.warningText]}>
                {currentChain?.name || `Unsupported (${chainId})`}
              </Text>
            </View>
            {!isOnSupportedChain && (
              <View style={styles.warningBanner}>
                <Text style={styles.warningBannerText}>
                  Please switch to a supported network before sending transactions.
                </Text>
              </View>
            )}
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Balance</Text>
              <Text style={styles.infoValue}>
                {balance
                  ? `${parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4)} ${balance.symbol}`
                  : "Loading..."}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Switch Network</Text>
            <Text style={styles.description}>
              Select a network to switch to. Chain changes are tracked by Formo Analytics.
            </Text>
            <View style={styles.chainList}>
              {chains.map((chain) => (
                <TouchableOpacity
                  key={chain.id}
                  style={[
                    styles.chainButton,
                    chainId === chain.id && styles.chainButtonActive,
                    isSwitchingChain && styles.buttonDisabled,
                  ]}
                  onPress={() => switchChain({ chainId: chain.id })}
                  disabled={chainId === chain.id || isSwitchingChain}
                >
                  <Text
                    style={[
                      styles.chainButtonText,
                      chainId === chain.id && styles.chainButtonTextActive,
                    ]}
                  >
                    {chain.name}
                  </Text>
                  {chainId === chain.id && (
                    <Text style={styles.chainButtonCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sign Message</Text>
            <Text style={styles.description}>
              Sign a message to prove wallet ownership. This is tracked by Formo
              Analytics.
            </Text>
            <TouchableOpacity
              style={[styles.button, isSigningPending && styles.buttonDisabled]}
              onPress={handleSignMessage}
              disabled={isSigningPending}
            >
              <Text style={styles.buttonText}>
                {isSigningPending ? "Signing..." : "Sign Message"}
              </Text>
            </TouchableOpacity>
            {signedMessage && (
              <View style={styles.result}>
                <Text style={styles.resultLabel}>Signature:</Text>
                <Text style={styles.resultValue} numberOfLines={2}>
                  {signedMessage.slice(0, 40)}...
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Send Transaction</Text>
            <Text style={styles.description}>
              Send a small test transaction (0.0001 ETH to yourself). This is
              tracked by Formo Analytics.
            </Text>
            <TouchableOpacity
              style={[styles.button, styles.buttonSend, (isSendingPending || isSwitchingChain || !isOnSupportedChain) && styles.buttonDisabled]}
              onPress={handleSendTransaction}
              disabled={isSendingPending || isSwitchingChain || !isOnSupportedChain}
            >
              <Text style={styles.buttonText}>
                {isSendingPending ? "Sending..." : "Send 0.0001 ETH"}
              </Text>
            </TouchableOpacity>
            {txHash && (
              <View style={styles.result}>
                <Text style={styles.resultLabel}>Transaction Hash:</Text>
                <Text style={styles.resultValue} numberOfLines={2}>
                  {txHash.slice(0, 40)}...
                </Text>
              </View>
            )}
          </View>
        </>
      )}

      {!isConnected && (
        <View style={styles.section}>
          <Text style={styles.notConnected}>
            Connect your wallet to test message signing and transactions.
          </Text>
        </View>
      )}
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  connectorList: {
    gap: 12,
  },
  chainList: {
    gap: 10,
  },
  chainButton: {
    backgroundColor: "#252540",
    padding: 14,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#3a3a5a",
  },
  chainButtonActive: {
    backgroundColor: "#1e3a5f",
    borderColor: "#3b82f6",
  },
  chainButtonText: {
    color: "#aaa",
    fontSize: 16,
    fontWeight: "500",
  },
  chainButtonTextActive: {
    color: "#fff",
  },
  chainButtonCheck: {
    color: "#4ade80",
    fontSize: 16,
    fontWeight: "bold",
  },
  connectorButton: {
    backgroundColor: "#3b82f6",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  connectorButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  disconnectButton: {
    backgroundColor: "#ef4444",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  disconnectButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#3a3a5a",
  },
  infoLabel: {
    color: "#aaa",
    fontSize: 14,
  },
  infoValue: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    maxWidth: "60%",
    textAlign: "right",
  },
  warningText: {
    color: "#f59e0b",
  },
  warningBanner: {
    backgroundColor: "#78350f",
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
  },
  warningBannerText: {
    color: "#fcd34d",
    fontSize: 13,
    textAlign: "center",
  },
  description: {
    color: "#888",
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  button: {
    backgroundColor: "#009688",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonSend: {
    backgroundColor: "#e91e63",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  result: {
    marginTop: 12,
    backgroundColor: "#1a1a2e",
    padding: 12,
    borderRadius: 8,
  },
  resultLabel: {
    color: "#888",
    fontSize: 12,
    marginBottom: 4,
  },
  resultValue: {
    color: "#4ade80",
    fontSize: 12,
    fontFamily: "monospace",
  },
  notConnected: {
    color: "#888",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
});
