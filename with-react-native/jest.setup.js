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

// rpcUrls is part of viem's Chain shape and config/wagmi.ts overrides it to
// point the mock wallet at a local node, so the stubs need it to stay realistic.
jest.mock("wagmi/chains", () => ({
  baseSepolia: {
    id: 84532,
    name: "Base Sepolia",
    rpcUrls: { default: { http: ["https://sepolia.base.org"] } },
  },
  optimismSepolia: {
    id: 11155420,
    name: "OP Sepolia",
    rpcUrls: { default: { http: ["https://sepolia.optimism.io"] } },
  },
}));

jest.mock("wagmi/connectors", () => ({
  walletConnect: jest.fn(() => ({})),
}));

// Mock @tanstack/react-query
jest.mock("@tanstack/react-query", () => ({
  QueryClient: jest.fn(() => ({})),
  QueryClientProvider: ({ children }) => children,
}));

// Mock @formo/analytics-react-native
jest.mock("@formo/analytics-react-native", () => ({
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

// Mock expo-constants with the real app.json, so config/formo.ts is exercised
// through its actual source of truth rather than its fallbacks.
jest.mock("expo-constants", () => ({
  __esModule: true,
  default: { expoConfig: require("./app.json").expo },
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
