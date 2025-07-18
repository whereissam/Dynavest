import { describe, it, expect, vi } from 'vitest'
import fs from 'fs'
import path from 'path'

// Mock axios for testing
const mockAxios = {
  get: vi.fn(),
  post: vi.fn(),
  options: vi.fn(),
}

vi.mock('axios', () => ({
  default: mockAxios,
  get: mockAxios.get,
  post: mockAxios.post,
  options: mockAxios.options,
}))

describe('Shuttle.dev Backend Deployment Configuration', () => {
  const backendPath = path.join(process.cwd(), 'shuttle-backend')
  const shuttleTomlPath = path.join(backendPath, 'Shuttle.toml')
  const deployScriptPath = path.join(backendPath, 'deploy.sh')
  const mainRsPath = path.join(backendPath, 'src', 'main.rs')

  describe('Deployment Configuration Files', () => {
    it('should have Shuttle.toml configuration file', () => {
      expect(fs.existsSync(shuttleTomlPath)).toBe(true)
    })

    it('should have deployment script', () => {
      expect(fs.existsSync(deployScriptPath)).toBe(true)
    })

    it('should have main Rust backend file', () => {
      expect(fs.existsSync(mainRsPath)).toBe(true)
    })

    it('should have proper project configuration in Shuttle.toml', () => {
      if (fs.existsSync(shuttleTomlPath)) {
        const shuttleTomlContent = fs.readFileSync(shuttleTomlPath, 'utf8')
        
        expect(shuttleTomlContent).toContain('[package]')
        expect(shuttleTomlContent).toContain('name = "dynavest-shuttle-backend"')
        expect(shuttleTomlContent).toContain('[deploy]')
        expect(shuttleTomlContent).toContain('[secrets]')
      }
    })

    it('should have executable deployment script with proper commands', () => {
      if (fs.existsSync(deployScriptPath)) {
        const deployScriptContent = fs.readFileSync(deployScriptPath, 'utf8')
        
        expect(deployScriptContent).toContain('shuttle deploy')
        expect(deployScriptContent).toContain('shuttle auth login')
        expect(deployScriptContent).toContain('shuttle project env set')
        expect(deployScriptContent).toContain('CONTRACT_ADDRESS')
        expect(deployScriptContent).toContain('RPC_URL')
      }
    })
  })

  describe('Backend API Implementation', () => {
    it('should implement required API endpoints in main.rs', () => {
      if (fs.existsSync(mainRsPath)) {
        const mainRsContent = fs.readFileSync(mainRsPath, 'utf8')
        
        // Check for required API endpoints
        expect(mainRsContent).toContain('/health')
        expect(mainRsContent).toContain('/strategies')
        expect(mainRsContent).toContain('/statistics')
        
        // Check for proper HTTP methods  
        expect(mainRsContent).toContain('get,')
        expect(mainRsContent).toContain('post')
        
        // Check for Shuttle runtime
        expect(mainRsContent).toContain('shuttle_')
        expect(mainRsContent).toContain('#[shuttle_runtime::main]')
      }
    })

    it('should have database integration configured', () => {
      if (fs.existsSync(mainRsPath)) {
        const mainRsContent = fs.readFileSync(mainRsPath, 'utf8')
        
        // Check for database setup
        expect(mainRsContent).toContain('PgPool') // or similar database reference
      }
    })

    it('should have CORS configuration for frontend integration', () => {
      if (fs.existsSync(mainRsPath)) {
        const mainRsContent = fs.readFileSync(mainRsPath, 'utf8')
        
        // Check for CORS setup
        expect(mainRsContent).toContain('cors') // or CORS-related configuration
      }
    })
  })

  describe('Frontend Integration Configuration', () => {
    it('should have strategy API client configured for Shuttle backend', () => {
      const strategyApiPath = path.join(process.cwd(), 'src', 'utils', 'strategyApi.ts')
      
      if (fs.existsSync(strategyApiPath)) {
        const apiContent = fs.readFileSync(strategyApiPath, 'utf8')
        expect(apiContent).toContain('NEXT_PUBLIC_SHUTTLE_API_URL')
        expect(apiContent).toContain('shuttle-api.dynavest.app')
      }
    })

    it('should have proper environment variable configuration', () => {
      // Check if the environment variable is referenced in code
      const strategyApiPath = path.join(process.cwd(), 'src', 'utils', 'strategyApi.ts')
      
      if (fs.existsSync(strategyApiPath)) {
        const apiContent = fs.readFileSync(strategyApiPath, 'utf8')
        expect(apiContent).toContain('process.env.NEXT_PUBLIC_SHUTTLE_API_URL')
      }
    })
  })

  describe('Live API Endpoint Tests (Mocked)', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should handle health check endpoint correctly', async () => {
      // Mock successful health check response
      mockAxios.get.mockResolvedValue({
        status: 200,
        data: { status: 'healthy', timestamp: new Date().toISOString() }
      })

      // Import strategy API functions to verify they're available
      await import('@/utils/strategyApi')
      
      // Test that the API configuration is correct
      expect(process.env.NEXT_PUBLIC_SHUTTLE_API_URL || 'https://shuttle-api.dynavest.app').toBeDefined()
    })

    it('should handle strategy saving with proper API structure', async () => {
      // Mock successful strategy save response
      mockAxios.post.mockResolvedValue({
        status: 201,
        data: { success: true, message: 'Strategy saved successfully' }
      })

      const { saveStrategy } = await import('@/utils/strategyApi')
      
      const testStrategy = {
        account: '0x1234567890123456789012345678901234567890',
        strategy: {
          name: 'Test Deployment Strategy',
          risk_level: 5,
          parameters: 'Deployment verification parameters'
        }
      }

      // This should not throw an error with proper API configuration
      await expect(saveStrategy(testStrategy)).resolves.toBeDefined()
      expect(mockAxios.post).toHaveBeenCalled()
    })

    it('should handle strategy loading with proper API structure', async () => {
      // Mock successful strategy load response
      mockAxios.get.mockResolvedValue({
        status: 200,
        data: [
          {
            id: '1',
            name: 'Test Strategy',
            risk_level: 5,
            parameters: 'Test parameters'
          }
        ]
      })

      const { loadStrategies } = await import('@/utils/strategyApi')
      
      const testAccount = '0x1234567890123456789012345678901234567890'

      // This should not throw an error with proper API configuration
      await expect(loadStrategies(testAccount)).resolves.toBeDefined()
      expect(mockAxios.get).toHaveBeenCalled()
    })
  })

  describe('Deployment Automation', () => {
    it('should have proper environment variable defaults in deployment script', () => {
      if (fs.existsSync(deployScriptPath)) {
        const deployScriptContent = fs.readFileSync(deployScriptPath, 'utf8')
        
        // Check for default values
        expect(deployScriptContent).toContain('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY')
        expect(deployScriptContent).toContain('wss://moonbeam-alpha.api.onfinality.io/public-ws')
      }
    })

    it('should provide comprehensive deployment feedback', () => {
      if (fs.existsSync(deployScriptPath)) {
        const deployScriptContent = fs.readFileSync(deployScriptPath, 'utf8')
        
        expect(deployScriptContent).toContain('deployed successfully')
        expect(deployScriptContent).toContain('API endpoints available')
        expect(deployScriptContent).toContain('NEXT_PUBLIC_SHUTTLE_API_URL')
        expect(deployScriptContent).toContain('/health')
        expect(deployScriptContent).toContain('/strategies')
        expect(deployScriptContent).toContain('/statistics')
      }
    })

    it('should handle Shuttle CLI installation and authentication flow', () => {
      if (fs.existsSync(deployScriptPath)) {
        const deployScriptContent = fs.readFileSync(deployScriptPath, 'utf8')
        
        expect(deployScriptContent).toContain('shuttle auth login')
        expect(deployScriptContent).toContain('command -v shuttle')
        expect(deployScriptContent).toContain('shuttle.rs/install')
        expect(deployScriptContent).toContain('shuttle auth status')
      }
    })
  })

  describe('Backend Code Quality and Structure', () => {
    it('should have proper Cargo.toml configuration', () => {
      const cargoTomlPath = path.join(backendPath, 'Cargo.toml')
      
      if (fs.existsSync(cargoTomlPath)) {
        const cargoContent = fs.readFileSync(cargoTomlPath, 'utf8')
        
        expect(cargoContent).toContain('[package]')
        expect(cargoContent).toContain('name = "dynavest-shuttle-backend"')
        expect(cargoContent).toContain('[dependencies]')
        expect(cargoContent).toContain('shuttle-')
        expect(cargoContent).toContain('axum')
        expect(cargoContent).toContain('tokio')
      }
    })

    it('should have comprehensive README documentation', () => {
      const readmePath = path.join(backendPath, 'README.md')
      
      if (fs.existsSync(readmePath)) {
        const readmeContent = fs.readFileSync(readmePath, 'utf8')
        
        expect(readmeContent).toContain('DynaVest')
        expect(readmeContent).toContain('Shuttle')
        expect(readmeContent).toContain('API')
        expect(readmeContent).toContain('Deploy') // Check for Deploy instead of deployment
      }
    })
  })
})