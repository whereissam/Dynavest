import { useQuery } from "@tanstack/react-query";
import { fetchTokenPriceWithCache } from "@/utils/chainlinkPrices";

/**
 * Hook to fetch individual token price with cache
 * More reliable than batch price fetching for single tokens
 */
export default function useTokenPrice(tokenName: string) {
  return useQuery({
    queryKey: ["tokenPrice", tokenName],
    queryFn: () => fetchTokenPriceWithCache(tokenName),
    enabled: !!tokenName,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    placeholderData: 0,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}