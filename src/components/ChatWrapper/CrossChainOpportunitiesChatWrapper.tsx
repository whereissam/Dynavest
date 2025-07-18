import { useState, useEffect } from "react";
import { CrossChainOpportunitiesMessage } from "@/classes/message";
import { Message } from "@/classes/message";

interface CrossChainOpportunitiesChatWrapperProps {
  message: CrossChainOpportunitiesMessage;
  addBotMessage: (message: Message) => void;
}

interface CrossChainLPData {
  protocol: string;
  chain: string;
  token_pair: string;
  liquidity_usd: number;
  volume_24h: number;
  apy: number;
  risk_score: number;
  last_updated: string;
}

export default function CrossChainOpportunitiesChatWrapper({
  message,
  addBotMessage,
}: CrossChainOpportunitiesChatWrapperProps) {
  const [opportunities, setOpportunities] = useState<CrossChainLPData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SHUTTLE_API_URL}/cross-chain/opportunities/${message.riskLevel}`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          setOpportunities(data.data);
        } else {
          setError(data.error || "Failed to fetch opportunities");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, [message.riskLevel]);

  if (loading) {
    return (
      <div className="mt-4 p-4 bg-gray-100 rounded-lg">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Fetching cross-chain opportunities...</span>
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

  return (
    <div className="mt-4">
      <h3 className="text-lg font-semibold mb-3">
        🌉 Cross-Chain Opportunities (Risk Level: {message.riskLevel}/10)
      </h3>
      
      <div className="space-y-3">
        {opportunities.map((opportunity, index) => (
          <div
            key={index}
            className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium text-gray-900">
                  {opportunity.protocol}
                </h4>
                <p className="text-sm text-gray-600">
                  {opportunity.chain} • {opportunity.token_pair}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-green-600">
                  {opportunity.apy.toFixed(2)}% APY
                </p>
                <p className="text-sm text-gray-600">
                  Risk: {opportunity.risk_score}/10
                </p>
              </div>
            </div>
            
            <div className="flex justify-between text-sm text-gray-600">
              <span>
                TVL: ${(opportunity.liquidity_usd / 1000000).toFixed(1)}M
              </span>
              <span>
                Volume: ${(opportunity.volume_24h / 1000000).toFixed(1)}M
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {opportunities.length === 0 && (
        <p className="text-gray-600 text-center py-4">
          No opportunities found for risk level {message.riskLevel}
        </p>
      )}
    </div>
  );
}