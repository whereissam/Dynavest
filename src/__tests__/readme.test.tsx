import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('README.md Documentation and Integration Instructions', () => {
  const readmePath = path.join(process.cwd(), 'README.md')
  let readmeContent: string

  beforeAll(() => {
    expect(fs.existsSync(readmePath)).toBe(true)
    readmeContent = fs.readFileSync(readmePath, 'utf8')
  })

  describe('Essential Documentation Sections', () => {
    it('should have project title and description', () => {
      expect(readmeContent).toContain('# DynaVest')
      expect(readmeContent).toContain('AI-powered DeFi investment platform')
      expect(readmeContent).toContain('DeFAI Agent')
    })

    it('should list key features', () => {
      expect(readmeContent).toContain('## ✨ Features')
      expect(readmeContent).toContain('AI-Powered Chat Interface')
      expect(readmeContent).toContain('Multi-Chain Support')
      expect(readmeContent).toContain('Smart Wallet Integration')
      expect(readmeContent).toContain('DeFi Strategies')
    })

    it('should describe tech stack comprehensively', () => {
      expect(readmeContent).toContain('## 🛠️ Tech Stack')
      expect(readmeContent).toContain('Next.js 15')
      expect(readmeContent).toContain('Shuttle.dev')
      expect(readmeContent).toContain('ink!')
      expect(readmeContent).toContain('Polkadot')
    })
  })

  describe('Installation and Setup Instructions', () => {
    it('should provide quick start guide', () => {
      expect(readmeContent).toContain('## 🚀 Quick Start')
      expect(readmeContent).toContain('### Prerequisites')
      expect(readmeContent).toContain('### Installation')
    })

    it('should list all required prerequisites', () => {
      expect(readmeContent).toContain('Node.js 18+')
      expect(readmeContent).toContain('pnpm')
      expect(readmeContent).toContain('Rust')
      expect(readmeContent).toContain('cargo-contract')
      expect(readmeContent).toContain('Shuttle CLI')
    })

    it('should provide frontend setup instructions', () => {
      expect(readmeContent).toContain('#### Frontend Setup')
      expect(readmeContent).toContain('git clone')
      expect(readmeContent).toContain('pnpm install')
      expect(readmeContent).toContain('pnpm run dev')
      expect(readmeContent).toContain('.env.local')
    })

    it('should provide smart contract setup instructions', () => {
      expect(readmeContent).toContain('#### Smart Contract Setup')
      expect(readmeContent).toContain('cargo-contract')
      expect(readmeContent).toContain('./build.sh')
      expect(readmeContent).toContain('./deploy.sh')
    })

    it('should provide backend setup instructions', () => {
      expect(readmeContent).toContain('#### Backend Setup')
      expect(readmeContent).toContain('shuttle auth login')
      expect(readmeContent).toContain('./dev.sh')
      expect(readmeContent).toContain('./deploy.sh')
    })
  })

  describe('Environment Configuration', () => {
    it('should have comprehensive environment configuration section', () => {
      expect(readmeContent).toContain('## 🔧 Environment Configuration')
      expect(readmeContent).toContain('### Required Environment Variables')
      expect(readmeContent).toContain('.env.local')
    })

    it('should list all required environment variables', () => {
      expect(readmeContent).toContain('NEXT_PUBLIC_PRIVY_APP_ID')
      expect(readmeContent).toContain('NEXT_PUBLIC_ALCHEMY_API_KEY')
      expect(readmeContent).toContain('NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID')
      expect(readmeContent).toContain('NEXT_PUBLIC_SHUTTLE_API_URL')
    })

    it('should provide setup instructions for external services', () => {
      expect(readmeContent).toContain('#### 1. **Privy Authentication Setup**')
      expect(readmeContent).toContain('#### 2. **Alchemy API Configuration**')
      expect(readmeContent).toContain('dashboard.privy.io')
      expect(readmeContent).toContain('dashboard.alchemy.com')
    })

    it('should include security notes', () => {
      expect(readmeContent).toContain('### Security Notes')
      expect(readmeContent).toContain('Never commit `.env.local`')
      expect(readmeContent).toContain('Rotate API keys')
    })
  })

  describe('Architecture Documentation', () => {
    it('should document technical architecture', () => {
      expect(readmeContent).toContain('## 🏗️ Technical Architecture')
      expect(readmeContent).toContain('### Application Architecture Overview')
      expect(readmeContent).toContain('### Project Structure')
    })

    it('should include architecture diagrams or descriptions', () => {
      expect(readmeContent).toContain('Next.js Frontend')
      expect(readmeContent).toContain('Shuttle.dev Backend')
      expect(readmeContent).toContain('Polkadot/Moonbeam')
      expect(readmeContent).toContain('Data Flow Architecture')
    })

    it('should explain architectural patterns', () => {
      expect(readmeContent).toContain('### Core Architecture Patterns')
      expect(readmeContent).toContain('Component Architecture')
      expect(readmeContent).toContain('State Management Pattern')
      expect(readmeContent).toContain('Strategy Pattern')
    })
  })

  describe('DeFi Integration Information', () => {
    it('should list available DeFi strategies', () => {
      expect(readmeContent).toContain('## 🌟 DeFi Strategies Available')
      expect(readmeContent).toContain('### Lending Strategies')
      expect(readmeContent).toContain('### Liquidity Provision')
      expect(readmeContent).toContain('AAVE')
      expect(readmeContent).toContain('Uniswap')
    })

    it('should document supported networks', () => {
      expect(readmeContent).toContain('## 🌍 Supported Networks')
      expect(readmeContent).toContain('Arbitrum')
      expect(readmeContent).toContain('Base')
      expect(readmeContent).toContain('Moonbeam')
      expect(readmeContent).toContain('Polkadot')
    })

    it('should provide contract deployment information', () => {
      expect(readmeContent).toContain('## 📊 Smart Contract Deployments')
      expect(readmeContent).toContain('### Celo Network')
      expect(readmeContent).toContain('### Moonbeam Network')
      expect(readmeContent).toContain('Strategy Manager')
    })
  })

  describe('Deployment Guide', () => {
    it('should provide complete deployment instructions', () => {
      expect(readmeContent).toContain('## 🚀 Deployment Guide')
      expect(readmeContent).toContain('### Complete Deployment Steps')
      expect(readmeContent).toContain('1. **Deploy Smart Contract**')
      expect(readmeContent).toContain('2. **Deploy Backend API**')
      expect(readmeContent).toContain('3. **Deploy Frontend**')
    })

    it('should include integration testing instructions', () => {
      expect(readmeContent).toContain('4. **Test the Integration**')
      expect(readmeContent).toContain('curl -X POST')
      expect(readmeContent).toContain('/strategies')
    })

    it('should provide monitoring and maintenance guidance', () => {
      expect(readmeContent).toContain('### Monitoring and Maintenance')
      expect(readmeContent).toContain('Monitor contract events')
      expect(readmeContent).toContain('Check backend logs')
      expect(readmeContent).toContain('Backup strategy data')
    })
  })

  describe('Usage Instructions and Scripts', () => {
    it('should document available scripts', () => {
      expect(readmeContent).toContain('### Available Scripts')
      expect(readmeContent).toContain('#### Frontend Scripts')
      expect(readmeContent).toContain('#### Smart Contract Scripts')
      expect(readmeContent).toContain('#### Backend Scripts')
    })

    it('should explain package manager requirements', () => {
      expect(readmeContent).toContain('## 🔧 Why pnpm?')
      expect(readmeContent).toContain('preinstall script')
      expect(readmeContent).toContain('Consistent dependencies')
    })
  })

  describe('Project Information and Links', () => {
    it('should include project links and resources', () => {
      expect(readmeContent).toContain('## 🔗 Links')
      expect(readmeContent).toContain('Website')
      expect(readmeContent).toContain('Documentation')
      expect(readmeContent).toContain('Discord')
    })

    it('should have contributing guidelines', () => {
      expect(readmeContent).toContain('## 🤝 Contributing')
      expect(readmeContent).toContain('Fork the repository')
      expect(readmeContent).toContain('Create a feature branch')
      expect(readmeContent).toContain('Pull Request')
    })

    it('should include license information', () => {
      expect(readmeContent).toContain('## 📝 License')
      expect(readmeContent).toContain('MIT License')
    })

    it('should have appropriate disclaimers', () => {
      expect(readmeContent).toContain('## ⚠️ Disclaimer')
      expect(readmeContent).toContain('experimental software')
      expect(readmeContent).toContain('inherent risks')
      expect(readmeContent).toContain('do your own research')
    })
  })

  describe('Integration-Specific Requirements', () => {
    it('should document Polkadot/Moonbeam integration', () => {
      expect(readmeContent).toContain('### Polkadot Integration')
      expect(readmeContent).toContain('Strategy Storage')
      expect(readmeContent).toContain('Cross-Chain Compatibility')
      expect(readmeContent).toContain('ink! Contracts')
    })

    it('should provide API endpoint documentation', () => {
      expect(readmeContent).toContain('API Features')
      expect(readmeContent).toContain('RESTful endpoints')
      expect(readmeContent).toContain('PostgreSQL database')
      expect(readmeContent).toContain('CORS enabled')
    })

    it('should document testing procedures', () => {
      expect(readmeContent).toContain('cargo test')
      expect(readmeContent).toContain('./dev.sh test')
      expect(readmeContent).toContain('./dev.sh api-test')
    })
  })

  describe('Code Quality and Documentation Standards', () => {
    it('should have proper markdown formatting', () => {
      // Check for proper heading structure
      expect(readmeContent).toMatch(/^# .*$/m) // Main title
      expect(readmeContent).toMatch(/^## .*$/m) // Section headers
      expect(readmeContent).toMatch(/^### .*$/m) // Subsection headers
    })

    it('should use code blocks for commands and code examples', () => {
      expect(readmeContent).toContain('```bash')
      expect(readmeContent).toContain('```typescript')
      expect(readmeContent).toContain('```')
    })

    it('should include visual elements like emojis and tables', () => {
      expect(readmeContent).toContain('| Network | Protocols Available | Strategy Storage |')
      expect(readmeContent).toMatch(/[✨🚀🛠️🌟🌍📊🔧🏗️🤝📝⚠️🔗]/u)
    })

    it('should have comprehensive project structure documentation', () => {
      expect(readmeContent).toContain('DynaVest/')
      expect(readmeContent).toContain('├── src/')
      expect(readmeContent).toContain('├── contracts/')
      expect(readmeContent).toContain('├── shuttle-backend/')
    })
  })
})