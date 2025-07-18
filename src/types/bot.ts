import { RiskLevel } from "./strategies";

export type BotResponse = {
  type: BotResponseType;
  data: BotResponseData;
};

export type BotResponseType =
  | "strategies"
  | "text"
  | "question"
  | "build_portfolio"
  | "analyze_portfolio"
  | "cross_chain_opportunities"
  | "cross_chain_strategy";

export type BotResponseData = {
  risk_level: RiskLevel;
  chain: number;
} & {
  answer: string;
};
