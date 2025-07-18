"use client";

import React, { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { POLKADOT_CHAINS, isTestnetChain } from '@/constants/chains';
import { usePolkadotWallet } from './PolkadotWalletProvider';

export function NetworkSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const { selectedChain, selectChain } = usePolkadotWallet();

  const handleChainSelect = (chainId: number) => {
    selectChain(chainId);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg border transition-colors"
      >
        <img
          src={selectedChain.icon}
          alt={selectedChain.name}
          className="w-5 h-5"
        />
        <span className="text-sm font-medium">{selectedChain.name}</span>
        {selectedChain.isTestnet && (
          <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
            Testnet
          </span>
        )}
        <ChevronDownIcon className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-2">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">
              Mainnet
            </div>
            {POLKADOT_CHAINS.filter(chain => !chain.isTestnet).map((chain) => (
              <button
                key={chain.id}
                onClick={() => handleChainSelect(chain.id)}
                className={`w-full flex items-center space-x-3 px-2 py-2 text-left hover:bg-gray-50 rounded transition-colors ${
                  selectedChain.id === chain.id ? 'bg-blue-50 text-blue-700' : ''
                }`}
              >
                <img src={chain.icon} alt={chain.name} className="w-5 h-5" />
                <span className="text-sm">{chain.name}</span>
              </button>
            ))}
            
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1 mt-2">
              Testnets
            </div>
            {POLKADOT_CHAINS.filter(chain => chain.isTestnet).map((chain) => (
              <button
                key={chain.id}
                onClick={() => handleChainSelect(chain.id)}
                className={`w-full flex items-center justify-between px-2 py-2 text-left hover:bg-gray-50 rounded transition-colors ${
                  selectedChain.id === chain.id ? 'bg-blue-50 text-blue-700' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <img src={chain.icon} alt={chain.name} className="w-5 h-5" />
                  <span className="text-sm">{chain.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                    Testnet
                  </span>
                  {chain.faucet && (
                    <a
                      href={chain.faucet}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors"
                    >
                      Faucet
                    </a>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}