import axios from "axios";

import {
  COINGECKO_IDS,
  getTokenAddress,
  getTokenNameByCoingeckoId,
  isCoingeckoId,
} from "@/utils/coins";
import { Token } from "@/types";
import { base } from "viem/chains";
import { Address } from "viem";
import { getBalance } from "@wagmi/core";
import { wagmiConfig as config } from "@/providers/config";



type TokenPriceResponse = {
  [key: string]: {
    usd: number;
  };
};

export async function fetchTokenBalance(
  token: Token,
  user: Address,
  chainId: number = base.id
) {
  const tokenAddr = getTokenAddress(token, chainId);
  const params = {
    address: user,
    ...(token.isNativeToken ? {} : { token: tokenAddr }),
  };

  const balance = await getBalance(config, params);
  return balance;
}

export async function fetchTokensPrices(tokens: Token[]) {
  const ids: string[] = [];
  const supportedTokens: Token[] = [];
  
  for (const t of tokens) {
    if (isCoingeckoId(t.name)) {
      ids.push(COINGECKO_IDS[t.name]);
      supportedTokens.push(t);
    } else {
      console.warn(`Token ${t.name} is not supported by Coingecko, skipping...`);
    }
  }

  if (ids.length === 0) {
    console.warn("No supported tokens for price fetching");
    return {};
  }

  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price",
      {
        params: {
          ids: ids.join(","),
          vs_currencies: "usd",
        },
      }
    );

    const prices = response.data as TokenPriceResponse;

    const res = Object.entries(prices).reduce((acc, [id, price]) => {
      const tokenName = getTokenNameByCoingeckoId(id);
      if (tokenName) {
        acc[tokenName] = price.usd;
      }
      return acc;
    }, {} as Record<string, number>);

    console.log("Fetched prices:", res);
    return res;
  } catch (error) {
    console.error("Failed to fetch token prices:", error);
    return {};
  }
}
