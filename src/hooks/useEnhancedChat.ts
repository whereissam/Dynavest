import { useState, useCallback, useRef, useEffect } from 'react'
import { trackChatMessage, trackError } from '@/utils/analytics'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: {
    strategies?: any[]
    actionType?: 'strategy_recommendation' | 'education' | 'general'
    confidence?: number
    sources?: string[]
  }
}

interface ChatState {
  messages: Message[]
  isTyping: boolean
  isLoading: boolean
  error: string | null
  sessionId: string
}

interface ChatAnalytics {
  messageCount: number
  sessionDuration: number
  strategiesDiscussed: number
  userSatisfaction?: number
}

export const useEnhancedChat = () => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isTyping: false,
    isLoading: false,
    error: null,
    sessionId: Math.random().toString(36).substring(2, 15)
  })

  const [analytics, setAnalytics] = useState<ChatAnalytics>({
    messageCount: 0,
    sessionDuration: 0,
    strategiesDiscussed: 0
  })

  const sessionStartTime = useRef<Date>(new Date())
  const typingTimeout = useRef<NodeJS.Timeout | null>(null)
  const messageHistory = useRef<Message[]>([])

  // Initialize with welcome message
  useEffect(() => {
    const welcomeMessage: Message = {
      id: 'welcome-' + Date.now(),
      role: 'assistant',
      content: "👋 Hi! I'm your DeFi AI assistant. I can help you discover and understand DeFi strategies based on your risk preferences. What would you like to explore today?",
      timestamp: new Date(),
      metadata: {
        actionType: 'general',
        confidence: 1.0
      }
    }

    setChatState(prev => ({
      ...prev,
      messages: [welcomeMessage]
    }))

    messageHistory.current = [welcomeMessage]
  }, [])

  // Update analytics when messages change
  useEffect(() => {
    const userMessages = chatState.messages.filter(m => m.role === 'user')
    const strategiesDiscussed = chatState.messages.reduce((count, message) => {
      return count + (message.metadata?.strategies?.length || 0)
    }, 0)

    setAnalytics(prev => ({
      ...prev,
      messageCount: userMessages.length,
      sessionDuration: Date.now() - sessionStartTime.current.getTime(),
      strategiesDiscussed
    }))
  }, [chatState.messages])

  // Enhanced message sending with context awareness
  const sendMessage = useCallback(async (content: string, attachments?: any[]) => {
    const userMessage: Message = {
      id: 'user-' + Date.now(),
      role: 'user',
      content,
      timestamp: new Date()
    }

    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isLoading: true,
      error: null
    }))

    // Track message
    trackChatMessage('user_message', {
      messageLength: content.length,
      hasAttachments: !!attachments?.length,
      sessionId: chatState.sessionId
    })

    try {
      // Simulate typing indicator
      setChatState(prev => ({ ...prev, isTyping: true }))
      
      // Get conversation context
      const context = getConversationContext()
      
      // Call AI service (mock implementation)
      const response = await generateAIResponse(content, context, attachments)
      
      const assistantMessage: Message = {
        id: 'assistant-' + Date.now(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        metadata: response.metadata
      }

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false,
        isTyping: false
      }))

      messageHistory.current = [...messageHistory.current, userMessage, assistantMessage]

      // Track AI response
      trackChatMessage('ai_response', {
        responseType: response.metadata?.actionType,
        confidence: response.metadata?.confidence,
        strategiesIncluded: response.metadata?.strategies?.length || 0,
        sessionId: chatState.sessionId
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get response'
      
      setChatState(prev => ({
        ...prev,
        isLoading: false,
        isTyping: false,
        error: errorMessage
      }))

      trackError('chat_error', errorMessage, {
        sessionId: chatState.sessionId,
        messageContent: content.substring(0, 100) // First 100 chars for context
      })
    }
  }, [chatState.sessionId])

  // Get conversation context for better AI responses
  const getConversationContext = useCallback(() => {
    const recentMessages = messageHistory.current.slice(-10) // Last 10 messages
    const userPreferences = extractUserPreferences(recentMessages)
    const discussedStrategies = extractDiscussedStrategies(recentMessages)
    
    return {
      recentMessages: recentMessages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp
      })),
      userPreferences,
      discussedStrategies,
      sessionDuration: analytics.sessionDuration,
      messageCount: analytics.messageCount
    }
  }, [analytics])

  // Extract user preferences from conversation
  const extractUserPreferences = (messages: Message[]) => {
    const userMessages = messages.filter(m => m.role === 'user')
    const content = userMessages.map(m => m.content.toLowerCase()).join(' ')
    
    return {
      riskTolerance: detectRiskTolerance(content),
      investmentAmount: detectInvestmentAmount(content),
      timeHorizon: detectTimeHorizon(content),
      preferredProtocols: detectPreferredProtocols(content),
      experienceLevel: detectExperienceLevel(content)
    }
  }

  // Extract discussed strategies
  const extractDiscussedStrategies = (messages: Message[]) => {
    return messages
      .filter(m => m.metadata?.strategies)
      .flatMap(m => m.metadata?.strategies || [])
  }

  // AI response generation (mock - replace with actual AI service)
  const generateAIResponse = async (userInput: string, context: any, attachments?: any[]) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

    const input = userInput.toLowerCase()
    
    // Intent detection
    if (input.includes('risk') || input.includes('safe') || input.includes('conservative')) {
      return {
        content: "I understand you're looking for lower-risk strategies. AAVE lending is a great option - it typically offers 2-4% APY with minimal smart contract risk. The protocol has been audited extensively and has a strong track record. Would you like me to show you some specific AAVE strategies?",
        metadata: {
          actionType: 'strategy_recommendation' as const,
          confidence: 0.85,
          strategies: [
            { name: 'AAVE USDC Supply', risk: 2, apy: 3.2 },
            { name: 'AAVE DAI Supply', risk: 2, apy: 2.8 }
          ]
        }
      }
    }
    
    if (input.includes('yield') || input.includes('earn') || input.includes('return')) {
      return {
        content: "For higher yields, you might consider liquidity provision on Uniswap V3. You can earn 5-15% APY depending on the pair, but this comes with impermanent loss risk. The key is choosing the right fee tier and price range. What's your risk tolerance?",
        metadata: {
          actionType: 'strategy_recommendation' as const,
          confidence: 0.78,
          strategies: [
            { name: 'Uniswap V3 USDC/ETH', risk: 6, apy: 12.5 },
            { name: 'Uniswap V3 USDC/USDT', risk: 4, apy: 8.2 }
          ]
        }
      }
    }
    
    if (input.includes('learn') || input.includes('explain') || input.includes('what is')) {
      return {
        content: "I'd be happy to explain! DeFi (Decentralized Finance) lets you earn returns on your crypto without traditional banks. The main strategies are: 1) Lending (like AAVE) - earn interest on deposits, 2) Liquidity providing (like Uniswap) - earn fees from trades, 3) Staking - earn rewards for securing networks. What would you like to learn more about?",
        metadata: {
          actionType: 'education' as const,
          confidence: 0.92,
          sources: ['AAVE Documentation', 'Uniswap V3 Whitepaper']
        }
      }
    }
    
    // Default response
    return {
      content: "I can help you find DeFi strategies that match your goals! Tell me about your risk tolerance and what you'd like to achieve. For example: 'I want steady returns with low risk' or 'I'm looking for high yield opportunities'.",
      metadata: {
        actionType: 'general' as const,
        confidence: 0.6
      }
    }
  }

  // Helper functions for preference detection
  const detectRiskTolerance = (content: string): 'low' | 'medium' | 'high' => {
    if (content.includes('safe') || content.includes('conservative') || content.includes('low risk')) return 'low'
    if (content.includes('aggressive') || content.includes('high risk') || content.includes('risky')) return 'high'
    return 'medium'
  }

  const detectInvestmentAmount = (content: string): number | null => {
    const amounts = content.match(/\$?\d+(?:,\d{3})*(?:\.\d{2})?/g)
    if (amounts) {
      const amount = parseFloat(amounts[0].replace(/[$,]/g, ''))
      return isNaN(amount) ? null : amount
    }
    return null
  }

  const detectTimeHorizon = (content: string): 'short' | 'medium' | 'long' => {
    if (content.includes('short') || content.includes('quick') || content.includes('soon')) return 'short'
    if (content.includes('long') || content.includes('years') || content.includes('hold')) return 'long'
    return 'medium'
  }

  const detectPreferredProtocols = (content: string): string[] => {
    const protocols = ['aave', 'uniswap', 'compound', 'curve', 'yearn', 'lido']
    return protocols.filter(protocol => content.includes(protocol))
  }

  const detectExperienceLevel = (content: string): 'beginner' | 'intermediate' | 'advanced' => {
    if (content.includes('new') || content.includes('beginner') || content.includes('first time')) return 'beginner'
    if (content.includes('experienced') || content.includes('advanced') || content.includes('expert')) return 'advanced'
    return 'intermediate'
  }

  // Chat management functions
  const clearChat = useCallback(() => {
    setChatState(prev => ({
      ...prev,
      messages: [],
      error: null
    }))
    messageHistory.current = []
    sessionStartTime.current = new Date()
  }, [])

  const retryLastMessage = useCallback(() => {
    const lastUserMessage = chatState.messages
      .slice()
      .reverse()
      .find(m => m.role === 'user')
    
    if (lastUserMessage) {
      // Remove messages after the last user message
      const lastUserIndex = chatState.messages.findIndex(m => m.id === lastUserMessage.id)
      const messagesToKeep = chatState.messages.slice(0, lastUserIndex)
      
      setChatState(prev => ({
        ...prev,
        messages: messagesToKeep,
        error: null
      }))
      
      // Resend the message
      sendMessage(lastUserMessage.content)
    }
  }, [chatState.messages, sendMessage])

  const setUserSatisfaction = useCallback((rating: number) => {
    setAnalytics(prev => ({
      ...prev,
      userSatisfaction: rating
    }))

    trackChatMessage('satisfaction_rating', {
      rating,
      sessionId: chatState.sessionId,
      messageCount: analytics.messageCount
    })
  }, [chatState.sessionId, analytics.messageCount])

  // Export conversation for analysis
  const exportConversation = useCallback(() => {
    return {
      sessionId: chatState.sessionId,
      messages: chatState.messages,
      analytics,
      timestamp: new Date().toISOString()
    }
  }, [chatState, analytics])

  return {
    // State
    messages: chatState.messages,
    isTyping: chatState.isTyping,
    isLoading: chatState.isLoading,
    error: chatState.error,
    analytics,
    
    // Actions
    sendMessage,
    clearChat,
    retryLastMessage,
    setUserSatisfaction,
    exportConversation,
    
    // Utilities
    getConversationContext,
    
    // Convenience
    hasMessages: chatState.messages.length > 1, // More than welcome message
    lastMessage: chatState.messages[chatState.messages.length - 1],
    canRetry: !!chatState.error,
  }
}

export default useEnhancedChat