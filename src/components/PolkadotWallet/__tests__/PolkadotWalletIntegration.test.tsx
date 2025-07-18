import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PolkadotWalletProvider, usePolkadotWallet } from '../PolkadotWalletProvider'

// Mock @polkadot/extension-dapp
vi.mock('@polkadot/extension-dapp', () => ({
  web3Accounts: vi.fn(),
  web3Enable: vi.fn(),
  web3FromAddress: vi.fn()
}))

const TestComponent = () => {
  const { 
    account, 
    accounts, 
    connectWallet, 
    selectAccount, 
    signTransaction, 
    isConnected 
  } = usePolkadotWallet()

  return (
    <div>
      <div data-testid="connection-status">{isConnected ? 'connected' : 'disconnected'}</div>
      <div data-testid="current-account">{account?.address || 'none'}</div>
      <div data-testid="accounts-count">{accounts.length}</div>
      <button onClick={connectWallet} data-testid="connect-button">Connect Wallet</button>
      {accounts.length > 0 && (
        <button 
          onClick={() => selectAccount(accounts[0])} 
          data-testid="select-account-button"
        >
          Select Account
        </button>
      )}
      <button 
        onClick={() => signTransaction('strategy_creation_tx')} 
        data-testid="sign-button"
      >
        Sign Transaction
      </button>
    </div>
  )
}

describe('Polkadot Wallet Integration', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <PolkadotWalletProvider>{children}</PolkadotWalletProvider>
  )

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('wallet connection', () => {
    it('should connect to Polkadot.js extension wallet and load accounts', async () => {
      const mockAccounts = [
        { address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', meta: { name: 'Alice' } },
        { address: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', meta: { name: 'Bob' } }
      ]

      const { web3Enable, web3Accounts } = await import('@polkadot/extension-dapp')
      vi.mocked(web3Enable).mockResolvedValue([{ name: 'polkadot-js', version: '0.44.1' }])
      vi.mocked(web3Accounts).mockResolvedValue(mockAccounts)

      render(<TestComponent />, { wrapper })

      expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected')
      expect(screen.getByTestId('accounts-count')).toHaveTextContent('0')

      fireEvent.click(screen.getByTestId('connect-button'))

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected')
        expect(screen.getByTestId('accounts-count')).toHaveTextContent('2')
      })

      expect(web3Enable).toHaveBeenCalledWith('DynaVest')
      expect(web3Accounts).toHaveBeenCalled()
    })

    it('should handle wallet connection failure gracefully', async () => {
      const { web3Enable } = await import('@polkadot/extension-dapp')
      vi.mocked(web3Enable).mockResolvedValue([])

      render(<TestComponent />, { wrapper })

      fireEvent.click(screen.getByTestId('connect-button'))

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('disconnected')
      })
    })
  })

  describe('account management', () => {
    it('should allow selecting different Polkadot accounts', async () => {
      const mockAccounts = [
        { address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', meta: { name: 'Alice' } }
      ]

      const { web3Enable, web3Accounts } = await import('@polkadot/extension-dapp')
      vi.mocked(web3Enable).mockResolvedValue([{ name: 'polkadot-js', version: '0.44.1' }])
      vi.mocked(web3Accounts).mockResolvedValue(mockAccounts)

      render(<TestComponent />, { wrapper })

      fireEvent.click(screen.getByTestId('connect-button'))

      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('connected')
      })

      fireEvent.click(screen.getByTestId('select-account-button'))

      await waitFor(() => {
        expect(screen.getByTestId('current-account')).toHaveTextContent('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY')
      })
    })
  })

  describe('transaction signing', () => {
    it('should sign strategy creation transactions for ink! contracts', async () => {
      const mockAccounts = [
        { address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', meta: { name: 'Alice' } }
      ]

      const mockSigner = {
        signPayload: vi.fn().mockResolvedValue({ signature: '0x123abc' })
      }

      const { web3Enable, web3Accounts, web3FromAddress } = await import('@polkadot/extension-dapp')
      vi.mocked(web3Enable).mockResolvedValue([{ name: 'polkadot-js', version: '0.44.1' }])
      vi.mocked(web3Accounts).mockResolvedValue(mockAccounts)
      vi.mocked(web3FromAddress).mockResolvedValue({ signer: mockSigner })

      render(<TestComponent />, { wrapper })

      // Connect and select account
      fireEvent.click(screen.getByTestId('connect-button'))
      await waitFor(() => screen.getByTestId('select-account-button'))
      fireEvent.click(screen.getByTestId('select-account-button'))

      await waitFor(() => {
        expect(screen.getByTestId('current-account')).toHaveTextContent('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY')
      })

      fireEvent.click(screen.getByTestId('sign-button'))

      await waitFor(() => {
        expect(web3FromAddress).toHaveBeenCalledWith('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY')
      })
    })
  })
})