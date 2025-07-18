"use client";

import { useState, useEffect } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { toast } from "@/utils/toast";
import { loadStrategies, deleteStrategy, Strategy } from "@/utils/strategyApi";
import { QuickTooltip, InfoTooltip } from "@/components/EnhancedTooltip";

interface SavedStrategyCardProps {
  strategy: Strategy;
  onDelete?: (strategy: Strategy) => void;
}

const SavedStrategyCard = ({ strategy, onDelete }: SavedStrategyCardProps) => {
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Unknown date";
    }
  };

  const getRiskBadgeColor = (riskLevel: number) => {
    if (riskLevel <= 3) return "bg-green-100 text-green-800";
    if (riskLevel <= 6) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getRiskLabel = (riskLevel: number) => {
    if (riskLevel <= 3) return "Low";
    if (riskLevel <= 6) return "Medium";
    return "High";
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="font-semibold text-gray-900 truncate flex-1">
          {strategy.name}
        </h3>
        <div className="flex items-center gap-2">
          <QuickTooltip text={`Risk Level: ${strategy.risk_level}/10 - ${getRiskLabel(strategy.risk_level)} risk investment`}>
            <span className={`px-2 py-1 rounded-full text-xs font-medium cursor-help ${getRiskBadgeColor(strategy.risk_level)}`}>
              {getRiskLabel(strategy.risk_level)} Risk
            </span>
          </QuickTooltip>
          {onDelete && (
            <QuickTooltip text="Delete this strategy">
              <button
                onClick={() => onDelete(strategy)}
                className="text-red-500 hover:text-red-700 p-1"
                aria-label={`Delete strategy ${strategy.name}`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </QuickTooltip>
          )}
        </div>
      </div>
      
      <div className="text-sm text-gray-600 mb-2">
        <span className="font-medium">Risk Level:</span> {strategy.risk_level}/10
      </div>
      
      <div className="text-sm text-gray-600 mb-3">
        <span className="font-medium">Created:</span> {formatDate(strategy.name)}
      </div>
      
      <div className="text-sm text-gray-700">
        <div className="flex items-center gap-1 mb-1">
          <span className="font-medium">Parameters:</span>
          <InfoTooltip
            title="Strategy Parameters"
            content="These are the AI-generated parameters and recommendations for this DeFi strategy, including risk assessment and investment approach."
          />
        </div>
        <div className="p-2 bg-gray-50 rounded text-xs max-h-20 overflow-y-auto">
          {strategy.parameters}
        </div>
      </div>
    </div>
  );
};

export default function SavedStrategiesList() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, authenticated } = usePrivy();

  const fetchStrategies = async () => {
    if (!authenticated || !user?.smartWallet?.address) {
      setError("Please connect your wallet");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const savedStrategies = await loadStrategies(user.smartWallet.address);
      setStrategies(savedStrategies);
    } catch (err) {
      console.error("Error loading strategies:", err);
      setError("Failed to load strategies");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStrategies();
  }, [authenticated, user?.smartWallet?.address]);

  const handleDeleteStrategy = async (strategy: Strategy) => {
    if (!authenticated || !user?.smartWallet?.address || !strategy.id) {
      toast.error("Unable to delete strategy");
      return;
    }

    try {
      await deleteStrategy({
        account: user.smartWallet.address,
        strategyId: strategy.id
      });

      // Remove strategy from local state
      setStrategies(prev => prev.filter(s => s.id !== strategy.id));
      toast.success(`Strategy "${strategy.name}" deleted successfully`);
    } catch (error) {
      console.error("Error deleting strategy:", error);
      toast.error("Failed to delete strategy");
    }
  };

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-16 w-full">
        <h3 className="text-lg font-medium text-gray-600 mb-2">
          Connect Your Wallet
        </h3>
        <p className="text-sm text-gray-500">
          Please connect your wallet to view your saved strategies
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5F79F1]"></div>
        <p className="text-sm text-gray-500 mt-2">Loading your strategies...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 w-full">
        <h3 className="text-lg font-medium text-red-600 mb-2">Error</h3>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <button
          onClick={fetchStrategies}
          className="px-4 py-2 bg-[#5F79F1] text-white rounded-lg hover:bg-[#4A64DC] transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (strategies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 w-full">
        <h3 className="text-lg font-medium text-gray-600 mb-2">
          No Saved Strategies
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          You haven&apos;t saved any strategies yet. Chat with the AI to get strategy recommendations and save them!
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          Your Saved Strategies ({strategies.length})
        </h2>
        <QuickTooltip text="Refresh the list to load any newly saved strategies">
          <button
            onClick={fetchStrategies}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            Refresh
          </button>
        </QuickTooltip>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {strategies.map((strategy, index) => (
          <SavedStrategyCard 
            key={index} 
            strategy={strategy} 
            onDelete={handleDeleteStrategy}
          />
        ))}
      </div>
    </div>
  );
}