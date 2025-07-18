/**
 * Smart conversation starters and prompts to guide users
 */

export const CONVERSATION_STARTERS = [
  {
    text: "🎯 Find me a low-risk strategy",
    category: "strategy"
  },
  {
    text: "💰 Show me high-yield opportunities",
    category: "strategy"
  },
  {
    text: "🔒 What's the safest way to earn yield?",
    category: "education"
  },
  {
    text: "⚡ Tell me about Polkadot DeFi",
    category: "education"
  },
  {
    text: "📊 Build me a diversified portfolio",
    category: "portfolio"
  },
  {
    text: "🌊 Explain liquid staking",
    category: "education"
  }
];

export const HELP_PROMPTS = [
  "Try asking me things like:",
  "• 'Find me a low-risk strategy'",
  "• 'What's liquid staking?'",
  "• 'Show me Polkadot opportunities'",
  "• 'Build me a portfolio with $1000'",
  "• 'Explain Acala staking'",
  "",
  "I'm here to help you navigate DeFi safely! 🚀"
];

export function getRandomConversationStarter(): string {
  const starters = CONVERSATION_STARTERS;
  return starters[Math.floor(Math.random() * starters.length)].text;
}

export function getHelpText(): string {
  return HELP_PROMPTS.join('\n');
}