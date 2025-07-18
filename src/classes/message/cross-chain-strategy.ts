import { Message, MessageMetadata } from "./base";

export class CrossChainStrategyMessage extends Message {
  constructor(
    metadata: MessageMetadata,
    public readonly riskLevel: number,
    public readonly investmentAmount: number,
    public readonly account: string
  ) {
    super(metadata);
  }

  next(action?: string): Message {
    // Return a new instance or handle the next action
    return new CrossChainStrategyMessage(
      this.createDefaultMetadata(`Cross-chain strategy for account ${this.account}`),
      this.riskLevel,
      this.investmentAmount,
      this.account
    );
  }
}