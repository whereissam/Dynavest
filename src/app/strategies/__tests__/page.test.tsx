import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import StrategiesPage from '../page'

// Mock the child components
vi.mock('@/components/StrategyList', () => ({
  default: () => <div data-testid="strategy-list">Discover Strategies Content</div>
}))

vi.mock('@/components/SavedStrategiesList', () => ({
  default: () => <div data-testid="saved-strategies-list">Saved Strategies Content</div>
}))

describe('StrategiesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render tab navigation with discover and saved tabs', () => {
    render(<StrategiesPage />)
    
    expect(screen.getByRole('button', { name: /discover strategies/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /my saved strategies/i })).toBeInTheDocument()
  })

  it('should display discover strategies tab as active by default', () => {
    render(<StrategiesPage />)
    
    const discoverTab = screen.getByRole('button', { name: /discover strategies/i })
    const savedTab = screen.getByRole('button', { name: /my saved strategies/i })
    
    expect(discoverTab).toHaveClass('border-[#5F79F1]', 'text-[#5F79F1]')
    expect(savedTab).toHaveClass('border-transparent', 'text-gray-500')
    
    // Should show StrategyList component
    expect(screen.getByTestId('strategy-list')).toBeInTheDocument()
    expect(screen.queryByTestId('saved-strategies-list')).not.toBeInTheDocument()
  })

  it('should switch to saved strategies tab when clicked', () => {
    render(<StrategiesPage />)
    
    const savedTab = screen.getByRole('button', { name: /my saved strategies/i })
    fireEvent.click(savedTab)
    
    // Check tab styling
    const discoverTab = screen.getByRole('button', { name: /discover strategies/i })
    expect(savedTab).toHaveClass('border-[#5F79F1]', 'text-[#5F79F1]')
    expect(discoverTab).toHaveClass('border-transparent', 'text-gray-500')
    
    // Should show SavedStrategiesList component
    expect(screen.getByTestId('saved-strategies-list')).toBeInTheDocument()
    expect(screen.queryByTestId('strategy-list')).not.toBeInTheDocument()
  })

  it('should switch back to discover tab when clicked', () => {
    render(<StrategiesPage />)
    
    // First switch to saved
    const savedTab = screen.getByRole('button', { name: /my saved strategies/i })
    fireEvent.click(savedTab)
    
    // Then switch back to discover
    const discoverTab = screen.getByRole('button', { name: /discover strategies/i })
    fireEvent.click(discoverTab)
    
    // Check tab styling
    expect(discoverTab).toHaveClass('border-[#5F79F1]', 'text-[#5F79F1]')
    expect(savedTab).toHaveClass('border-transparent', 'text-gray-500')
    
    // Should show StrategyList component again
    expect(screen.getByTestId('strategy-list')).toBeInTheDocument()
    expect(screen.queryByTestId('saved-strategies-list')).not.toBeInTheDocument()
  })

  it('should render with proper responsive classes', () => {
    const { container } = render(<StrategiesPage />)
    
    const mainDiv = container.firstChild as HTMLElement
    expect(mainDiv).toHaveClass('pb-10', 'md:pb-0')
  })

  it('should have proper accessibility attributes for tab navigation', () => {
    render(<StrategiesPage />)
    
    const discoverTab = screen.getByRole('button', { name: /discover strategies/i })
    const savedTab = screen.getByRole('button', { name: /my saved strategies/i })
    
    expect(discoverTab).toBeInTheDocument()
    expect(savedTab).toBeInTheDocument()
    
    // Buttons should be focusable
    expect(discoverTab.tagName).toBe('BUTTON')
    expect(savedTab.tagName).toBe('BUTTON')
  })
})