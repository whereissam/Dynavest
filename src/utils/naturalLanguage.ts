/**
 * Natural Language Understanding utilities
 * Helps determine user intent and provide appropriate responses
 */

import { getHelpText } from './chatStarters';

// Greeting patterns
const GREETING_PATTERNS = [
  /^(hi|hello|hey|greetings?|good\s+(morning|afternoon|evening)|sup|what'?s\s+up)(\s|!|\?|\.)*$/i,
  /^(howdy|yo|hiya|heya)(\s|!|\?|\.)*$/i
];

// Casual conversation patterns that shouldn't trigger strategy responses
const CASUAL_PATTERNS = [
  /^(how\s+are\s+you|how\s+r\s+u|what'?s\s+up|how'?s\s+it\s+going)(\s|!|\?|\.)*$/i,
  /^(thank\s*you|thanks|thx|ty|bye|goodbye|see\s+ya|later|cya)(\s|!|\?|\.)*$/i,
  /^(ok|okay|cool|nice|great|awesome|sure|alright|got\s+it)(\s|!|\?|\.)*$/i,
  /^(help|what\s+can\s+you\s+do|commands|options)(\s|!|\?|\.)*$/i
];

// DeFi/Investment intent patterns
const DEFI_INTENT_PATTERNS = [
  /\b(invest|investment|strategy|strategies|defi|yield|apy|staking|liquidity|portfolio)\b/i,
  /\b(earn|profit|return|gains|compound|pool|farming|lending|borrowing)\b/i,
  /\b(token|crypto|coin|bitcoin|ethereum|polkadot|dot|usdc|usdt)\b/i,
  /\b(risk|safety|secure|passive|active|diversify|allocate)\b/i,
  /\b(acala|bifrost|hydra|uniswap|aave|compound|curve)\b/i
];

export function classifyUserIntent(message: string): 'greeting' | 'casual' | 'defi' | 'help' | 'unknown' {
  const trimmed = message.trim();
  
  // Check for greetings
  if (GREETING_PATTERNS.some(pattern => pattern.test(trimmed))) {
    return 'greeting';
  }
  
  // Check for casual conversation
  if (CASUAL_PATTERNS.some(pattern => pattern.test(trimmed))) {
    return 'casual';
  }
  
  // Check for help requests
  if (/\b(help|what\s+can\s+you\s+do|commands|options|how\s+to)\b/i.test(trimmed)) {
    return 'help';
  }
  
  // Check for DeFi/investment intent
  if (DEFI_INTENT_PATTERNS.some(pattern => pattern.test(trimmed))) {
    return 'defi';
  }
  
  return 'unknown';
}

export function generateGreetingResponse(): string {
  const greetings = [
    "Hi there! 👋 I'm your DeFi assistant. I can help you find investment strategies, analyze your portfolio, or answer questions about DeFi protocols.",
    "Hello! 🚀 I'm here to help you navigate the world of DeFi. What would you like to explore today?",
    "Hey! 💼 I'm your personal DeFi advisor. I can recommend strategies, explain protocols, or help you build a diversified portfolio.",
    "Hi! 🌟 Welcome to DynaVest! I can help you with investment strategies, risk analysis, and DeFi opportunities."
  ];
  
  return greetings[Math.floor(Math.random() * greetings.length)];
}

export function generateCasualResponse(intent: string): string {
  const responses = {
    casual: [
      "I'm doing great, thanks for asking! How can I help you with your DeFi journey today?",
      "All good here! Ready to help you discover some amazing investment opportunities. What interests you?",
      "Doing well! I'm excited to help you explore DeFi strategies. What would you like to know?"
    ],
    help: [
      `I'm your DeFi assistant! Here's what I can help you with:\n\n${getHelpText()}`,
      "I specialize in DeFi and can help you with:\n• Finding investment strategies\n• Risk analysis & safety tips\n• Portfolio recommendations\n• Protocol explanations (Acala, Bifrost, etc.)\n• Market insights\n\nTry asking me something like 'Find me a low-risk strategy' or 'Explain liquid staking'!"
    ],
    unknown: [
      `I'm not sure I understand that. I specialize in DeFi and investment strategies.\n\n${getHelpText()}`,
      "Could you clarify what you're looking for? I'm here to help with DeFi strategies, investment advice, and protocol information. Try asking about specific strategies or protocols!"
    ]
  };
  
  const intentResponses = responses[intent as keyof typeof responses];
  if (intentResponses) {
    return intentResponses[Math.floor(Math.random() * intentResponses.length)];
  }
  
  return responses.unknown[0];
}