import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { ContractService } from '../ContractService'

// Mock axios
vi.mock('axios')
const mockAxios = vi.mocked(axios)

describe('ContractService', () => {
  let contractService: ContractService

  beforeEach(() => {
    vi.clearAllMocks()
    contractService = new ContractService()
  })

  describe('createStrategyOnChain', () => {
    it('should create a strategy on the blockchain and return strategy ID', async () => {
      const mockResponse = {
        data: { strategy_id: 123, status: 'success' }
      }
      mockAxios.post.mockResolvedValue(mockResponse)

      const userAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'
      const strategyData = {
        name: 'Test Strategy',
        risk_level: 5,
        parameters: '{"protocol": "polkadot", "type": "staking"}',
        initial_investment: 1000000000000
      }

      const result = await contractService.createStrategyOnChain(userAddress, strategyData)

      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://shuttle-api.dynavest.app/contract/strategy',
        {
          user_address: userAddress,
          ...strategyData
        }
      )
      expect(result).toBe(123)
    })

    it('should throw error when strategy creation fails', async () => {
      mockAxios.post.mockRejectedValue(new Error('Contract creation failed'))

      const userAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'
      const strategyData = {
        name: 'Test Strategy',
        risk_level: 5,
        parameters: '{"protocol": "polkadot"}',
        initial_investment: 1000000000000
      }

      await expect(contractService.createStrategyOnChain(userAddress, strategyData)).rejects.toThrow('Contract creation failed')
    })
  })

  describe('getUserContractStrategies', () => {
    it('should get user strategies from contract', async () => {
      const mockResponse = {
        data: {
          strategies: [
            {
              id: 1,
              name: 'Polkadot Yield Farming',
              creator: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
              risk_level: 5,
              parameters: '{"protocol": "polkadot", "type": "yield_farming"}',
              balance: 1000000000000,
              is_active: true
            }
          ]
        }
      }
      mockAxios.get.mockResolvedValue(mockResponse)

      const userAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'
      const result = await contractService.getUserContractStrategies(userAddress)

      expect(mockAxios.get).toHaveBeenCalledWith(
        `https://shuttle-api.dynavest.app/contract/strategies/${userAddress}`
      )
      expect(result).toEqual(mockResponse.data.strategies)
    })

    it('should throw error when getting strategies fails', async () => {
      mockAxios.get.mockRejectedValue(new Error('Failed to get strategies'))

      const userAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'

      await expect(contractService.getUserContractStrategies(userAddress)).rejects.toThrow('Failed to get strategies')
    })
  })

  describe('investInStrategy', () => {
    it('should invest in a strategy and return transaction hash', async () => {
      const mockResponse = {
        data: { transaction_hash: '0x123abc456def', status: 'success' }
      }
      mockAxios.post.mockResolvedValue(mockResponse)

      const userAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'
      const investmentData = {
        strategy_id: 1,
        amount: 500000000000
      }

      const result = await contractService.investInStrategy(userAddress, investmentData)

      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://shuttle-api.dynavest.app/contract/invest',
        {
          user_address: userAddress,
          ...investmentData
        }
      )
      expect(result).toBe('0x123abc456def')
    })

    it('should throw error when investment fails', async () => {
      mockAxios.post.mockRejectedValue(new Error('Investment failed'))

      const userAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'
      const investmentData = {
        strategy_id: 1,
        amount: 500000000000
      }

      await expect(contractService.investInStrategy(userAddress, investmentData)).rejects.toThrow('Investment failed')
    })
  })

  describe('getPortfolioAnalysis', () => {
    it('should get portfolio analysis with enhanced data models', async () => {
      const mockResponse = {
        data: {
          total_value: 5000000000000,
          strategies: [
            {
              id: 1,
              name: 'Polkadot Yield Farming',
              risk_level: 5,
              balance: 1000000000000,
              performance: {
                apy: 8.5,
                daily_change: 0.02,
                total_return: 0.15
              },
              is_active: true
            }
          ],
          risk_distribution: {
            low: 20,
            medium: 60,
            high: 20
          },
          performance_metrics: {
            total_apy: 10.2,
            sharpe_ratio: 1.8,
            max_drawdown: 0.05
          }
        }
      }
      mockAxios.get.mockResolvedValue(mockResponse)

      const userAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'
      const result = await contractService.getPortfolioAnalysis(userAddress)

      expect(mockAxios.get).toHaveBeenCalledWith(
        `https://shuttle-api.dynavest.app/portfolio/analysis/${userAddress}`
      )
      expect(result.total_value).toBe(5000000000000)
      expect(result.strategies).toHaveLength(1)
      expect(result.strategies[0].performance.apy).toBe(8.5)
      expect(result.risk_distribution.medium).toBe(60)
      expect(result.performance_metrics.sharpe_ratio).toBe(1.8)
    })

    it('should throw error when portfolio analysis fails', async () => {
      mockAxios.get.mockRejectedValue(new Error('Portfolio analysis failed'))

      const userAddress = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY'

      await expect(contractService.getPortfolioAnalysis(userAddress)).rejects.toThrow('Portfolio analysis failed')
    })
  })
})