import axios from 'axios'

const SHUTTLE_API_BASE_URL = process.env.NEXT_PUBLIC_SHUTTLE_API_URL || 'http://localhost:8000'

export interface ContractStrategyData {
  name: string
  risk_level: number
  parameters: string
  initial_investment?: number
}

export interface ContractStrategy {
  id: number
  name: string
  creator: string
  risk_level: number
  parameters: string
  balance: number
  is_active: boolean
}

export interface InvestmentData {
  strategy_id: number
  amount: number
}

export interface StrategyPerformance {
  apy: number
  daily_change: number
  total_return: number
}

export interface EnhancedStrategy extends ContractStrategy {
  performance: StrategyPerformance
}

export interface RiskDistribution {
  low: number
  medium: number
  high: number
}

export interface PerformanceMetrics {
  total_apy: number
  sharpe_ratio: number
  max_drawdown: number
}

export interface PortfolioAnalysis {
  total_value: number
  strategies: EnhancedStrategy[]
  risk_distribution: RiskDistribution
  performance_metrics: PerformanceMetrics
}

export class ContractService {
  async createStrategyOnChain(userAddress: string, strategyData: ContractStrategyData): Promise<number> {
    try {
      const response = await axios.post(`${SHUTTLE_API_BASE_URL}/contract/strategy`, {
        user_address: userAddress,
        ...strategyData
      })
      return response.data.strategy_id
    } catch (error) {
      console.error('Error creating strategy on chain:', error)
      throw error
    }
  }

  async getUserContractStrategies(userAddress: string): Promise<ContractStrategy[]> {
    try {
      const response = await axios.get(`${SHUTTLE_API_BASE_URL}/contract/strategies/${userAddress}`)
      return response.data.strategies
    } catch (error) {
      console.error('Error getting user contract strategies:', error)
      throw error
    }
  }

  async investInStrategy(userAddress: string, investmentData: InvestmentData): Promise<string> {
    try {
      const response = await axios.post(`${SHUTTLE_API_BASE_URL}/contract/invest`, {
        user_address: userAddress,
        ...investmentData
      })
      return response.data.transaction_hash
    } catch (error) {
      console.error('Error investing in strategy:', error)
      throw error
    }
  }

  async getPortfolioAnalysis(userAddress: string): Promise<PortfolioAnalysis> {
    try {
      const response = await axios.get(`${SHUTTLE_API_BASE_URL}/portfolio/analysis/${userAddress}`)
      return response.data
    } catch (error) {
      console.error('Error getting portfolio analysis:', error)
      throw error
    }
  }
}