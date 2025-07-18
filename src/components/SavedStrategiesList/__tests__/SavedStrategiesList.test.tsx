import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { usePrivy } from '@privy-io/react-auth'
import { loadStrategies, deleteStrategy, updateStrategy } from '@/utils/strategyApi'
import SavedStrategiesList from '../index'

// Mock dependencies
vi.mock('@privy-io/react-auth')
vi.mock('@/utils/strategyApi')
vi.mock('@/utils/toast', () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const mockUsePrivy = vi.mocked(usePrivy)
const mockLoadStrategies = vi.mocked(loadStrategies)
const mockDeleteStrategy = vi.mocked(deleteStrategy)
const mockUpdateStrategy = vi.mocked(updateStrategy)

const mockStrategies = [
  {
    name: 'Strategy 1/1/2024',
    risk_level: 3,
    parameters: 'Conservative DeFi strategy with staking and LP tokens',
  },
  {
    name: 'Strategy 1/2/2024',
    risk_level: 7,
    parameters: 'Aggressive yield farming strategy with high APY targets',
  },
]

describe('SavedStrategiesList Display Strategy History', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display wallet connection prompt when user is not authenticated', () => {
    mockUsePrivy.mockReturnValue({
      authenticated: false,
      user: null,
    } as any)

    render(<SavedStrategiesList />)
    
    expect(screen.getByText('Connect Your Wallet')).toBeInTheDocument()
    expect(screen.getByText('Please connect your wallet to view your saved strategies')).toBeInTheDocument()
  })

  it('should display loading state while fetching strategies', () => {
    mockUsePrivy.mockReturnValue({
      authenticated: true,
      user: {
        smartWallet: {
          address: '0x123456789',
        },
      },
    } as any)

    // Mock a promise that doesn't resolve immediately
    mockLoadStrategies.mockReturnValue(new Promise(() => {}))

    render(<SavedStrategiesList />)
    
    expect(screen.getByText('Loading your strategies...')).toBeInTheDocument()
    expect(screen.getByText('Loading your strategies...')).toBeInTheDocument()
  })

  it('should display strategy history list when strategies are loaded from backend', async () => {
    mockUsePrivy.mockReturnValue({
      authenticated: true,
      user: {
        smartWallet: {
          address: '0x123456789',
        },
      },
    } as any)

    mockLoadStrategies.mockResolvedValue(mockStrategies)

    render(<SavedStrategiesList />)
    
    await waitFor(() => {
      expect(screen.getByText('Your Saved Strategies (2)')).toBeInTheDocument()
    })

    // Check that strategies are displayed
    expect(screen.getByText('Strategy 1/1/2024')).toBeInTheDocument()
    expect(screen.getByText('Strategy 1/2/2024')).toBeInTheDocument()
    
    // Check risk levels
    expect(screen.getByText('Low Risk')).toBeInTheDocument()
    expect(screen.getByText('High Risk')).toBeInTheDocument()
    
    // Check parameters
    expect(screen.getByText('Conservative DeFi strategy with staking and LP tokens')).toBeInTheDocument()
    expect(screen.getByText('Aggressive yield farming strategy with high APY targets')).toBeInTheDocument()
  })

  it('should display empty state when no strategies are found', async () => {
    mockUsePrivy.mockReturnValue({
      authenticated: true,
      user: {
        smartWallet: {
          address: '0x123456789',
        },
      },
    } as any)

    mockLoadStrategies.mockResolvedValue([])

    render(<SavedStrategiesList />)
    
    await waitFor(() => {
      expect(screen.getByText('No Saved Strategies')).toBeInTheDocument()
    })

    expect(screen.getByText('You haven\'t saved any strategies yet. Chat with the AI to get strategy recommendations and save them!')).toBeInTheDocument()
  })

  it('should display error state when loading strategies fails', async () => {
    mockUsePrivy.mockReturnValue({
      authenticated: true,
      user: {
        smartWallet: {
          address: '0x123456789',
        },
      },
    } as any)

    mockLoadStrategies.mockRejectedValue(new Error('Network error'))

    render(<SavedStrategiesList />)
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument()
    })

    expect(screen.getByText('Failed to load strategies')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument()
  })

  it('should call loadStrategies API with correct account when component mounts', async () => {
    const userAddress = '0x123456789'
    mockUsePrivy.mockReturnValue({
      authenticated: true,
      user: {
        smartWallet: {
          address: userAddress,
        },
      },
    } as any)

    mockLoadStrategies.mockResolvedValue([])

    render(<SavedStrategiesList />)
    
    await waitFor(() => {
      expect(mockLoadStrategies).toHaveBeenCalledWith(userAddress)
    })
  })

  it('should refresh strategies when refresh button is clicked', async () => {
    mockUsePrivy.mockReturnValue({
      authenticated: true,
      user: {
        smartWallet: {
          address: '0x123456789',
        },
      },
    } as any)

    mockLoadStrategies.mockResolvedValue(mockStrategies)

    render(<SavedStrategiesList />)
    
    await waitFor(() => {
      expect(screen.getByText('Your Saved Strategies (2)')).toBeInTheDocument()
    })

    const refreshButton = screen.getByRole('button', { name: 'Refresh' })
    fireEvent.click(refreshButton)

    await waitFor(() => {
      expect(mockLoadStrategies).toHaveBeenCalledTimes(2)
    })
  })

  it('should retry loading strategies when try again button is clicked after error', async () => {
    mockUsePrivy.mockReturnValue({
      authenticated: true,
      user: {
        smartWallet: {
          address: '0x123456789',
        },
      },
    } as any)

    mockLoadStrategies.mockRejectedValueOnce(new Error('Network error'))
    mockLoadStrategies.mockResolvedValueOnce([])

    render(<SavedStrategiesList />)
    
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument()
    })

    const tryAgainButton = screen.getByRole('button', { name: 'Try Again' })
    fireEvent.click(tryAgainButton)

    await waitFor(() => {
      expect(screen.getByText('No Saved Strategies')).toBeInTheDocument()
    })

    expect(mockLoadStrategies).toHaveBeenCalledTimes(2)
  })

  describe('Delete Strategy Functionality', () => {
    it('should call deleteStrategy API when delete button is clicked', async () => {
      mockUsePrivy.mockReturnValue({
        authenticated: true,
        user: {
          smartWallet: {
            address: '0x123456789',
          },
        },
      } as any)

      const strategiesWithId = [
        {
          id: 'strategy-1',
          name: 'Strategy 1/1/2024',
          risk_level: 3,
          parameters: 'Conservative DeFi strategy with staking and LP tokens',
        },
        {
          id: 'strategy-2',
          name: 'Strategy 1/2/2024',
          risk_level: 7,
          parameters: 'Aggressive yield farming strategy with high APY targets',
        },
      ]

      mockLoadStrategies.mockResolvedValue(strategiesWithId)
      mockDeleteStrategy.mockResolvedValue({ success: true, message: 'Strategy deleted' })

      render(<SavedStrategiesList />)
      
      await waitFor(() => {
        expect(screen.getByText('Your Saved Strategies (2)')).toBeInTheDocument()
      })

      // Find and click the first delete button
      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      fireEvent.click(deleteButtons[0])

      await waitFor(() => {
        expect(mockDeleteStrategy).toHaveBeenCalledWith({
          account: '0x123456789',
          strategyId: 'strategy-1'
        })
      })
    })

    it('should remove strategy from list after successful deletion', async () => {
      mockUsePrivy.mockReturnValue({
        authenticated: true,
        user: {
          smartWallet: {
            address: '0x123456789',
          },
        },
      } as any)

      const strategiesWithId = [
        {
          id: 'strategy-1',
          name: 'Strategy 1/1/2024',
          risk_level: 3,
          parameters: 'Conservative DeFi strategy with staking and LP tokens',
        },
      ]

      mockLoadStrategies.mockResolvedValue(strategiesWithId)
      mockDeleteStrategy.mockResolvedValue({ success: true, message: 'Strategy deleted' })

      render(<SavedStrategiesList />)
      
      await waitFor(() => {
        expect(screen.getByText('Strategy 1/1/2024')).toBeInTheDocument()
      })

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      fireEvent.click(deleteButton)

      // After deletion, strategy should be removed from list
      await waitFor(() => {
        expect(screen.queryByText('Strategy 1/1/2024')).not.toBeInTheDocument()
      })
    })

    it('should show error message when delete fails', async () => {
      mockUsePrivy.mockReturnValue({
        authenticated: true,
        user: {
          smartWallet: {
            address: '0x123456789',
          },
        },
      } as any)

      const strategiesWithId = [
        {
          id: 'strategy-1',
          name: 'Strategy 1/1/2024',
          risk_level: 3,
          parameters: 'Conservative DeFi strategy with staking and LP tokens',
        },
      ]

      mockLoadStrategies.mockResolvedValue(strategiesWithId)
      mockDeleteStrategy.mockRejectedValue(new Error('Delete failed'))

      render(<SavedStrategiesList />)
      
      await waitFor(() => {
        expect(screen.getByText('Strategy 1/1/2024')).toBeInTheDocument()
      })

      // Click delete button
      const deleteButton = screen.getByRole('button', { name: /delete/i })
      fireEvent.click(deleteButton)

      // Strategy should still be in the list after failed deletion
      await waitFor(() => {
        expect(screen.getByText('Strategy 1/1/2024')).toBeInTheDocument()
      })
    })
  })
})