import { useMutation } from "@tanstack/react-query";
import { formatUnits } from "viem";
import axios from "axios";

import { usePolkadotWallet } from "@/components/PolkadotWallet/PolkadotWalletProvider";
import { Token } from "@/types";
import { Strategy } from "@/types/strategies";

type PolkadotInvestParams = {
  strategyId: Strategy;
  amount: bigint;
  token: Token;
};

const STRATEGY_ID_MAPPING: Record<string, number> = {
  "AcalaLiquidStaking": 1,
  "AcalaLending": 2,
  "BifrostLiquidStaking": 3,
  "HydraDXLiquidity": 4,
};

export function usePolkadotStrategy() {
  const { account, selectedChain, signTransaction } = usePolkadotWallet();

  const invest = useMutation({
    mutationFn: async ({ strategyId, amount, token }: PolkadotInvestParams) => {
      if (!account) throw new Error("Polkadot wallet not connected");

      // For now, this is a mock implementation
      // In a real scenario, you would:
      // 1. Create the transaction for the specific Polkadot strategy
      // 2. Sign it with the Polkadot wallet
      // 3. Submit it to the network
      
      const amountFormatted = Number(formatUnits(amount, token.decimals));
      
      try {
        // Mock transaction signing
        await signTransaction("mock_transaction_data");
        
        // Map strategy name to numeric ID
        const numericStrategyId = STRATEGY_ID_MAPPING[strategyId];
        if (!numericStrategyId) {
          throw new Error(`Unknown strategy: ${strategyId}`);
        }

        // Call backend to record the investment
        await axios.post(
          `${process.env.NEXT_PUBLIC_SHUTTLE_API_URL}/contract/invest`,
          {
            user_address: account.address,
            strategy_id: numericStrategyId,
            amount: amountFormatted,
            token_name: token.name,
            chain_id: selectedChain.id,
            chain_name: selectedChain.name,
            rpc_url: selectedChain.rpcUrl,
          }
        );

        // Mock transaction hash for now
        const mockTxHash = `0x${Math.random().toString(16).substring(2, 66)}`;
        
        return mockTxHash;
      } catch (error) {
        console.error("Polkadot investment failed:", error);
        throw new Error("Investment transaction failed");
      }
    },
  });

  return {
    invest,
  };
}