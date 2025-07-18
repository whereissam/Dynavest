"use client";

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { usePolkadotWallet } from '../PolkadotWallet/PolkadotWalletProvider';
import { ContractService } from '../../services/ContractService';

export function ContractInteractionForm() {
  const { account, isConnected, connectWallet } = usePolkadotWallet();
  const [strategyName, setStrategyName] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [strategyId, setStrategyId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const contractService = new ContractService();

  const createStrategyMutation = useMutation({
    mutationFn: async () => {
      if (!account) {
        throw new Error('No account connected');
      }
      const strategyData = {
        name: strategyName,
        risk_level: parseInt(riskLevel),
        parameters: JSON.stringify({ protocol: 'polkadot-staking' }),
        initial_investment: parseInt(investmentAmount)
      };
      return await contractService.createStrategyOnChain(account.address, strategyData);
    },
    onSuccess: () => {
      setSuccessMessage('Strategy created successfully on chain');
      setErrorMessage('');
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
      setSuccessMessage('');
    }
  });

  const investMutation = useMutation({
    mutationFn: async () => {
      if (!account) {
        throw new Error('No account connected');
      }
      const investmentData = {
        strategy_id: parseInt(strategyId),
        amount: parseInt(investmentAmount)
      };
      return await contractService.investInStrategy(account.address, investmentData);
    },
    onSuccess: () => {
      setSuccessMessage('Investment successful');
      setErrorMessage('');
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
      setSuccessMessage('');
    }
  });

  const handleCreateStrategy = () => {
    createStrategyMutation.mutate();
  };

  const handleInvest = () => {
    investMutation.mutate();
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white rounded-lg shadow">
      <div data-testid="wallet-status" className="mb-4">
        {isConnected ? 'connected' : 'disconnected'}
      </div>

      {!isConnected && (
        <div data-testid="wallet-prompt" className="mb-4 p-4 bg-yellow-50 rounded">
          Connect your Polkadot wallet to interact with contracts
        </div>
      )}

      <button
        data-testid="connect-wallet-button"
        onClick={connectWallet}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        Connect Wallet
      </button>

      {/* Strategy Creation Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Create Strategy</h3>
        <input
          data-testid="strategy-name-input"
          type="text"
          placeholder="Strategy Name"
          value={strategyName}
          onChange={(e) => setStrategyName(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
        />
        <input
          data-testid="risk-level-input"
          type="number"
          placeholder="Risk Level (1-10)"
          value={riskLevel}
          onChange={(e) => setRiskLevel(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
        />
        <input
          data-testid="investment-amount-input"
          type="number"
          placeholder="Initial Investment"
          value={investmentAmount}
          onChange={(e) => setInvestmentAmount(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
        />
        <button
          data-testid="create-strategy-button"
          onClick={handleCreateStrategy}
          disabled={!isConnected || createStrategyMutation.isPending}
          className="w-full px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-300"
        >
          {createStrategyMutation.isPending ? 'Creating...' : 'Create Strategy'}
        </button>
      </div>

      {/* Investment Section */}
      <div data-testid="investment-section" className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Invest in Strategy</h3>
        <input
          data-testid="strategy-id-input"
          type="number"
          placeholder="Strategy ID"
          value={strategyId}
          onChange={(e) => setStrategyId(e.target.value)}
          className="w-full mb-2 p-2 border rounded"
        />
        <button
          data-testid="invest-button"
          onClick={handleInvest}
          disabled={!isConnected || investMutation.isPending}
          className="w-full px-4 py-2 bg-purple-500 text-white rounded disabled:bg-gray-300"
        >
          {investMutation.isPending ? 'Investing...' : 'Invest'}
        </button>
      </div>

      {/* Messages */}
      {successMessage && (
        <div data-testid="success-message" className="p-3 bg-green-100 text-green-700 rounded mb-3">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div data-testid="error-message" className="p-3 bg-red-100 text-red-700 rounded">
          {errorMessage}
        </div>
      )}
    </div>
  );
}