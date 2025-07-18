import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import StatusModal from '../index'

describe('Smart Wallet Transaction UX - Status Modal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('should display loading state with progress indicator during transaction', () => {
    render(
      <StatusModal
        isOpen={true}
        onClose={vi.fn()}
        title="Processing Transaction"
        description="Your transaction is being processed on the blockchain"
        type="loading"
      />
    )

    expect(screen.getByText('Processing Transaction')).toBeInTheDocument()
    expect(screen.getByText('Your transaction is being processed on the blockchain')).toBeInTheDocument()
    expect(screen.getByText('Processing...')).toBeInTheDocument()
    
    // Check for progress bar
    const progressBar = document.querySelector('.bg-\\[\\#5F79F1\\]')
    expect(progressBar).toBeInTheDocument()
  })

  it('should animate progress bar during loading state', () => {
    render(
      <StatusModal
        isOpen={true}
        onClose={vi.fn()}
        title="Processing Transaction"
        description="Please wait..."
        type="loading"
      />
    )

    const progressBar = document.querySelector('.bg-\\[\\#5F79F1\\]') as HTMLElement
    expect(progressBar).toBeInTheDocument()

    // Initial progress should be 0
    expect(progressBar.style.width).toBe('0%')

    // Advance timer and check progress increments
    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(progressBar.style.width).toBe('10%')

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(progressBar.style.width).toBe('20%')
  })

  it('should display success state with checkmark icon after transaction completion', () => {
    render(
      <StatusModal
        isOpen={true}
        onClose={vi.fn()}
        title="Transaction Successful"
        description="Your strategy has been executed successfully"
        type="success"
      />
    )

    expect(screen.getByText('Transaction Successful')).toBeInTheDocument()
    expect(screen.getByText('Your strategy has been executed successfully')).toBeInTheDocument()
    
    // Check for success icon (checkmark)
    const checkmarkIcon = document.querySelector('svg[class*="text-green-600"]')
    expect(checkmarkIcon).toBeInTheDocument()
  })

  it('should auto-close success modal after 3 seconds', () => {
    const mockOnClose = vi.fn()
    
    render(
      <StatusModal
        isOpen={true}
        onClose={mockOnClose}
        title="Success"
        description="Transaction completed"
        type="success"
      />
    )

    expect(mockOnClose).not.toHaveBeenCalled()

    // Advance timer by 3 seconds
    vi.advanceTimersByTime(3000)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should display error state with error icon when transaction fails', () => {
    render(
      <StatusModal
        isOpen={true}
        onClose={vi.fn()}
        title="Transaction Failed"
        description="The transaction could not be completed. Please try again."
        type="error"
        actions={[
          { label: 'Retry', onClick: vi.fn() },
          { label: 'Cancel', onClick: vi.fn(), variant: 'outline' }
        ]}
      />
    )

    expect(screen.getByText('Transaction Failed')).toBeInTheDocument()
    expect(screen.getByText('The transaction could not be completed. Please try again.')).toBeInTheDocument()
    
    // Check for error icon (X mark)
    const errorIcon = document.querySelector('svg[class*="text-red-600"]')
    expect(errorIcon).toBeInTheDocument()

    // Check for action buttons
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('should call action handlers when action buttons are clicked', () => {
    const mockRetry = vi.fn()
    const mockCancel = vi.fn()

    render(
      <StatusModal
        isOpen={true}
        onClose={vi.fn()}
        title="Transaction Failed"
        description="Error occurred"
        type="error"
        actions={[
          { label: 'Retry', onClick: mockRetry },
          { label: 'Cancel', onClick: mockCancel, variant: 'outline' }
        ]}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(mockRetry).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(mockCancel).toHaveBeenCalledTimes(1)
  })

  it('should display warning state for chain switching requirements', () => {
    render(
      <StatusModal
        isOpen={true}
        onClose={vi.fn()}
        title="Chain Switch Required"
        description="Please switch to Arbitrum to continue with this transaction"
        type="warning"
        actions={[
          { label: 'Switch Chain', onClick: vi.fn() }
        ]}
      />
    )

    expect(screen.getByText('Chain Switch Required')).toBeInTheDocument()
    expect(screen.getByText('Please switch to Arbitrum to continue with this transaction')).toBeInTheDocument()
    
    // Check for warning icon
    const warningIcon = document.querySelector('svg[class*="text-yellow-600"]')
    expect(warningIcon).toBeInTheDocument()

    expect(screen.getByRole('button', { name: 'Switch Chain' })).toBeInTheDocument()
  })

  it('should display info state for transaction information', () => {
    render(
      <StatusModal
        isOpen={true}
        onClose={vi.fn()}
        title="Transaction Details"
        description="Gas fees will be sponsored by DynaVest. No ETH required."
        type="info"
      />
    )

    expect(screen.getByText('Transaction Details')).toBeInTheDocument()
    expect(screen.getByText('Gas fees will be sponsored by DynaVest. No ETH required.')).toBeInTheDocument()
    
    // Check for info icon
    const infoIcon = document.querySelector('svg[class*="text-blue-600"]')
    expect(infoIcon).toBeInTheDocument()
  })

  it('should close modal when OK button is clicked', () => {
    const mockOnClose = vi.fn()

    render(
      <StatusModal
        isOpen={true}
        onClose={mockOnClose}
        title="Information"
        description="Some info"
        type="info"
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'OK' }))
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should not auto-close non-success modals', () => {
    const mockOnClose = vi.fn()

    render(
      <StatusModal
        isOpen={true}
        onClose={mockOnClose}
        title="Error"
        description="Something went wrong"
        type="error"
      />
    )

    vi.advanceTimersByTime(5000)

    expect(mockOnClose).not.toHaveBeenCalled()
  })
})