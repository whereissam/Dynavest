import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ChatProvider } from '../../contexts/ChatContext'
import { PolkadotWalletProvider } from '../../components/PolkadotWallet/PolkadotWalletProvider'
import { ContractInteractionForm } from '../../components/ContractInteraction/ContractInteractionForm'
import { IntegratedDynaVest } from '../../components/IntegratedDynaVest'
import { DynaVestService } from '../../services/DynaVestService'
import { ContractService } from '../../services/ContractService'

// Mock all external dependencies
vi.mock('../../services/DynaVestService')
vi.mock('../../services/ContractService')
vi.mock('@polkadot/extension-dapp', () => ({
  web3Accounts: vi.fn(),
  web3Enable: vi.fn(),
  web3FromAddress: vi.fn()
}))

const mockDynaVestService = vi.mocked(DynaVestService)
const mockContractService = vi.mocked(ContractService)

// Complete integration wrapper with all providers
const IntegrationWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return (
    <QueryClientProvider client={queryClient}>
      <ChatProvider>
        <PolkadotWalletProvider>
          {children}
        </PolkadotWalletProvider>
      </ChatProvider>
    </QueryClientProvider>
  )
}

// Complete app component for end-to-end testing
const DynaVestApp = () => {
  return <IntegratedDynaVest />
}

describe('DynaVest End-to-End Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Complete User Journey: Chat → Wallet → Contract', () => {
    it('should complete full flow from AI recommendation to strategy creation on blockchain', async () => {
      // Mock 1: AI Chat Response
      const mockAIResponse = {
        response_type: 'defi_strategy',
        data: { message: 'AI recommendation processed' },
        strategy_data: {
          name: 'Conservative Polkadot Staking',
          risk_level: 'low',
          chain: 'polkadot',
          parameters: { protocol: 'polkadot-staking', apy: '12%' },
          protocols: ['staking'],
          recommended_action: 'create strategy'
        }
      }
      mockDynaVestService.prototype.getDefiRecommendations.mockResolvedValue(mockAIResponse)

      // Mock 2: Polkadot Wallet Connection
      const mockAccount = {
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        meta: { name: 'Alice' }
      }
      const { web3Enable, web3Accounts, web3FromAddress } = await import('@polkadot/extension-dapp')
      vi.mocked(web3Enable).mockResolvedValue([{ name: 'polkadot-js', version: '0.44.1' }])
      vi.mocked(web3Accounts).mockResolvedValue([mockAccount])
      vi.mocked(web3FromAddress).mockResolvedValue({
        signer: { signPayload: vi.fn().mockResolvedValue({ signature: '0x123abc' }) }
      })

      // Mock 3: Contract Strategy Creation
      const mockContractResponse = {
        success: true,
        data: { 
          strategy_id: 42,
          transaction_hash: '0xabc123def456',
          block_number: 12345
        },
        error: null
      }
      mockContractService.prototype.createStrategyOnChain.mockResolvedValue(mockContractResponse)

      // Render the complete app
      render(<DynaVestApp />, { wrapper: IntegrationWrapper })

      // Step 1: Verify app loads
      expect(screen.getByTestId('dynavest-app')).toBeInTheDocument()
      expect(screen.getByTestId('chat-section')).toBeInTheDocument()

      // Step 1.5: Get AI recommendation
      fireEvent.change(screen.getByTestId('chat-input'), {
        target: { value: 'I want a conservative investment strategy' }
      })
      fireEvent.click(screen.getByTestId('get-ai-recommendation'))

      await waitFor(() => {
        expect(screen.getByTestId('ai-recommendation')).toBeInTheDocument()
      })

      // Verify AI service was called
      expect(mockDynaVestService.prototype.getDefiRecommendations).toHaveBeenCalledWith(
        'I want a conservative investment strategy'
      )

      // Step 2: Connect Polkadot wallet
      fireEvent.click(screen.getByTestId('connect-wallet-button'))
      
      await waitFor(() => {
        expect(screen.getByTestId('wallet-status')).toHaveTextContent('connected')
      })

      // Verify wallet connection flow
      expect(web3Enable).toHaveBeenCalledWith('DynaVest')
      expect(web3Accounts).toHaveBeenCalled()

      // Step 3: Fill strategy creation form with AI recommendation data
      fireEvent.change(screen.getByTestId('strategy-name-input'), {
        target: { value: mockAIResponse.strategy_data.name }
      })
      fireEvent.change(screen.getByTestId('risk-level-input'), {
        target: { value: '3' } // Convert 'low' to numeric
      })
      fireEvent.change(screen.getByTestId('investment-amount-input'), {
        target: { value: '1000' }
      })

      // Step 4: Create strategy on blockchain
      fireEvent.click(screen.getByTestId('create-strategy-button'))

      // Verify contract interaction
      await waitFor(() => {
        expect(mockContractService.prototype.createStrategyOnChain).toHaveBeenCalledWith({
          name: mockAIResponse.strategy_data.name,
          risk_level: 3,
          parameters: expect.any(String),
          initial_investment: 1000
        })
      })

      // Step 5: Verify success feedback
      await waitFor(() => {
        expect(screen.getByTestId('success-message')).toHaveTextContent('Strategy created successfully on chain')
      })

      // Integration verification: All services worked together
      expect(mockDynaVestService.prototype.getDefiRecommendations).toHaveBeenCalled()
      expect(web3Enable).toHaveBeenCalled()
      expect(mockContractService.prototype.createStrategyOnChain).toHaveBeenCalled()
    })

    it('should handle integration errors gracefully across the complete flow', async () => {
      // Mock wallet connection failure
      const { web3Enable } = await import('@polkadot/extension-dapp')
      vi.mocked(web3Enable).mockResolvedValue([]) // No extensions available

      render(<DynaVestApp />, { wrapper: IntegrationWrapper })

      // Try to connect wallet
      fireEvent.click(screen.getByTestId('connect-wallet-button'))

      await waitFor(() => {
        expect(screen.getByTestId('wallet-status')).toHaveTextContent('disconnected')
      })

      // Verify contract interactions are disabled
      expect(screen.getByTestId('create-strategy-button')).toBeDisabled()
      expect(screen.getByTestId('invest-button')).toBeDisabled()
      expect(screen.getByTestId('wallet-prompt')).toHaveTextContent('Connect your Polkadot wallet to interact with contracts')
    })

    it('should handle contract creation failures with proper error feedback', async () => {
      // Setup successful wallet connection
      const mockAccount = {
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        meta: { name: 'Alice' }
      }
      const { web3Enable, web3Accounts } = await import('@polkadot/extension-dapp')
      vi.mocked(web3Enable).mockResolvedValue([{ name: 'polkadot-js', version: '0.44.1' }])
      vi.mocked(web3Accounts).mockResolvedValue([mockAccount])

      // Mock contract failure
      const contractError = new Error('Contract deployment failed: insufficient funds')
      mockContractService.prototype.createStrategyOnChain.mockRejectedValue(contractError)

      render(<DynaVestApp />, { wrapper: IntegrationWrapper })

      // Connect wallet successfully
      fireEvent.click(screen.getByTestId('connect-wallet-button'))
      await waitFor(() => screen.getByTestId('create-strategy-button'))

      // Fill form and attempt creation
      fireEvent.change(screen.getByTestId('strategy-name-input'), {
        target: { value: 'Test Strategy' }
      })
      fireEvent.change(screen.getByTestId('risk-level-input'), {
        target: { value: '5' }
      })
      fireEvent.change(screen.getByTestId('investment-amount-input'), {
        target: { value: '100' }
      })

      fireEvent.click(screen.getByTestId('create-strategy-button'))

      // Verify error handling
      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toHaveTextContent('Contract deployment failed: insufficient funds')
      })
    })
  })

  describe('Investment Flow Integration', () => {
    it('should complete investment flow after strategy creation', async () => {
      // Setup successful environment
      const mockAccount = {
        address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
        meta: { name: 'Alice' }
      }
      const { web3Enable, web3Accounts } = await import('@polkadot/extension-dapp')
      vi.mocked(web3Enable).mockResolvedValue([{ name: 'polkadot-js', version: '0.44.1' }])
      vi.mocked(web3Accounts).mockResolvedValue([mockAccount])

      // Mock successful investment
      const mockInvestmentResponse = {
        success: true,
        data: { 
          transaction_hash: '0xdef456abc789',
          investment_amount: 500,
          new_balance: 1500
        },
        error: null
      }
      mockContractService.prototype.investInStrategy.mockResolvedValue(mockInvestmentResponse)

      render(<DynaVestApp />, { wrapper: IntegrationWrapper })

      // Connect wallet
      fireEvent.click(screen.getByTestId('connect-wallet-button'))
      await waitFor(() => screen.getByTestId('investment-section'))

      // Fill investment form
      fireEvent.change(screen.getByTestId('strategy-id-input'), {
        target: { value: '42' }
      })
      fireEvent.change(screen.getByTestId('investment-amount-input'), {
        target: { value: '500' }
      })

      // Submit investment
      fireEvent.click(screen.getByTestId('invest-button'))

      await waitFor(() => {
        expect(mockContractService.prototype.investInStrategy).toHaveBeenCalledWith({
          strategy_id: 42,
          amount: 500
        })
      })

      await waitFor(() => {
        expect(screen.getByTestId('success-message')).toHaveTextContent('Investment successful')
      })
    })
  })
})