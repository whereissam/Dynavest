import { Message, MessageMetadata } from "./base";

export class CrossChainOpportunitiesMessage extends Message {
  constructor(
    metadata: MessageMetadata,
    public readonly riskLevel: number,
    public readonly investmentAmount?: number
  ) {
    super(metadata);
  }

  next(action?: string): Message {
    // Return a new instance or handle the next action
    return new CrossChainOpportunitiesMessage(
      this.createDefaultMetadata(`Cross-chain opportunities for risk level ${this.riskLevel}`),
      this.riskLevel,
      this.investmentAmount
    );
  }
}