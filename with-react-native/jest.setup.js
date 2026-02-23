// Mock expo modules
jest.mock("expo-router", () => ({
  Stack: {
    Screen: () => null,
  },
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Link: ({ children }) => children,
}));

jest.mock("expo-status-bar", () => ({
  StatusBar: () => null,
}));

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Mock wagmi
jest.mock("wagmi", () => ({
  createConfig: jest.fn((config) => config),
  http: jest.fn(() => ({})),
  useAccount: () => ({
    address: undefined,
    isConnected: false,
  }),
  useBalance: () => ({
    data: undefined,
  }),
  useChainId: () => 84532, // Base Sepolia
  useConnect: () => ({
    connectors: [],
    connect: jest.fn(),
    isPending: false,
  }),
  useDisconnect: () => ({
    disconnect: jest.fn(),
  }),
  useSignMessage: () => ({
    signMessage: jest.fn(),
    isPending: false,
    data: undefined,
    reset: jest.fn(),
  }),
  useSendTransaction: () => ({
    sendTransaction: jest.fn(),
    isPending: false,
    data: undefined,
    reset: jest.fn(),
  }),
  useSwitchChain: () => ({
    switchChain: jest.fn(),
    isPending: false,
  }),
  WagmiProvider: ({ children }) => children,
}));

jest.mock("wagmi/chains", () => ({
  baseSepolia: { id: 84532, name: "Base Sepolia" },
  optimismSepolia: { id: 11155420, name: "OP Sepolia" },
}));

jest.mock("wagmi/connectors", () => ({
  walletConnect: jest.fn(() => ({})),
}));

// Mock @tanstack/react-query
jest.mock("@tanstack/react-query", () => ({
  QueryClient: jest.fn(() => ({})),
  QueryClientProvider: ({ children }) => children,
}));

// Mock @formo/react-native-analytics
jest.mock("@formo/react-native-analytics", () => ({
  FormoAnalyticsProvider: ({ children }) => children,
  useFormo: () => ({
    track: jest.fn(),
    screen: jest.fn(),
    identify: jest.fn(),
    reset: jest.fn(),
    hasOptedOutTracking: jest.fn(() => false),
    optOutTracking: jest.fn(),
    optInTracking: jest.fn(),
  }),
}));

// Mock react-native-safe-area-context
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Silence console warnings in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
