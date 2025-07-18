import { Address } from "viem";

import type { STRATEGIES } from "@/constants";
import { RISK_OPTIONS } from "@/constants/risk";
import { Token } from "./blockchain";

type ProtocolContracts = Record<number, Record<string, Address>>;
export type Protocol = {
  name: string;
  description: string;
  icon: string;
  link: string;
  contracts: ProtocolContracts;
};

export type GetProtocolContracts<T extends Protocol> = T["contracts"];
export type GetProtocolChains<T extends Protocol> = keyof T["contracts"] &
  number;
export type GetProtocolContractNames<T extends Protocol> =
  keyof T["contracts"][keyof T["contracts"]] & string;

export type Strategy = (typeof STRATEGIES)[number];
export type StrategyMetadata = {
  title: string;
  id: Strategy;
  apy: number;
  risk: RiskLevel;
  color: `#${string}`;
  protocol: Protocol;
  description: string;
  fullDescription: string;
  externalLink?: string;
  learnMoreLink?: string;
  chainId: number;
  tokens: Token[];
};

export type RiskLevel = (typeof RISK_OPTIONS)[number];
export type RiskPortfolioStrategies = StrategyMetadata & {
  allocation: number;
};

/**
 * represents a strategy with an allocation filtered by risk level
 */
export type StrategiesSet = Record<RiskLevel, RiskPortfolioStrategies[]>;
export type PieStrategy = {
  id: number;
  color: string;
  name: string;
  apy: string;
  risk: RiskLevel;
  allocation: number;
};

export type StrategyDetailsChartToggleOption = "APY" | "TVL" | "PRICE";
export type InvestmentFormMode = "invest" | "withdraw" | "lp";
