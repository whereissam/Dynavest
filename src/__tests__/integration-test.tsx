import { useState, useEffect } from 'react'
import { useChat } from '@/contexts/ChatContext'
import { usePolkadotWallet } from '@/components/PolkadotWallet/PolkadotWalletProvider'
import { ContractService } from '@/services/ContractService'
import { DynaVestService } from '@/services/DynaVestService'

// This page is for development/testing only
export async function getStaticProps() {
  return {
    props: {},
  }
}

export default function IntegrationTest() {
  const [testResults, setTestResults] = useState<{
    shuttleHealth: string | null;
    aiService: string | null;
    walletConnection: string | null;
    contractService: string | null;
  }>({
    shuttleHealth: null,
    aiService: null,
    walletConnection: null,
    contractService: null
  })
  const [userInput, setUserInput] = useState('I want a conservative investment strategy')
  const [aiRecommendation, setAiRecommendation] = useState<any>(null)
  
  const { sendMessage } = useChat()
  const { account, isConnected, connectWallet, accounts } = usePolkadotWallet()

  // Test 1: Shuttle Backend Health
  const testShuttleHealth = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SHUTTLE_API_URL}/health`)
      const data = await response.json()
      setTestResults(prev => ({ ...prev, shuttleHealth: data.success ? 'PASS' : 'FAIL' }))
    } catch (error) {
      setTestResults(prev => ({ ...prev, shuttleHealth: 'FAIL' }))
    }
  }

  // Test 2: AI Service
  const testAIService = async () => {
    try {
      const dynaVestService = new DynaVestService()
      const response = await dynaVestService.getDefiRecommendations(userInput)
      setAiRecommendation(response)
      setTestResults(prev => ({ ...prev, aiService: response ? 'PASS' : 'FAIL' }))
    } catch (error) {
      setTestResults(prev => ({ ...prev, aiService: 'FAIL' }))
    }
  }

  // Test 3: Wallet Connection
  const testWalletConnection = async () => {
    try {
      if (!isConnected) {
        await connectWallet()
      }
      setTestResults(prev => ({ ...prev, walletConnection: isConnected ? 'PASS' : 'FAIL' }))
    } catch (error) {
      setTestResults(prev => ({ ...prev, walletConnection: 'FAIL' }))
    }
  }

  // Test 4: Contract Service
  const testContractService = async () => {
    if (!isConnected || !aiRecommendation) {
      setTestResults(prev => ({ ...prev, contractService: 'SKIP - Need wallet + AI' }))
      return
    }

    try {
      const contractService = new ContractService()
      const userAddress = account?.address || 'test-address'
      const result = await contractService.createStrategyOnChain(userAddress, {
        name: 'Test Strategy from Integration',
        risk_level: 5,
        parameters: JSON.stringify(aiRecommendation),
        initial_investment: 100
      })
      setTestResults(prev => ({ ...prev, contractService: result > 0 ? 'PASS' : 'FAIL' }))
    } catch (error) {
      setTestResults(prev => ({ ...prev, contractService: 'FAIL' }))
    }
  }

  // Auto-run first test on mount
  useEffect(() => {
    testShuttleHealth()
  }, [])

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'PASS': return 'text-green-600 bg-green-50'
      case 'FAIL': return 'text-red-600 bg-red-50'
      case null: return 'text-gray-600 bg-gray-50'
      default: return 'text-yellow-600 bg-yellow-50'
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🧪 DynaVest Integration Test</h1>
        <p className="text-gray-600">Test the complete flow from AI → Wallet → Contract deployment</p>
      </div>

      {/* Environment Info */}
      <div className="mb-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">📋 Environment Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Shuttle API URL:</strong>
            <br />
            <code className="bg-white p-1 rounded text-xs">
              {process.env.NEXT_PUBLIC_SHUTTLE_API_URL || 'NOT SET'}
            </code>
          </div>
          <div>
            <strong>Chatbot URL:</strong>
            <br />
            <code className="bg-white p-1 rounded text-xs">
              {process.env.NEXT_PUBLIC_CHATBOT_URL || 'NOT SET'}
            </code>
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Object.entries(testResults).map(([test, status]) => (
          <div key={test} className={`p-4 rounded-lg border ${getStatusColor(status)}`}>
            <h3 className="font-semibold capitalize">{test.replace(/([A-Z])/g, ' $1')}</h3>
            <div className="text-2xl font-bold mt-2">
              {status || 'PENDING'}
            </div>
          </div>
        ))}
      </div>

      {/* Test Controls */}
      <div className="space-y-6">
        {/* Test 1: Shuttle Health */}
        <div className="p-6 border rounded-lg">
          <h3 className="text-xl font-semibold mb-3">1. 🚀 Shuttle Backend Health</h3>
          <p className="text-gray-600 mb-3">Verify that the Shuttle backend is deployed and responding</p>
          <button
            onClick={testShuttleHealth}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Test Shuttle Health
          </button>
        </div>

        {/* Test 2: AI Service */}
        <div className="p-6 border rounded-lg">
          <h3 className="text-xl font-semibold mb-3">2. 🤖 AI Service</h3>
          <p className="text-gray-600 mb-3">Test AI-powered DeFi recommendations</p>
          <div className="mb-3">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Enter your investment goal..."
              className="w-full p-2 border rounded"
            />
          </div>
          <button
            onClick={testAIService}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Test AI Service
          </button>
          {aiRecommendation && (
            <div className="mt-3 p-3 bg-green-50 rounded">
              <strong>AI Response:</strong>
              <pre className="text-sm mt-2 whitespace-pre-wrap">
                {JSON.stringify(aiRecommendation, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Test 3: Wallet Connection */}
        <div className="p-6 border rounded-lg">
          <h3 className="text-xl font-semibold mb-3">3. 🔗 Polkadot Wallet</h3>
          <p className="text-gray-600 mb-3">Connect to Polkadot.js extension</p>
          <div className="mb-3">
            <div className="text-sm">
              <strong>Status:</strong> {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </div>
            {isConnected && account && (
              <div className="text-sm mt-1">
                <strong>Account:</strong> {account.meta.name} ({account.address.slice(0, 10)}...)
              </div>
            )}
            {accounts.length > 0 && (
              <div className="text-sm mt-1">
                <strong>Available Accounts:</strong> {accounts.length}
              </div>
            )}
          </div>
          <button
            onClick={testWalletConnection}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            {isConnected ? 'Test Connection' : 'Connect Wallet'}
          </button>
        </div>

        {/* Test 4: Contract Service */}
        <div className="p-6 border rounded-lg">
          <h3 className="text-xl font-semibold mb-3">4. 📄 Contract Deployment</h3>
          <p className="text-gray-600 mb-3">Deploy strategy to ink! smart contract</p>
          <div className="mb-3 text-sm">
            <strong>Prerequisites:</strong>
            <ul className="list-disc list-inside mt-1">
              <li className={isConnected ? 'text-green-600' : 'text-red-600'}>
                {isConnected ? '✅' : '❌'} Wallet Connected
              </li>
              <li className={aiRecommendation ? 'text-green-600' : 'text-red-600'}>
                {aiRecommendation ? '✅' : '❌'} AI Recommendation Available
              </li>
            </ul>
          </div>
          <button
            onClick={testContractService}
            disabled={!isConnected || !aiRecommendation}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-400"
          >
            Deploy Test Strategy
          </button>
        </div>
      </div>

      {/* Integration Summary */}
      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-xl font-semibold mb-3">🎯 Integration Summary</h3>
        <div className="text-sm space-y-2">
          <div>
            <strong>Complete Flow Status:</strong>
            {Object.values(testResults).every(status => status === 'PASS') ? (
              <span className="ml-2 text-green-600 font-semibold">🎉 ALL TESTS PASSING</span>
            ) : (
              <span className="ml-2 text-yellow-600">⚠️ Some tests need attention</span>
            )}
          </div>
          <div>
            <strong>Next Steps:</strong>
            <ul className="list-disc list-inside mt-1 ml-4">
              <li>Ensure Shuttle backend is deployed and URL is configured</li>
              <li>Install Polkadot.js browser extension</li>
              <li>Test complete flow: AI → Wallet → Contract</li>
              <li>Check browser console for detailed error messages</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}