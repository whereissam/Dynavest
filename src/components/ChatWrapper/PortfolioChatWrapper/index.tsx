import React, { useEffect, useState } from "react";
import { MoveUpRight, Percent } from "lucide-react";
import { parseUnits } from "viem";
import { toast } from "react-toastify";
import axios from "axios";
import { usePrivy } from "@privy-io/react-auth";
import { MoonLoader } from "react-spinners";

import { RiskLevel, RiskPortfolioStrategies } from "@/types";
import type { Message, PortfolioMessage } from "@/classes/message";
import { RISK_OPTIONS } from "@/constants/risk";
import { createPieChartStrategies } from "@/utils/pie";
import { getRiskDescription } from "../../RiskPortfolio";
import { PortfolioPieChart } from "../../RiskPortfolio/PieChart";
import { RiskBadgeList } from "../../RiskBadgeList";
import Button from "@/components/Button";
import { USDC } from "@/constants/coins";
import useBalance from "@/hooks/useBalance";
import { getStrategy } from "@/utils/strategies";
import { MultiStrategy } from "@/classes/strategies/multiStrategy";
import { useStrategy } from "@/hooks/useStrategy";
import { useAssets } from "@/contexts/AssetsContext";

interface PortfolioChatWrapperProps {
  message: PortfolioMessage;
  addBotMessage: (message: Message) => Promise<void>;
}

const PortfolioChatWrapper: React.FC<PortfolioChatWrapperProps> = ({
  message,
  addBotMessage,
}) => {
  const { authenticated } = usePrivy();
  const { login } = useAssets();
  const [risk, setRisk] = useState<RiskLevel>(message.risk);
  const [strategies, setStrategies] = useState<RiskPortfolioStrategies[]>(
    message.strategies
  );
  const [isEdit, setIsEdit] = useState(true);

  // TODO: hardcode USDC
  const { balance, isLoadingBalance } = useBalance(USDC);
  const { multiInvest } = useStrategy();

  const totalAPY = strategies.reduce((acc, strategy) => {
    return acc + (strategy.apy * strategy.allocation) / 100;
  }, 0);

  const handleBuildPortfolio = async () => {
    if (!authenticated) {
      login();
      return;
    } else {
      await nextMessage("build");
    }
  };

  const nextMessage = async (action: "build" | "edit") => {
    if (isLoadingBalance) return;

    message.risk = risk;
    message.strategies = strategies;

    setIsEdit(false);

    if (action === "build") {
      if (
        // TODO: hardcode USDC
        parseUnits(message.amount, USDC.decimals) >
        parseUnits(balance.toString(), USDC.decimals)
      ) {
        await addBotMessage(message.next("deposit"));
      } else {
        await executeMultiStrategy();
      }
    } else {
      await addBotMessage(message.next(action));
    }
  };

  async function executeMultiStrategy() {
    const strategiesHandlers = strategies.map((strategy) => ({
      strategy: getStrategy(strategy.id, strategy.chainId),
      allocation: strategy.allocation,
    }));
    const multiStrategy = new MultiStrategy(strategiesHandlers);

    try {
      const txHash = await multiInvest.mutateAsync({
        multiStrategy,
        amount: parseUnits(message.amount, USDC.decimals),
        token: USDC,
      });
      toast.success(`Portfolio built successfully, ${txHash}`);
      await addBotMessage(message.next("build"));
    } catch (error) {
      console.error("Error building portfolio:", error);
      if (axios.isAxiosError(error) && error.response) {
        const errorData = JSON.parse(error.response.data);
        console.error("Error response data:", errorData);
        toast.error(`Error building portfolio, ${errorData.message}`);
      } else {
        toast.error(`Error building portfolio, ${error}`);
      }
    }
  }

  useEffect(() => {
    setStrategies(message.strategiesSet[risk]);
  }, [risk]);

  return (
    <div className="mt-4 overflow-x-auto max-w-full w-full flex justify-center">
      <div className="w-full max-w-[320px] md:max-w-none">
        <div className="flex flex-col gap-3">
          <div className="rounded-[0px_10px_10px_10px] p-4 flex flex-col gap-6">
            {/* Risk preference selection */}
            <RiskBadgeList
              selectedRisk={risk}
              isEditable={isEdit}
              setSelectedRiskLevel={setRisk}
              options={RISK_OPTIONS}
            />

            <div className="flex flex-col text-xs md:text-sm font-normal px-1 gap-2">
              <div className="text-gray">
                <p>{getRiskDescription(message.risk)}</p>

                <p className="font-bold">
                  Average Portfolio APY: {totalAPY.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="my-4 flex flex-col gap-6 w-full max-w-[805px]">
          {/* Portfolio visualization */}
          <div className="flex items-center w-full px-[10px] gap-[10px]">
            {/* Pie chart */}
            <div className="w-full">
              <PortfolioPieChart
                pieStrategies={createPieChartStrategies(strategies)}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="w-full flex flex-col gap-5 md:flex-row">
            <Button
              onClick={() => nextMessage("edit")}
              text="Change Percentage"
              disabled={!isEdit}
              icon={<Percent />}
            />

            {multiInvest.isPending ? (
              <button
                className="w-full cursor-pointer max-w-[250px] flex items-center justify-center gap-2.5 rounded-lg bg-[#5F79F1] text-white py-3.5 px-5 disabled:opacity-50"
                disabled={multiInvest.isPending}
              >
                <MoonLoader size={12} />
              </button>
            ) : (
              <Button
                onClick={handleBuildPortfolio}
                text="Start Building Portfolio"
                disabled={!isEdit}
                icon={<MoveUpRight />}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortfolioChatWrapper;
