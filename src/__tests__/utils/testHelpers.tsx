// Comprehensive testing utilities for DynaVest
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { vi } from 'vitest'

// Mock providers for testing
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

// Test wrapper with providers
export const TestWrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = createTestQueryClient()
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

// Custom render function with providers
export const renderWithProviders = (ui: ReactNode, options = {}) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <TestWrapper>{children}</TestWrapper>
  )
  
  return render(ui, { wrapper: Wrapper, ...options })
}

// Mock implementations for common external dependencies
export const mockWallet = {
  address: '0x742d35Cc6635C0532925a3b8D0bE6d5C5e1e5e5a',
  isConnected: true,
  connect: vi.fn(),
  disconnect: vi.fn(),
  signMessage: vi.fn().mockResolvedValue('mocked-signature'),
  sendTransaction: vi.fn().mockResolvedValue({ hash: 'mocked-tx-hash' })
}

export const mockStrategy = {
  id: 'test-strategy-1',
  name: 'AAVE USDC Supply',
  protocol: 'AAVE',
  asset: 'USDC',
  apy: 3.2,
  riskLevel: 2,
  chain: 'base',
  parameters: {
    principal: 1000,
    duration: '30 days'
  },
  isActive: true,
  createdAt: new Date('2024-01-01').toISOString()
}

export const mockUser = {
  id: 'test-user-1',
  walletAddress: mockWallet.address,
  preferences: {
    riskTolerance: 'medium' as const,
    preferredChains: ['base', 'arbitrum'],
    notifications: true
  },
  totalValue: 5000,
  profitLoss: 250
}

// Test data generators
export const generateMockStrategies = (count: number = 3) => {
  return Array.from({ length: count }, (_, index) => ({
    ...mockStrategy,
    id: `test-strategy-${index + 1}`,
    name: `Test Strategy ${index + 1}`,
    apy: 2 + Math.random() * 8, // Random APY between 2-10%
    riskLevel: Math.floor(Math.random() * 10) + 1, // Random risk 1-10
  }))
}

export const generateMockMessages = (count: number = 5) => {
  const messages = []
  for (let i = 0; i < count; i++) {
    messages.push(
      {
        id: `user-${i}`,
        role: 'user' as const,
        content: `User message ${i + 1}`,
        timestamp: new Date(Date.now() - (count - i) * 60000) // Minutes apart
      },
      {
        id: `assistant-${i}`,
        role: 'assistant' as const,
        content: `AI response ${i + 1}`,
        timestamp: new Date(Date.now() - (count - i) * 60000 + 30000) // 30s after user
      }
    )
  }
  return messages
}

// Common test actions
export const testActions = {
  // Wallet interactions
  connectWallet: async () => {
    const connectButton = screen.getByRole('button', { name: /connect wallet/i })
    await userEvent.click(connectButton)
  },

  // Chat interactions
  sendChatMessage: async (message: string) => {
    const input = screen.getByRole('textbox', { name: /chat input/i })
    await userEvent.type(input, message)
    
    const sendButton = screen.getByRole('button', { name: /send/i })
    await userEvent.click(sendButton)
  },

  // Strategy interactions
  selectStrategy: async (strategyName: string) => {
    const strategyCard = screen.getByText(strategyName)
    await userEvent.click(strategyCard)
  },

  saveStrategy: async () => {
    const saveButton = screen.getByRole('button', { name: /save.*strategy/i })
    await userEvent.click(saveButton)
  },

  // Navigation
  navigateToProfile: async () => {
    const profileLink = screen.getByRole('link', { name: /profile/i })
    await userEvent.click(profileLink)
  },

  navigateToStrategies: async () => {
    const strategiesLink = screen.getByRole('link', { name: /strategies/i })
    await userEvent.click(strategiesLink)
  }
}

// Assertion helpers
export const assertions = {
  // Wallet assertions
  expectWalletConnected: () => {
    expect(screen.getByText(mockWallet.address.slice(0, 6))).toBeInTheDocument()
  },

  expectWalletDisconnected: () => {
    expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument()
  },

  // Strategy assertions
  expectStrategyVisible: (strategyName: string) => {
    expect(screen.getByText(strategyName)).toBeInTheDocument()
  },

  expectStrategyCount: (count: number) => {
    const strategies = screen.getAllByTestId('strategy-card')
    expect(strategies).toHaveLength(count)
  },

  // Chat assertions
  expectMessageInChat: (message: string) => {
    expect(screen.getByText(message)).toBeInTheDocument()
  },

  expectChatLoading: () => {
    expect(screen.getByText(/typing/i)).toBeInTheDocument()
  },

  // UI state assertions
  expectLoading: () => {
    expect(screen.getByRole('status')).toBeInTheDocument()
  },

  expectError: (errorMessage?: string) => {
    if (errorMessage) {
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    } else {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    }
  },

  expectSuccess: (successMessage?: string) => {
    if (successMessage) {
      expect(screen.getByText(successMessage)).toBeInTheDocument()
    } else {
      expect(screen.getByRole('status')).toHaveTextContent(/success/i)
    }
  }
}

// Mock API responses
export const mockApiResponses = {
  strategies: {
    save: {
      success: true,
      data: mockStrategy,
      message: 'Strategy saved successfully'
    },
    load: {
      success: true,
      data: generateMockStrategies(3),
      message: 'Strategies loaded successfully'
    },
    error: {
      success: false,
      error: 'Failed to save strategy',
      data: null
    }
  },

  wallet: {
    connect: {
      address: mockWallet.address,
      chainId: 1,
      isConnected: true
    },
    balance: {
      value: '1000000000000000000', // 1 ETH in wei
      formatted: '1.0',
      symbol: 'ETH'
    }
  },

  chat: {
    response: {
      content: 'This is a mock AI response for testing.',
      metadata: {
        actionType: 'strategy_recommendation',
        confidence: 0.85,
        strategies: [mockStrategy]
      }
    }
  }
}

// Performance testing helpers
export const performanceHelpers = {
  measureRenderTime: async (component: ReactNode) => {
    const start = performance.now()
    renderWithProviders(component)
    const end = performance.now()
    return end - start
  },

  expectFastRender: async (component: ReactNode, maxMs: number = 100) => {
    const renderTime = await performanceHelpers.measureRenderTime(component)
    expect(renderTime).toBeLessThan(maxMs)
  },

  measureAsyncAction: async (action: () => Promise<void>) => {
    const start = performance.now()
    await action()
    const end = performance.now()
    return end - start
  }
}

// Accessibility testing helpers
export const a11yHelpers = {
  expectFocusable: (element: HTMLElement) => {
    expect(element).toHaveAttribute('tabindex')
    expect(element.tabIndex).toBeGreaterThanOrEqual(0)
  },

  expectAriaLabel: (element: HTMLElement, label: string) => {
    expect(element).toHaveAttribute('aria-label', label)
  },

  expectKeyboardAccessible: async (element: HTMLElement) => {
    element.focus()
    expect(element).toHaveFocus()
    
    fireEvent.keyDown(element, { key: 'Enter' })
    // Add assertions based on expected behavior
  },

  expectScreenReaderText: (text: string) => {
    expect(screen.getByText(text)).toBeInTheDocument()
    expect(screen.getByText(text)).toHaveClass('sr-only')
  }
}

// Integration test helpers
export const integrationHelpers = {
  completeUserFlow: async (flow: 'save_strategy' | 'connect_wallet' | 'chat_interaction') => {
    switch (flow) {
      case 'save_strategy':
        await testActions.connectWallet()
        await testActions.selectStrategy('AAVE USDC Supply')
        await testActions.saveStrategy()
        await waitFor(() => assertions.expectSuccess())
        break
        
      case 'connect_wallet':
        await testActions.connectWallet()
        await waitFor(() => assertions.expectWalletConnected())
        break
        
      case 'chat_interaction':
        await testActions.sendChatMessage('I want low-risk strategies')
        await waitFor(() => assertions.expectMessageInChat('AAVE lending'))
        break
    }
  },

  setupAuthenticatedUser: async () => {
    // Mock authenticated state
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn().mockReturnValue(JSON.stringify(mockUser)),
        setItem: vi.fn(),
        removeItem: vi.fn()
      }
    })
  }
}

// Clean up function for tests
export const cleanup = () => {
  vi.clearAllMocks()
  localStorage.clear()
  sessionStorage.clear()
}

export default {
  renderWithProviders,
  testActions,
  assertions,
  mockApiResponses,
  performanceHelpers,
  a11yHelpers,
  integrationHelpers,
  cleanup,
  mockWallet,
  mockStrategy,
  mockUser,
  generateMockStrategies,
  generateMockMessages
}