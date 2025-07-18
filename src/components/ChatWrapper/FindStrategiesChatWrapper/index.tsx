import React, { FC, useState } from "react";
import { MoveUpRight } from "lucide-react";

import { RiskLevel } from "@/types";
import { RISK_OPTIONS } from "@/constants/risk";
import { FindStrategiesMessage, Message } from "@/classes/message";
import ChainFilter from "../../StrategyList/ChainFilter";
import { RiskBadgeList } from "../../RiskBadgeList";
import Button from "../../Button";

interface FindStrategiesChatWrapperProps {
  message: FindStrategiesMessage;
  addBotMessage: (message: Message) => Promise<void>;
}

const FindStrategiesChatWrapper: FC<FindStrategiesChatWrapperProps> = ({
  message,
  addBotMessage,
}) => {
  const [chains, setChains] = useState<number[]>(message.chains);
  const [risk, setRisk] = useState<RiskLevel>(message.risk);
  const [isEdit, setIsEdit] = useState(true);

  const nextMessage = async () => {
    message.chains = chains;
    message.risk = risk;

    setIsEdit(false);

    await addBotMessage(message.next());
  };

  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <p className="font-[Manrope] font-medium text-sm">Select Chains</p>
        <ChainFilter selectedChains={chains} setSelectedChains={setChains} />
      </div>
      <div className="flex items-center gap-2">
        <p className="font-[Manrope] font-medium text-sm">Select Risk</p>
        <RiskBadgeList
          selectedRisk={risk}
          setSelectedRiskLevel={setRisk}
          options={RISK_OPTIONS}
          isEditable={isEdit}
        />
      </div>
      <Button
        onClick={nextMessage}
        text="Find DeFi Strategies"
        disabled={!isEdit}
        icon={<MoveUpRight />}
      />
    </div>
  );
};

export default FindStrategiesChatWrapper;
