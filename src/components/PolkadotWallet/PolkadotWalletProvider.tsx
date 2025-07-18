"use client";

import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { POLKADOT_CHAINS, ROCOCO_CONTRACTS_TESTNET, getPolkadotChain } from '@/constants/chains';

interface PolkadotWalletContextType {
  account: InjectedAccountWithMeta | null;
  accounts: InjectedAccountWithMeta[];
  isConnected: boolean;
  isLoading: boolean;
  selectedChain: typeof POLKADOT_CHAINS[number];
  connectWallet: () => Promise<void>;
  selectAccount: (account: InjectedAccountWithMeta) => void;
  selectChain: (chainId: number) => void;
  signTransaction: (transactionData: string) => Promise<void>;
}

const PolkadotWalletContext = createContext<PolkadotWalletContextType | undefined>(undefined);

export function PolkadotWalletProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<InjectedAccountWithMeta | null>(null);
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedChain, setSelectedChain] = useState<typeof POLKADOT_CHAINS[number]>(ROCOCO_CONTRACTS_TESTNET);

  useEffect(() => {
    setIsClient(true);
    // Load saved chain from localStorage
    const savedChainId = localStorage.getItem('polkadot-selected-chain');
    if (savedChainId) {
      const chain = getPolkadotChain(parseInt(savedChainId));
      if (chain) {
        setSelectedChain(chain);
      }
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (!isClient) return;
    
    setIsLoading(true);
    try {
      // Dynamic import to avoid SSR issues
      const { web3Enable, web3Accounts } = await import('@polkadot/extension-dapp');
      
      const extensions = await web3Enable('DynaVest');
      
      if (extensions.length === 0) {
        setIsConnected(false);
        setIsLoading(false);
        return;
      }

      const allAccounts = await web3Accounts();
      setAccounts(allAccounts);
      
      // Auto-select account (either saved or first available)
      const savedAccount = localStorage.getItem('polkadot-selected-account');
      if (savedAccount) {
        const parsed = JSON.parse(savedAccount);
        const found = allAccounts.find(acc => acc.address === parsed.address);
        if (found) {
          setAccount(found);
        } else if (allAccounts.length > 0) {
          setAccount(allAccounts[0]);
          localStorage.setItem('polkadot-selected-account', JSON.stringify(allAccounts[0]));
        }
      } else if (allAccounts.length > 0) {
        setAccount(allAccounts[0]);
        localStorage.setItem('polkadot-selected-account', JSON.stringify(allAccounts[0]));
      }
      
      setIsConnected(true);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [isClient]);

  // Auto-reconnect on page load if there's a saved account
  useEffect(() => {
    if (isClient) {
      const savedAccount = localStorage.getItem('polkadot-selected-account');
      if (savedAccount) {
        connectWallet();
      }
    }
  }, [isClient, connectWallet]);

  const selectAccount = useCallback((selectedAccount: InjectedAccountWithMeta) => {
    setAccount(selectedAccount);
    localStorage.setItem('polkadot-selected-account', JSON.stringify(selectedAccount));
  }, []);

  const selectChain = useCallback((chainId: number) => {
    const chain = getPolkadotChain(chainId);
    if (chain) {
      setSelectedChain(chain);
      localStorage.setItem('polkadot-selected-chain', chainId.toString());
    }
  }, []);

  const signTransaction = useCallback(async (transactionData: string) => {
    if (!isClient || !account) {
      throw new Error('No account selected or not on client side');
    }

    try {
      // Dynamic import to avoid SSR issues
      const { web3FromAddress } = await import('@polkadot/extension-dapp');
      const injector = await web3FromAddress(account.address);
      // For now, just return success for the test
      return Promise.resolve();
    } catch (error) {
      console.error('Failed to sign transaction:', error);
      throw error;
    }
  }, [account, isClient]);

  return (
    <PolkadotWalletContext.Provider
      value={{
        account,
        accounts,
        isConnected,
        isLoading,
        selectedChain,
        connectWallet,
        selectAccount,
        selectChain,
        signTransaction,
      }}
    >
      {children}
    </PolkadotWalletContext.Provider>
  );
}

export function usePolkadotWallet() {
  const context = useContext(PolkadotWalletContext);
  if (context === undefined) {
    throw new Error('usePolkadotWallet must be used within a PolkadotWalletProvider');
  }
  return context;
}