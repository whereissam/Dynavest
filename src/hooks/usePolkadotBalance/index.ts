import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePolkadotWallet } from "@/components/PolkadotWallet/PolkadotWalletProvider";
import { Token } from "@/types";

/**
 * Hook to fetch Polkadot token balances
 * @param token - The token to fetch balance for
 * @returns balance information
 */
export default function usePolkadotBalance(token: Token) {
  const { account, isConnected } = usePolkadotWallet();

  // Fetch balance function for Polkadot chains
  const fetchPolkadotBalance = useCallback(async () => {
    if (!account || !isConnected) return BigInt(0);

    try {
      // Dynamic import to avoid SSR issues
      const { ApiPromise, WsProvider } = await import('@polkadot/api');
      
      // Connect to Polkadot node
      const wsProvider = new WsProvider('wss://polkadot-rpc.dwellir.com');
      const api = await ApiPromise.create({ provider: wsProvider });
      
      // Get account info
      const { data: balance } = await api.query.system.account(account.address);
      
      await api.disconnect();
      
      // Return free balance (available balance)
      return BigInt(balance.free.toString());
    } catch (error) {
      console.error('Failed to fetch Polkadot balance:', error);
      return BigInt(0);
    }
  }, [account, isConnected]);

  // Use React Query for fetching and caching the balance
  const {
    data: balance = BigInt(0),
    isLoading: isLoadingBalance,
    refetch,
    isError,
    error,
  } = useQuery({
    queryKey: ["polkadotBalance", account?.address, token.name],
    queryFn: fetchPolkadotBalance,
    enabled: !!account && isConnected,
    staleTime: 30 * 1000, // Consider data stale after 30 seconds
    placeholderData: BigInt(0),
  });

  return {
    refetch,
    balance,
    isError,
    error,
    isLoadingBalance,
  };
}