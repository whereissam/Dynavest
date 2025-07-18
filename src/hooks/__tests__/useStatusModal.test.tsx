import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useStatusModal } from '../useStatusModal'

describe('Smart Wallet Transaction UX - useStatusModal Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with modal closed and default state', () => {
    const { result } = renderHook(() => useStatusModal())
    
    expect(result.current.isOpen).toBe(false)
    expect(result.current.modalState).toEqual({
      title: "",
      description: "",
      type: "info",
      actions: []
    })
  })

  it('should show loading modal for transaction processing', () => {
    const { result } = renderHook(() => useStatusModal())
    
    act(() => {
      result.current.showLoading(
        "Processing Transaction", 
        "Your strategy investment is being processed on-chain"
      )
    })

    expect(result.current.isOpen).toBe(true)
    expect(result.current.modalState).toEqual({
      title: "Processing Transaction",
      description: "Your strategy investment is being processed on-chain",
      type: "loading",
      actions: []
    })
  })

  it('should show success modal after transaction completion', () => {
    const { result } = renderHook(() => useStatusModal())
    
    act(() => {
      result.current.showSuccess(
        "Transaction Successful", 
        "Your investment of $100 USDC has been executed successfully",
        [{ label: "View Position", onClick: vi.fn() }]
      )
    })

    expect(result.current.isOpen).toBe(true)
    expect(result.current.modalState).toEqual({
      title: "Transaction Successful",
      description: "Your investment of $100 USDC has been executed successfully",
      type: "success",
      actions: [{ label: "View Position", onClick: expect.any(Function) }]
    })
  })

  it('should show error modal with retry option when transaction fails', () => {
    const mockRetry = vi.fn()
    const { result } = renderHook(() => useStatusModal())
    
    act(() => {
      result.current.showError(
        "Transaction Failed", 
        "Insufficient liquidity in the pool. Please try with a smaller amount.",
        [
          { label: "Retry", onClick: mockRetry },
          { label: "Cancel", onClick: vi.fn(), variant: "outline" }
        ]
      )
    })

    expect(result.current.isOpen).toBe(true)
    expect(result.current.modalState).toEqual({
      title: "Transaction Failed",
      description: "Insufficient liquidity in the pool. Please try with a smaller amount.",
      type: "error",
      actions: [
        { label: "Retry", onClick: mockRetry },
        { label: "Cancel", onClick: expect.any(Function), variant: "outline" }
      ]
    })
  })

  it('should show warning modal for chain switching', () => {
    const mockSwitchChain = vi.fn()
    const { result } = renderHook(() => useStatusModal())
    
    act(() => {
      result.current.showWarning(
        "Wrong Network", 
        "Please switch to Arbitrum to continue with this investment",
        [{ label: "Switch to Arbitrum", onClick: mockSwitchChain }]
      )
    })

    expect(result.current.isOpen).toBe(true)
    expect(result.current.modalState).toEqual({
      title: "Wrong Network",
      description: "Please switch to Arbitrum to continue with this investment",
      type: "warning",
      actions: [{ label: "Switch to Arbitrum", onClick: mockSwitchChain }]
    })
  })

  it('should show info modal for gasless transaction information', () => {
    const { result } = renderHook(() => useStatusModal())
    
    act(() => {
      result.current.showInfo(
        "Gasless Transaction", 
        "Gas fees are sponsored by DynaVest. You don't need ETH in your wallet."
      )
    })

    expect(result.current.isOpen).toBe(true)
    expect(result.current.modalState).toEqual({
      title: "Gasless Transaction",
      description: "Gas fees are sponsored by DynaVest. You don't need ETH in your wallet.",
      type: "info",
      actions: undefined
    })
  })

  it('should hide modal when hideModal is called', () => {
    const { result } = renderHook(() => useStatusModal())
    
    // First show a modal
    act(() => {
      result.current.showSuccess("Success", "Done")
    })
    expect(result.current.isOpen).toBe(true)

    // Then hide it
    act(() => {
      result.current.hideModal()
    })
    expect(result.current.isOpen).toBe(false)
  })

  it('should support complete transaction flow: loading -> success', () => {
    const { result } = renderHook(() => useStatusModal())
    
    // 1. Start with loading state
    act(() => {
      result.current.showLoading(
        "Executing Strategy", 
        "Depositing funds into Aave lending pool..."
      )
    })
    
    expect(result.current.isOpen).toBe(true)
    expect(result.current.modalState.type).toBe("loading")
    expect(result.current.modalState.title).toBe("Executing Strategy")

    // 2. Transition to success state
    act(() => {
      result.current.showSuccess(
        "Strategy Executed", 
        "Successfully deposited $500 USDC. Earning 4.2% APY."
      )
    })
    
    expect(result.current.isOpen).toBe(true)
    expect(result.current.modalState.type).toBe("success")
    expect(result.current.modalState.title).toBe("Strategy Executed")
    expect(result.current.modalState.description).toContain("$500 USDC")
  })

  it('should support complete transaction flow: loading -> error -> retry', () => {
    const mockRetry = vi.fn()
    const { result } = renderHook(() => useStatusModal())
    
    // 1. Start with loading state
    act(() => {
      result.current.showLoading("Processing", "Executing transaction...")
    })
    
    expect(result.current.modalState.type).toBe("loading")

    // 2. Transition to error state
    act(() => {
      result.current.showError(
        "Transaction Failed", 
        "Network congestion detected. Please try again.",
        [{ label: "Retry", onClick: mockRetry }]
      )
    })
    
    expect(result.current.modalState.type).toBe("error")
    expect(result.current.modalState.actions?.[0]?.label).toBe("Retry")

    // 3. User can retry
    const retryAction = result.current.modalState.actions?.[0]
    expect(retryAction?.onClick).toBe(mockRetry)
  })

  it('should support custom modal configuration', () => {
    const customAction = { label: "Custom Action", onClick: vi.fn(), variant: "destructive" as const }
    const { result } = renderHook(() => useStatusModal())
    
    act(() => {
      result.current.showModal({
        title: "Custom Modal",
        description: "This is a custom configured modal",
        type: "warning",
        actions: [customAction]
      })
    })

    expect(result.current.isOpen).toBe(true)
    expect(result.current.modalState).toEqual({
      title: "Custom Modal",
      description: "This is a custom configured modal",
      type: "warning",
      actions: [customAction]
    })
  })
})