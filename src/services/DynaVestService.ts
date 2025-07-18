import axios from 'axios'

const SHUTTLE_API_BASE_URL = process.env.NEXT_PUBLIC_SHUTTLE_API_URL || 'http://localhost:8000'

export interface DefiResponse {
  response_type: string
  data: any
  strategy_data?: StrategyData
}

export interface StrategyData {
  name: string
  risk_level: string
  chain: string
  parameters: any
  recommended_amount?: number
  protocols: string[]
  recommended_action?: string
}

export class DynaVestService {
  async getDefiRecommendations(input: string, userAddress?: string): Promise<DefiResponse> {
    try {
      const response = await axios.post(`${SHUTTLE_API_BASE_URL}/defiInfo`, {
        input_text: input,
        user_address: userAddress
      }, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const backendData = response.data?.data;
      
      return {
        response_type: backendData?.response_type || 'conversational',
        data: response.data,
        strategy_data: {
          name: backendData?.strategy_name || backendData?.answer || 'DeFi Strategy Recommendation',
          risk_level: backendData?.risk_level || 'moderate',
          chain: backendData?.chain || 'polkadot',
          parameters: backendData?.parameters || {},
          protocols: backendData?.protocols || [],
          recommended_action: backendData?.action || 'explore',
          recommended_amount: backendData?.amount || undefined
        }
      };
    } catch (error) {
      console.error('DynaVest Service Error:', error);
      
      // Return a friendly error response instead of crashing
      return {
        response_type: 'error',
        data: {
          data: {
            answer: "I'm having trouble accessing my advanced AI right now, but I can still help you with DeFi strategies! What are you interested in?"
          }
        },
        strategy_data: {
          name: 'Connection Error',
          risk_level: 'low',
          chain: 'polkadot',
          parameters: {},
          protocols: [],
          recommended_action: 'retry'
        }
      };
    }
  }
}