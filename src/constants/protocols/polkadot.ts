import { POLKADOT_CHAIN } from "@/constants/chains";
import type { Protocol } from "@/types/strategies";

export const ACALA = {
  name: "Acala",
  description: "Acala is a decentralized finance hub and stablecoin platform built for the Polkadot ecosystem.",
  icon: "/crypto-icons/protocol/acala.svg",
  link: "https://acala.network/",
  contracts: {
    [POLKADOT_CHAIN.id]: {
      // Acala parachain contracts would go here
      dex: "0x0000000000000000000000000000000000000000", // Placeholder
      lending: "0x0000000000000000000000000000000000000000", // Placeholder
    },
  },
} as const satisfies Protocol;

export const BIFROST = {
  name: "Bifrost",
  description: "Bifrost is a liquid staking protocol that provides cross-chain staking derivatives.",
  icon: "/crypto-icons/protocol/bifrost.svg", 
  link: "https://bifrost.finance/",
  contracts: {
    [POLKADOT_CHAIN.id]: {
      // Bifrost parachain contracts would go here
      liquidStaking: "0x0000000000000000000000000000000000000000", // Placeholder
    },
  },
} as const satisfies Protocol;

export const HYDRADX = {
  name: "HydraDX",
  description: "HydraDX is a next-generation AMM protocol designed for programmable liquidity.",
  icon: "/crypto-icons/protocol/hydradx.svg",
  link: "https://hydradx.io/",
  contracts: {
    [POLKADOT_CHAIN.id]: {
      // HydraDX parachain contracts would go here
      omnipool: "0x0000000000000000000000000000000000000000", // Placeholder
    },
  },
} as const satisfies Protocol;