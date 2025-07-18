import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useDeploySmartWallet } from '../useDeploySmartWallet'
import { useSmartWallets } from '@privy-io/react-auth/smart-wallets'

// Mock dependencies
vi.mock('@privy-io/react-auth/smart-wallets')
vi.mock('@tanstack/react-query', () => ({
  useMutation: vi.fn((config) => ({
    mutate: vi.fn(),
    mutateAsync: config.mutationFn,
    isLoading: false,
    isError: false,
    isSuccess: false,
    error: null,
    data: null,
    reset: vi.fn()
  }))
}))

const mockUseSmartWallets = vi.mocked(useSmartWallets)

describe('Smart Wallet Transaction UX - useDeploySmartWallet', () => {
  const mockClient = {
    account: {
      isDeployed: vi.fn()
    },
    sendTransaction: vi.fn()
  }

  const mockSmartWallet = {
    address: '0x1234567890123456789012345678901234567890'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSmartWallets.mockReturnValue({
      client: mockClient,
      create: vi.fn(),
      get: vi.fn()
    } as any)
  })

  it('should successfully deploy smart wallet when account is not yet deployed', async () => {
    mockClient.account.isDeployed.mockReturnValue(false)
    mockClient.sendTransaction.mockResolvedValue('0xabcdef123456')

    const { result } = renderHook(() => useDeploySmartWallet())
    
    // This should be implemented to handle undeployed accounts
    const deployResult = await result.current.mutateAsync(mockSmartWallet as any)
    
    expect(deployResult).toBe('0xabcdef123456')
    expect(mockClient.sendTransaction).toHaveBeenCalledWith(
      {
        to: mockSmartWallet.address,
        value: BigInt(0),
        data: "0x",
      },
      {
        uiOptions: {
          showWalletUIs: false,
        },
      }
    )
  })

  it('should send transaction when smart wallet is already deployed', async () => {
    mockClient.account.isDeployed.mockReturnValue(true)
    mockClient.sendTransaction.mockResolvedValue('0xdeadbeef')

    const { result } = renderHook(() => useDeploySmartWallet())
    
    const deployResult = await result.current.mutateAsync(mockSmartWallet as any)
    
    expect(deployResult).toBe('0xdeadbeef')
    expect(mockClient.sendTransaction).toHaveBeenCalledWith(
      {
        to: mockSmartWallet.address,
        value: BigInt(0),
        data: "0x",
      },
      {
        uiOptions: {
          showWalletUIs: false,
        },
      }
    )
  })

  it('should handle transaction failure gracefully', async () => {
    mockClient.account.isDeployed.mockReturnValue(true)
    mockClient.sendTransaction.mockRejectedValue(new Error('Transaction failed'))

    const { result } = renderHook(() => useDeploySmartWallet())
    
    await expect(result.current.mutateAsync(mockSmartWallet as any))
      .rejects.toThrow('Transaction failed')
  })

  it('should handle case when client is not available', async () => {
    mockUseSmartWallets.mockReturnValue({
      client: null,
      create: vi.fn(),
      get: vi.fn()
    } as any)

    const { result } = renderHook(() => useDeploySmartWallet())
    
    const deployResult = await result.current.mutateAsync(mockSmartWallet as any)
    
    // Should handle gracefully when client is not available
    expect(deployResult).toBeUndefined()
  })

  it('should use correct transaction parameters for smart wallet deployment', async () => {
    mockClient.account.isDeployed.mockReturnValue(true)
    mockClient.sendTransaction.mockResolvedValue('0x123')

    const { result } = renderHook(() => useDeploySmartWallet())
    
    await result.current.mutateAsync(mockSmartWallet as any)
    
    // Verify transaction parameters are correct for smart wallet
    expect(mockClient.sendTransaction).toHaveBeenCalledWith(
      expect.objectContaining({
        to: mockSmartWallet.address,
        value: BigInt(0),
        data: "0x"
      }),
      expect.objectContaining({
        uiOptions: {
          showWalletUIs: false
        }
      })
    )
  })

  it('should provide smooth UX by hiding wallet UIs during transaction', async () => {
    mockClient.account.isDeployed.mockReturnValue(true)
    mockClient.sendTransaction.mockResolvedValue('0x456')

    const { result } = renderHook(() => useDeploySmartWallet())
    
    await result.current.mutateAsync(mockSmartWallet as any)
    
    // Verify UI options are set to provide smooth UX
    const callArgs = mockClient.sendTransaction.mock.calls[0]
    expect(callArgs[1].uiOptions.showWalletUIs).toBe(false)
  })
})