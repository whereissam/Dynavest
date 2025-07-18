import { useState, useEffect } from "react";
import { CrossChainStrategyMessage } from "@/classes/message";
import { Message } from "@/classes/message";

interface CrossChainStrategyChatWrapperProps {
  message: CrossChainStrategyMessage;
  addBotMessage: (message: Message) => void;
}

interface StrategyRecommendation {
  protocol: string;
  chain: string;
  token_pair: string;
  allocation_percentage: number;
  allocated_amount: number;
  expected_apy: number;
  risk_score: number;
  reasoning: string;
}

interface EnhancedStrategyParams {
  base_strategy: string;
  recommendations: StrategyRecommendation[];
  total_expected_apy: number;
  diversification_score: number;
  generated_at: string;
}

export default function CrossChainStrategyChatWrapper({
  message,
  addBotMessage,
}: CrossChainStrategyChatWrapperProps) {
  const [strategy, setStrategy] = useState<EnhancedStrategyParams | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateStrategy = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SHUTTLE_API_URL}/cross-chain/strategy`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              account: message.account,
              risk_level: message.riskLevel,
              investment_amount: message.investmentAmount,
            }),
          }
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          setStrategy(data.data);
        } else {
          setError(data.error || "Failed to generate strategy");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    generateStrategy();
  }, [message.riskLevel, message.investmentAmount, message.account]);

  if (loading) {
    return (
      <div className="mt-4 p-4 bg-gray-100 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Generating cross-chain strategy...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-4 p-4 bg-red-100 rounded-lg">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  if (!strategy) {
    return (
      <div className="mt-4 p-4 bg-gray-100 rounded-lg">
        <p className="text-gray-600">No strategy generated</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg mb-4">
        <h3 className="text-lg font-semibold mb-2">
          🎯 {strategy.base_strategy}
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Expected APY:</span>
            <span className="text-green-600 ml-2">
              {strategy.total_expected_apy.toFixed(2)}%
            </span>
          </div>
          <div>
            <span className="font-medium">Diversification:</span>
            <span className="text-blue-600 ml-2">
              {strategy.diversification_score.toFixed(1)}/100
            </span>
          </div>
        </div>
      </div>

      <h4 className="font-medium mb-3">📊 Recommended Allocations</h4>
      
      <div className="space-y-3">
        {strategy.recommendations.map((rec, index) => (
          <div
            key={index}
            className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h5 className="font-medium text-gray-900">
                  {rec.protocol}
                </h5>
                <p className="text-sm text-gray-600">
                  {rec.chain} • {rec.token_pair}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-green-600">
                  {rec.allocation_percentage.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">
                  ${rec.allocated_amount.toFixed(2)}
                </p>
              </div>
            </div>
            
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Expected APY: {rec.expected_apy.toFixed(2)}%</span>
              <span>Risk: {rec.risk_score}/10</span>
            </div>
            
            <p className="text-sm text-gray-700 italic">
              {rec.reasoning}
            </p>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700">
          💡 This strategy is generated using real-time cross-chain data from Ethereum and other networks via Hyperbridge integration.
        </p>
      </div>
    </div>
  );
}