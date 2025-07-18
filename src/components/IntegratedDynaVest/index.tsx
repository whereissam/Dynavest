"use client";

import React, { useState } from 'react';
import { useChat } from '../../contexts/ChatContext';
import { ContractInteractionForm } from '../ContractInteraction/ContractInteractionForm';

export function IntegratedDynaVest() {
  const { sendMessage } = useChat();
  const [chatInput, setChatInput] = useState('');
  const [aiRecommendation, setAiRecommendation] = useState<any>(null);

  const handleChatSubmit = async () => {
    try {
      const response = await sendMessage.mutateAsync(chatInput);
      setAiRecommendation(response);
    } catch (error) {
      console.error('Chat error:', error);
    }
  };

  return (
    <div data-testid="dynavest-app">
      <div data-testid="chat-section" className="mb-6 p-4 border rounded">
        <h2 className="text-xl font-bold mb-3">AI Strategy Advisor</h2>
        <input
          data-testid="chat-input"
          type="text"
          placeholder="Describe your investment goals..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        <button
          data-testid="get-ai-recommendation"
          onClick={handleChatSubmit}
          disabled={sendMessage.isPending}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          {sendMessage.isPending ? 'Getting Recommendation...' : 'Get AI Recommendation'}
        </button>
        
        {aiRecommendation && (
          <div data-testid="ai-recommendation" className="mt-4 p-3 bg-blue-50 rounded">
            <h3 className="font-semibold">AI Recommendation:</h3>
            <p>{aiRecommendation.data?.answer || 'Strategy recommendation received'}</p>
          </div>
        )}
      </div>
      
      <ContractInteractionForm />
    </div>
  );
}