import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { useFormo } from "@formo/analytics-react-native";

export default function EventsScreen() {
  const formo = useFormo();

  const [customEventName, setCustomEventName] = useState("button_clicked");
  const [customProperty, setCustomProperty] = useState("");
  const [eventsSent, setEventsSent] = useState(0);

  const sendEvent = (eventType: string, details?: string) => {
    setEventsSent((prev) => prev + 1);
    Alert.alert("Event Sent", `${eventType}${details ? `\n${details}` : ""}`);
  };

  // Track custom event
  const handleTrackCustomEvent = () => {
    const properties: Record<string, unknown> = {
      screen: "Events",
      timestamp: new Date().toISOString(),
    };

    if (customProperty) {
      properties.customValue = customProperty;
    }

    formo.track(customEventName, properties);
    sendEvent("track", `Event: ${customEventName}`);
  };

  // Push notification lifecycle events (Segment spec names).
  //
  // These are NOT autocaptured: push delivery is invisible to JavaScript
  // without a native module, so your push handler forwards them. In a real app
  // these calls live inside @react-native-firebase/messaging or
  // expo-notifications callbacks rather than behind a button.
  const handlePushNotification = (
    kind: "Received" | "Tapped" | "Bounced",
  ) => {
    const properties = {
      campaign_id: "demo-campaign-1",
      message_id: `demo-${Date.now()}`,
    };

    if (kind === "Received") formo.pushNotificationReceived(properties);
    if (kind === "Tapped") formo.pushNotificationTapped(properties);
    if (kind === "Bounced") formo.pushNotificationBounced(properties);

    sendEvent("track", `Push Notification ${kind}`);
  };

  // Deliberately throw so the SDK's global error handler reports
  // `Application Crashed`. Requires autocapture.crashes (see config/formo.ts).
  //
  // The previous handler always runs afterwards, so in development you will
  // still see the redbox — that is the intended behaviour, not a failure. The
  // event is flushed before the handler chain continues.
  const handleTriggerCrash = () => {
    Alert.alert(
      "Trigger a crash?",
      "Throws an unhandled error so the SDK reports Application Crashed. " +
        "In development the redbox will appear afterwards.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Throw",
          style: "destructive",
          onPress: () => {
            setTimeout(() => {
              throw new Error("Demo crash from the Events screen");
            }, 0);
          },
        },
      ],
    );
  };

  // Track revenue event
  const handleTrackRevenue = () => {
    formo.track("purchase_completed", {
      revenue: 99.99,
      currency: "USD",
      productId: "premium-nft-001",
      productName: "Premium NFT",
      quantity: 1,
    });
    sendEvent("track (revenue)", "revenue: $99.99 USD");
  };

  // Track points event
  const handleTrackPoints = () => {
    formo.track("achievement_unlocked", {
      points: 500,
      achievementId: "first_transaction",
      achievementName: "First Transaction",
    });
    sendEvent("track (points)", "points: 500");
  };

  // Track volume event
  const handleTrackVolume = () => {
    formo.track("swap_completed", {
      volume: 1.5,
      fromToken: "ETH",
      toToken: "USDC",
      fromAmount: "1.5",
      toAmount: "3000",
    });
    sendEvent("track (volume)", "volume: 1.5 ETH");
  };

  // Note: Wallet events (connect, disconnect, signature, transaction) are
  // automatically tracked by the SDK via wagmi integration. See the Wallet
  // screen to test real wallet interactions.

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Event Counter */}
      <View style={styles.counterCard}>
        <Text style={styles.counterValue}>{eventsSent}</Text>
        <Text style={styles.counterLabel}>Events Sent This Session</Text>
      </View>

      {/* Custom Event */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Custom Track Event</Text>

        <Text style={styles.inputLabel}>Event Name</Text>
        <TextInput
          style={styles.input}
          value={customEventName}
          onChangeText={setCustomEventName}
          placeholder="e.g., button_clicked"
          placeholderTextColor="#666"
        />

        <Text style={styles.inputLabel}>Custom Property (optional)</Text>
        <TextInput
          style={styles.input}
          value={customProperty}
          onChangeText={setCustomProperty}
          placeholder="e.g., signup_form"
          placeholderTextColor="#666"
        />

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleTrackCustomEvent}
        >
          <Text style={styles.primaryButtonText}>Send Track Event</Text>
        </TouchableOpacity>
      </View>

      {/* Semantic Events */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Semantic Events</Text>
        <Text style={styles.cardSubtitle}>
          Events with special properties for analytics
        </Text>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.semanticButton}
            onPress={handleTrackRevenue}
          >
            <Text style={styles.semanticButtonText}>💰 Revenue Event</Text>
            <Text style={styles.semanticButtonSubtext}>$99.99 USD</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.semanticButton}
            onPress={handleTrackPoints}
          >
            <Text style={styles.semanticButtonText}>⭐ Points Event</Text>
            <Text style={styles.semanticButtonSubtext}>500 points</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.semanticButton}
            onPress={handleTrackVolume}
          >
            <Text style={styles.semanticButtonText}>📈 Volume Event</Text>
            <Text style={styles.semanticButtonSubtext}>1.5 ETH</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Lifecycle Events</Text>
        <Text style={styles.cardSubtitle}>
          Application Installed / Opened / Backgrounded / Foregrounded and Deep
          Link Opened are tracked automatically. The ones below cannot be —
          push delivery needs a native module, and a crash needs a crash.
        </Text>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.semanticButton}
            onPress={() => handlePushNotification("Received")}
          >
            <Text style={styles.semanticButtonText}>🔔 Push Received</Text>
            <Text style={styles.semanticButtonSubtext}>
              Push Notification Received
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.semanticButton}
            onPress={() => handlePushNotification("Tapped")}
          >
            <Text style={styles.semanticButtonText}>👆 Push Tapped</Text>
            <Text style={styles.semanticButtonSubtext}>
              Push Notification Tapped
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.semanticButton}
            onPress={() => handlePushNotification("Bounced")}
          >
            <Text style={styles.semanticButtonText}>↩️ Push Bounced</Text>
            <Text style={styles.semanticButtonSubtext}>
              Push Notification Bounced
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.semanticButton}
            onPress={handleTriggerCrash}
          >
            <Text style={styles.semanticButtonText}>💥 Trigger Crash</Text>
            <Text style={styles.semanticButtonSubtext}>
              Application Crashed
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Wallet Events</Text>
        <Text style={styles.infoText}>
          Wallet events (connect, disconnect, signature, transaction) are
          automatically tracked by the SDK via wagmi integration. Go to the
          Wallet tab to test real wallet interactions.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },
  content: {
    padding: 20,
  },
  counterCard: {
    backgroundColor: "#3b82f6",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  counterValue: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
  },
  counterLabel: {
    fontSize: 14,
    color: "#93c5fd",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#252540",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#a0a0b0",
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    color: "#a0a0b0",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1a1a2e",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#3a3a5a",
  },
  primaryButton: {
    backgroundColor: "#3b82f6",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonGroup: {
    gap: 12,
  },
  semanticButton: {
    backgroundColor: "#1a1a2e",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3a3a5a",
  },
  semanticButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  semanticButtonSubtext: {
    color: "#a0a0b0",
    fontSize: 13,
    marginTop: 4,
  },
  infoCard: {
    backgroundColor: "#1e1e3a",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#3a3a5a",
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: "#a0a0b0",
    lineHeight: 22,
  },
});
