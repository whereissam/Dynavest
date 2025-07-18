import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { usePrivy } from '@privy-io/react-auth'
import { useChat } from '@/contexts/ChatContext'
import { saveStrategy, loadStrategies } from '@/utils/strategyApi'
import Chatroom from '../index'

// Mock dependencies
vi.mock('@privy-io/react-auth')
vi.mock('@/contexts/ChatContext')
vi.mock('@/utils/strategyApi')
vi.mock('@/utils/toast', () => ({
  strategyToast: {
    walletRequired: vi.fn(),
    noStrategyFound: vi.fn(),
    saveSuccess: vi.fn(),
    saveError: vi.fn(),
    loadSuccess: vi.fn(),
    loadError: vi.fn(),
  },
}))

const mockUsePrivy = vi.mocked(usePrivy)
const mockUseChat = vi.mocked(useChat)
const mockSaveStrategy = vi.mocked(saveStrategy)
const mockLoadStrategies = vi.mocked(loadStrategies)

describe('Chatroom Save/Load Strategy Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock implementations
    mockUsePrivy.mockReturnValue({
      authenticated: true,
      user: {
        smartWallet: {
          address: '0x123456789',
        },
      },
    } as any)

    mockUseChat.mockReturnValue({
      showChat: true,
      messages: [
        {
          id: '1',
          text: 'This is a strategy recommendation',
          sender: 'bot',
          timestamp: new Date(),
          type: 'Text',
        },
      ],
      setMessages: vi.fn(),
      isMinimized: false,
      toggleMinimize: vi.fn(),
      sendMessage: {
        mutateAsync: vi.fn(),
        isPending: false,
      },
    } as any)
  })

  it('should display save strategy button when chat is visible', () => {
    render(<Chatroom />)
    
    const saveButton = screen.getByRole('button', { name: /save strategy/i })
    expect(saveButton).toBeInTheDocument()
  })

  it('should display load strategies button when chat is visible', () => {
    render(<Chatroom />)
    
    const loadButton = screen.getByRole('button', { name: /load strategies/i })
    expect(loadButton).toBeInTheDocument()
  })

  it('should call saveStrategy when save button is clicked with authenticated user', async () => {
    mockSaveStrategy.mockResolvedValue(undefined)
    
    render(<Chatroom />)
    
    const saveButton = screen.getByRole('button', { name: /save strategy/i })
    fireEvent.click(saveButton)
    
    await waitFor(() => {
      expect(mockSaveStrategy).toHaveBeenCalledWith({
        account: '0x123456789',
        strategy: {
          name: expect.stringContaining('Strategy'),
          risk_level: 5,
          parameters: 'This is a strategy recommendation',
        },
      })
    })
  })

  it('should call loadStrategies when load button is clicked with authenticated user', async () => {
    mockLoadStrategies.mockResolvedValue([
      {
        name: 'Test Strategy',
        risk_level: 7,
        parameters: 'Test parameters',
      },
    ])
    
    render(<Chatroom />)
    
    const loadButton = screen.getByRole('button', { name: /load strategies/i })
    fireEvent.click(loadButton)
    
    await waitFor(() => {
      expect(mockLoadStrategies).toHaveBeenCalledWith('0x123456789')
    })
  })

  it('should disable save button when user is not authenticated', () => {
    mockUsePrivy.mockReturnValue({
      authenticated: false,
      user: null,
    } as any)
    
    render(<Chatroom />)
    
    const saveButton = screen.getByRole('button', { name: /save strategy/i })
    expect(saveButton).toBeDisabled()
  })

  it('should disable load button when user is not authenticated', () => {
    mockUsePrivy.mockReturnValue({
      authenticated: false,
      user: null,
    } as any)
    
    render(<Chatroom />)
    
    const loadButton = screen.getByRole('button', { name: /load strategies/i })
    expect(loadButton).toBeDisabled()
  })
})