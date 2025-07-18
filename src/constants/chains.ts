import { wagmiConfig } from "@/providers/config";

// Polkadot chain configurations
export const POLKADOT_MAINNET = {
  id: 1000,
  name: "Polkadot",
  icon: "/crypto-icons/chains/polkadot.svg",
  rpcUrl: "wss://polkadot-rpc.dwellir.com",
  type: "polkadot" as const,
  isTestnet: false,
  nativeCurrency: {
    name: "DOT",
    symbol: "DOT",
    decimals: 10,
  },
  blockExplorers: {
    default: {
      name: "Polkadot.js",
      url: "https://polkadot.js.org/apps",
    },
  },
};

export const WESTEND_TESTNET = {
  id: 2000,
  name: "Westend Testnet",
  icon: "/crypto-icons/chains/polkadot.svg",
  rpcUrl: "wss://westend-rpc.polkadot.io",
  type: "polkadot" as const,
  isTestnet: true,
  nativeCurrency: {
    name: "WND",
    symbol: "WND",
    decimals: 12,
  },
  blockExplorers: {
    default: {
      name: "Polkadot.js",
      url: "https://westend.statescan.io",
    },
  },
  faucet: "https://paritytech.github.io/polkadot-testnet-faucet/",
};

export const ROCOCO_TESTNET = {
  id: 3000,
  name: "Rococo Testnet",
  icon: "/crypto-icons/chains/polkadot.svg",
  rpcUrl: "wss://rococo-rpc.polkadot.io",
  type: "polkadot" as const,
  isTestnet: true,
  nativeCurrency: {
    name: "ROC",
    symbol: "ROC",
    decimals: 12,
  },
  blockExplorers: {
    default: {
      name: "Polkadot.js",
      url: "https://rococo.statescan.io",
    },
  },
  faucet: "https://paritytech.github.io/polkadot-testnet-faucet/",
};

export const ROCOCO_CONTRACTS_TESTNET = {
  id: 3001,
  name: "Rococo Contracts",
  icon: "/crypto-icons/chains/polkadot.svg", 
  rpcUrl: "wss://rococo-contracts-rpc.polkadot.io",
  type: "polkadot" as const,
  isTestnet: true,
  nativeCurrency: {
    name: "ROC",
    symbol: "ROC",
    decimals: 12,
  },
  blockExplorers: {
    default: {
      name: "Polkadot.js",
      url: "https://rococo.statescan.io",
    },
  },
  faucet: "https://paritytech.github.io/polkadot-testnet-faucet/",
};

// Backward compatibility
export const POLKADOT_CHAIN = POLKADOT_MAINNET;

// All Polkadot chains
export const POLKADOT_CHAINS = [
  POLKADOT_MAINNET,
  WESTEND_TESTNET,
  ROCOCO_TESTNET,
  ROCOCO_CONTRACTS_TESTNET,
];

// EVM chains from wagmi config
export const EVM_CHAINS = wagmiConfig.chains.map((chain) => {
  return {
    ...chain,
    icon: `/crypto-icons/chains/${chain.id}.svg`,
    type: "evm" as const,
  };
});

// Combined chains for UI selection
export const CHAINS = [
  ...EVM_CHAINS,
  ...POLKADOT_CHAINS,
];

export const getChain = (id: number) => {
  return CHAINS.find((chain) => chain.id === id);
};

export const getEVMChain = (id: number) => {
  return EVM_CHAINS.find((chain) => chain.id === id);
};

export const getPolkadotChain = (id: number) => {
  return POLKADOT_CHAINS.find((chain) => chain.id === id);
};

export const isPolkadotChain = (id: number) => {
  return POLKADOT_CHAINS.some((chain) => chain.id === id);
};

export const isTestnetChain = (id: number) => {
  const chain = getChain(id);
  return chain && 'isTestnet' in chain ? chain.isTestnet : false;
};
