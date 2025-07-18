import axios from 'axios';

// Chainlink price feed addresses for different tokens
export const CHAINLINK_PRICE_FEEDS = {
  DOT: '0x1C07AFb8E2B827c5A4739C6d59C3b5FEc289c0df', // DOT/USD on Ethereum
  LDOT: '0x1C07AFb8E2B827c5A4739C6d59C3b5FEc289c0df', // Use DOT price
  vDOT: '0x1C07AFb8E2B827c5A4739C6d59C3b5FEc289c0df', // Use DOT price
  BTC: '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c',
  ETH: '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419',
  USDC: '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6',
  USDT: '0x3E7d1eAB13ad0104d2750B8863b489D65364e32D',
} as const;

// Alternative: Use CoinGecko API directly with proper error handling
export async function fetchTokenPriceFromCoinGecko(tokenId: string): Promise<number> {
  try {
    const response = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${tokenId}&vs_currencies=usd`,
      {
        timeout: 5000, // 5 second timeout
        headers: {
          'Accept': 'application/json',
        }
      }
    );
    
    const price = response.data?.[tokenId]?.usd;
    if (typeof price === 'number' && price > 0) {
      return price;
    }
    
    console.warn(`Invalid price received for ${tokenId}:`, price);
    return 0;
  } catch (error) {
    console.error(`Failed to fetch price for ${tokenId}:`, error);
    return 0;
  }
}

// Fallback price fetching with multiple sources
export async function fetchTokenPrice(tokenName: string): Promise<number> {
  const COINGECKO_IDS: Record<string, string> = {
    DOT: 'polkadot',
    LDOT: 'polkadot',
    vDOT: 'polkadot',
    ACA: 'acala-token',
    aUSD: 'acala-dollar',
    USDC: 'usd-coin',
    USDT: 'tether',
    ETH: 'ethereum',
    BTC: 'bitcoin',
    BNB: 'binancecoin',
  };

  const coingeckoId = COINGECKO_IDS[tokenName];
  if (!coingeckoId) {
    console.warn(`No CoinGecko ID found for token: ${tokenName}`);
    return 0;
  }

  // Try CoinGecko first
  const price = await fetchTokenPriceFromCoinGecko(coingeckoId);
  
  // TODO: Add Chainlink as fallback
  // if (price === 0 && CHAINLINK_PRICE_FEEDS[tokenName]) {
  //   return fetchTokenPriceFromChainlink(CHAINLINK_PRICE_FEEDS[tokenName]);
  // }
  
  return price;
}

// Simple price cache to avoid too many API calls
const priceCache = new Map<string, { price: number; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

export async function fetchTokenPriceWithCache(tokenName: string): Promise<number> {
  const cached = priceCache.get(tokenName);
  const now = Date.now();
  
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.price;
  }
  
  const price = await fetchTokenPrice(tokenName);
  priceCache.set(tokenName, { price, timestamp: now });
  
  return price;
}