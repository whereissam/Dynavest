import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";

import { Token } from "@/types";
import { fetchTokensPrices } from "../../hooks/useBalance/utils";
import { usePolkadotWallet } from "@/components/PolkadotWallet/PolkadotWalletProvider";

export function useBatchTokenPrices(tokens: Token[]) {
  const account = useAccount();
  const { isConnected: polkadotConnected } = usePolkadotWallet();

  // Enable price fetching if either EVM wallet is connected OR Polkadot wallet is connected
  const isWalletConnected = !!account.chainId || polkadotConnected;

  return useQuery({
    queryKey: ["batchTokenPrices", tokens.map((t) => t.name).sort()], // 排序確保 key 一致性
    queryFn: () => fetchTokensPrices(tokens),
    enabled: tokens.length > 0 && isWalletConnected,
    placeholderData: {},

    // Set throwOnError to false to avoid throwing error when fetching prices
    throwOnError: (error) => {
      console.error("BatchTokenPrices", error);
      return false;
    },
  });
}
