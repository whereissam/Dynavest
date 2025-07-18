import React from "react";

import StrategyListChatWrapper from "../StrategyListChatWrapper";
import { StrategiesCardsMessage } from "@/classes/message";

interface DefiStrategiesCardsChatWrapperProps {
  message: StrategiesCardsMessage;
}

const DefiStrategiesCardsChatWrapper: React.FC<
  DefiStrategiesCardsChatWrapperProps
> = ({ message }) => {
  return (
    <StrategyListChatWrapper
      selectedChains={message.chains}
      selectedRiskLevel={message.risk}
    />
  );
};

export default DefiStrategiesCardsChatWrapper;
