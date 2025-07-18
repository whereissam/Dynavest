import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { saveStrategy, loadStrategies, updateStrategy, deleteStrategy } from '../strategyApi'

// Mock axios
vi.mock('axios')
const mockAxios = vi.mocked(axios)

describe('Strategy API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('saveStrategy', () => {
    it('should call POST endpoint with strategy data', async () => {
      const mockResponse = {
        data: { success: true, message: 'Strategy saved successfully' }
      }
      mockAxios.post.mockResolvedValue(mockResponse)

      const strategyInput = {
        account: '0x123456789',
        strategy: {
          name: 'Test Strategy',
          risk_level: 5,
          parameters: 'Test parameters'
        }
      }

      const result = await saveStrategy(strategyInput)

      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://shuttle-api.dynavest.app/strategies',
        strategyInput
      )
      expect(result).toEqual({ success: true, message: 'Strategy saved successfully' })
    })

    it('should throw error when save fails', async () => {
      mockAxios.post.mockRejectedValue(new Error('Save failed'))

      const strategyInput = {
        account: '0x123456789',
        strategy: {
          name: 'Test Strategy',
          risk_level: 5,
          parameters: 'Test parameters'
        }
      }

      await expect(saveStrategy(strategyInput)).rejects.toThrow('Save failed')
    })
  })

  describe('loadStrategies', () => {
    it('should call GET endpoint and return strategies', async () => {
      const mockStrategies = [
        {
          id: '1',
          name: 'Strategy 1',
          risk_level: 5,
          parameters: 'Parameters 1'
        },
        {
          id: '2',
          name: 'Strategy 2',
          risk_level: 7,
          parameters: 'Parameters 2'
        }
      ]
      const mockResponse = { data: mockStrategies }
      mockAxios.get.mockResolvedValue(mockResponse)

      const account = '0x123456789'
      const result = await loadStrategies(account)

      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://shuttle-api.dynavest.app/strategies/0x123456789'
      )
      expect(result).toEqual(mockStrategies)
    })

    it('should throw error when load fails', async () => {
      mockAxios.get.mockRejectedValue(new Error('Load failed'))

      const account = '0x123456789'

      await expect(loadStrategies(account)).rejects.toThrow('Load failed')
    })
  })

  describe('updateStrategy', () => {
    it('should call PUT endpoint with strategy data', async () => {
      const mockResponse = {
        data: { success: true, message: 'Strategy updated successfully' }
      }
      mockAxios.put.mockResolvedValue(mockResponse)

      const strategyInput = {
        account: '0x123456789',
        strategyId: 'strategy-1',
        strategy: {
          name: 'Updated Strategy',
          risk_level: 6,
          parameters: 'Updated parameters'
        }
      }

      const result = await updateStrategy(strategyInput)

      expect(mockAxios.put).toHaveBeenCalledWith(
        'https://shuttle-api.dynavest.app/strategies/strategy-1',
        {
          account: strategyInput.account,
          strategy_id: strategyInput.strategyId,
          strategy: strategyInput.strategy
        }
      )
      expect(result).toEqual({ success: true, message: 'Strategy updated successfully' })
    })

    it('should throw error when update fails', async () => {
      mockAxios.put.mockRejectedValue(new Error('Update failed'))

      const strategyInput = {
        account: '0x123456789',
        strategyId: 'strategy-1',
        strategy: {
          name: 'Updated Strategy',
          risk_level: 6,
          parameters: 'Updated parameters'
        }
      }

      await expect(updateStrategy(strategyInput)).rejects.toThrow('Update failed')
    })
  })

  describe('deleteStrategy', () => {
    it('should call DELETE endpoint with strategy ID', async () => {
      const mockResponse = {
        data: { success: true, message: 'Strategy deleted successfully' }
      }
      mockAxios.delete.mockResolvedValue(mockResponse)

      const deleteInput = {
        account: '0x123456789',
        strategyId: 'strategy-1'
      }

      const result = await deleteStrategy(deleteInput)

      expect(mockAxios.delete).toHaveBeenCalledWith(
        'https://shuttle-api.dynavest.app/strategies/strategy-1',
        { 
          data: {
            account: deleteInput.account,
            strategy_id: deleteInput.strategyId
          }
        }
      )
      expect(result).toEqual({ success: true, message: 'Strategy deleted successfully' })
    })

    it('should throw error when delete fails', async () => {
      mockAxios.delete.mockRejectedValue(new Error('Delete failed'))

      const deleteInput = {
        account: '0x123456789',
        strategyId: 'strategy-1'
      }

      await expect(deleteStrategy(deleteInput)).rejects.toThrow('Delete failed')
    })
  })
})