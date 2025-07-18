"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { useMutation, UseMutationResult } from "@tanstack/react-query";

import { Message, BotResponse } from "@/types";
import { DynaVestService } from "@/services/DynaVestService";
import { classifyUserIntent, generateGreetingResponse, generateCasualResponse } from "@/utils/naturalLanguage";

interface ChatContextType {
  showChat: boolean;
  openChat: (firstMessage?: string | Message) => void;
  closeChat: () => void;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isMinimized: boolean;
  toggleMinimize: () => void;
  sendMessage: UseMutationResult<BotResponse, Error, string>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [showChat, setShowChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);

  const dynaVestService = new DynaVestService();

  // Chat AI response mutation using DynaVestService
  const sendMessage = useMutation({
    mutationFn: async (message: string): Promise<BotResponse> => {
      // First, classify the user's intent
      const intent = classifyUserIntent(message);
      
      // Handle greetings and casual conversation locally
      if (intent === 'greeting') {
        return {
          type: "text",
          data: {
            answer: generateGreetingResponse(),
            risk_level: "low",
            chain: 1
          }
        };
      }
      
      if (intent === 'casual' || intent === 'help' || intent === 'unknown') {
        return {
          type: "text",
          data: {
            answer: generateCasualResponse(intent),
            risk_level: "low",
            chain: 1
          }
        };
      }
      
      // Only call backend for DeFi-related queries
      if (intent === 'defi') {
        try {
          const defiResponse = await dynaVestService.getDefiRecommendations(message);
          
          // Handle the response format from shuttle backend
          if (defiResponse.data?.data?.answer) {
            const answer = defiResponse.data.data.answer;
            
            // If the backend response seems like a strategy recommendation, show strategies
            if (answer.toLowerCase().includes('strategy') || 
                answer.toLowerCase().includes('invest') ||
                answer.toLowerCase().includes('apy') ||
                answer.toLowerCase().includes('yield')) {
              return {
                type: "strategies",
                data: {
                  answer: answer,
                  risk_level: defiResponse.strategy_data?.risk_level as any || "medium",
                  chain: 1
                }
              };
            }
            
            // Otherwise, show as text response
            return {
              type: "text",
              data: {
                answer: answer,
                risk_level: defiResponse.strategy_data?.risk_level as any || "medium",
                chain: 1
              }
            };
          }
          
          // Fallback to strategy response if no clear answer
          return {
            type: "strategies",
            data: {
              answer: defiResponse.strategy_data?.name || "Let me show you some investment strategies",
              risk_level: defiResponse.strategy_data?.risk_level as any || "medium",
              chain: 1
            }
          };
        } catch (error) {
          console.error('Error calling DynaVest service:', error);
          return {
            type: "text",
            data: {
              answer: "I'm having trouble connecting to my backend right now. But I can still help you! What DeFi strategies are you interested in?",
              risk_level: "low",
              chain: 1
            }
          };
        }
      }
      
      // Default fallback
      return {
        type: "text",
        data: {
          answer: "I specialize in DeFi and investment strategies. What would you like to know about yield farming, staking, or portfolio management?",
          risk_level: "low",
          chain: 1
        }
      };
    },
  });

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const openChat = (firstMessage?: string | Message) => {
    setShowChat(true);
    setIsMinimized(false);

    if (firstMessage) {
      const msgObj: Message =
        typeof firstMessage === "string"
          ? {
              id: Date.now().toString(),
              text: firstMessage,
              sender: "bot",
              timestamp: new Date(),
              type: "Text",
            }
          : firstMessage;
      setMessages([msgObj]);
    }
  };

  const closeChat = () => {
    setShowChat(false);
  };

  return (
    <ChatContext.Provider
      value={{
        showChat,
        openChat,
        closeChat,
        messages,
        setMessages,
        isMinimized,
        toggleMinimize,
        sendMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
