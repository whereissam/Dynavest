import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ContractInteractionForm } from '../ContractInteractionForm'
import { PolkadotWalletProvider } from '../../PolkadotWallet/PolkadotWalletProvider'
import { ContractService } from '../../../services/ContractService'

// Mock ContractService
vi.mock('../../../services/ContractService')
const mockContractService = vi.mocked(ContractService)

// Mock Polkadot extension
vi.mock('@polkadot/extension-dapp', () => ({
  web3Accounts: vi.fn(),
  web3Enable: vi.fn(),
  web3FromAddress: vi.fn()
}))

const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return (
    <QueryClientProvider client={queryClient}>
      <PolkadotWalletProvider>
        {children}
      </PolkadotWalletProvider>
    </QueryClientProvider>
  )
}

describe('ContractInteractionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('strategy creation', () => {
    it('should create strategy on ink! contract using connected Polkadot wallet', async () => {
      const mockStrategy = {
        name: 'DeFi Strategy',
        risk_level: 5,
        parameters: '{"protocol": "polkadot-staking"}',
        initial_investment: 1000
      }

      const mockCreateResponse = {
        success: true,
        data: { strategy_id: 42 },
        error: null
      }

      mockContractService.prototype.createStrategyOnChain.mockResolvedValue(mockCreateResponse)

      // Mock connected wallet
      const { web3Enable, web3Accounts } = await import('@polkadot/extension-dapp')
      vi.mocked(web3Enable).mockResolvedValue([{ name: 'polkadot-js', version: '0.44.1' }])
      vi.mocked(web3Accounts).mockResolvedValue([
        { address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', meta: { name: 'Alice' } }
      ])

      render(<ContractInteractionForm />, { wrapper })

      // Connect wallet first
      fireEvent.click(screen.getByTestId('connect-wallet-button'))
      await waitFor(() => {
        expect(screen.getByTestId('wallet-status')).toHaveTextContent('connected')
      })

      // Fill strategy form
      fireEvent.change(screen.getByTestId('strategy-name-input'), {
        target: { value: mockStrategy.name }
      })
      fireEvent.change(screen.getByTestId('risk-level-input'), {
        target: { value: mockStrategy.risk_level.toString() }
      })
      fireEvent.change(screen.getByTestId('investment-amount-input'), {
        target: { value: mockStrategy.initial_investment?.toString() }
      })

      // Submit strategy creation
      fireEvent.click(screen.getByTestId('create-strategy-button'))

      await waitFor(() => {
        expect(mockContractService.prototype.createStrategyOnChain).toHaveBeenCalledWith({
          name: mockStrategy.name,
          risk_level: mockStrategy.risk_level,
          parameters: expect.any(String),
          initial_investment: mockStrategy.initial_investment
        })
      })

      // Verify success feedback
      await waitFor(() => {
        expect(screen.getByTestId('success-message')).toHaveTextContent('Strategy created successfully on chain')
      })
    })

    it('should handle strategy creation errors gracefully', async () => {
      const mockError = new Error('Contract call failed')
      mockContractService.prototype.createStrategyOnChain.mockRejectedValue(mockError)

      const { web3Enable, web3Accounts } = await import('@polkadot/extension-dapp')
      vi.mocked(web3Enable).mockResolvedValue([{ name: 'polkadot-js', version: '0.44.1' }])
      vi.mocked(web3Accounts).mockResolvedValue([
        { address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', meta: { name: 'Alice' } }
      ])

      render(<ContractInteractionForm />, { wrapper })

      // Connect wallet and fill form
      fireEvent.click(screen.getByTestId('connect-wallet-button'))
      await waitFor(() => screen.getByTestId('create-strategy-button'))

      fireEvent.change(screen.getByTestId('strategy-name-input'), {
        target: { value: 'Test Strategy' }
      })
      fireEvent.click(screen.getByTestId('create-strategy-button'))

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Contract call failed')
      })
    })
  })

  describe('investment flow', () => {
    it('should invest in strategy using Polkadot wallet', async () => {
      const mockInvestmentData = {
        strategy_id: 42,
        amount: 500
      }

      const mockInvestResponse = {
        success: true,
        data: { transaction_hash: '0xabc123' },
        error: null
      }

      mockContractService.prototype.investInStrategy.mockResolvedValue(mockInvestResponse)

      const { web3Enable, web3Accounts } = await import('@polkadot/extension-dapp')
      vi.mocked(web3Enable).mockResolvedValue([{ name: 'polkadot-js', version: '0.44.1' }])
      vi.mocked(web3Accounts).mockResolvedValue([
        { address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', meta: { name: 'Alice' } }
      ])

      render(<ContractInteractionForm />, { wrapper })

      // Connect wallet
      fireEvent.click(screen.getByTestId('connect-wallet-button'))
      await waitFor(() => screen.getByTestId('investment-section'))

      // Fill investment form
      fireEvent.change(screen.getByTestId('strategy-id-input'), {
        target: { value: mockInvestmentData.strategy_id.toString() }
      })
      fireEvent.change(screen.getByTestId('investment-amount-input'), {
        target: { value: mockInvestmentData.amount.toString() }
      })

      // Submit investment
      fireEvent.click(screen.getByTestId('invest-button'))

      await waitFor(() => {
        expect(mockContractService.prototype.investInStrategy).toHaveBeenCalledWith(mockInvestmentData)
      })

      await waitFor(() => {
        expect(screen.getByTestId('success-message')).toHaveTextContent('Investment successful')
      })
    })
  })

  describe('wallet integration', () => {
    it('should require wallet connection before allowing contract interactions', async () => {
      render(<ContractInteractionForm />, { wrapper })

      // Strategy creation should be disabled without wallet
      expect(screen.getByTestId('create-strategy-button')).toBeDisabled()
      expect(screen.getByTestId('invest-button')).toBeDisabled()

      // Show connection prompt
      expect(screen.getByTestId('wallet-prompt')).toHaveTextContent('Connect your Polkadot wallet to interact with contracts')
    })
  })
})