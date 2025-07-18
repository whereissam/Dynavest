import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ChatProvider, useChat } from '../ChatContext'
import { DynaVestService } from '../../services/DynaVestService'

// Mock DynaVestService
vi.mock('../../services/DynaVestService')
const mockDynaVestService = vi.mocked(DynaVestService)

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return (
    <QueryClientProvider client={queryClient}>
      <ChatProvider>{children}</ChatProvider>
    </QueryClientProvider>
  )
}

describe('ChatContext with DynaVestService integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('sendMessage', () => {
    it('should integrate with DynaVestService and return proper BotResponse', async () => {
      const mockDefiResponse = {
        response_type: 'defi_strategy',
        data: { message: 'AI generated strategy' },
        strategy_data: {
          name: 'Conservative DeFi',
          risk_level: 'low',
          chain: 'polkadot',
          parameters: {},
          protocols: ['staking'],
          recommended_action: 'invest'
        }
      }

      mockDynaVestService.prototype.getDefiRecommendations.mockResolvedValue(mockDefiResponse)

      const { result } = renderHook(() => useChat(), { wrapper })

      await act(async () => {
        const response = await result.current.sendMessage.mutateAsync('I want safe investments')
        
        expect(response.type).toBe('strategies')
        expect(response.data.answer).toContain('Conservative DeFi')
        expect(response.data.risk_level).toBe('low')
      })

      expect(mockDynaVestService.prototype.getDefiRecommendations).toHaveBeenCalledWith(
        'I want safe investments'
      )
    })
  })
})