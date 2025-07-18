import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'
import { ShuttleService } from '../ShuttleService'

// Mock axios
vi.mock('axios')
const mockAxios = vi.mocked(axios)

describe('ShuttleService', () => {
  let shuttleService: ShuttleService

  beforeEach(() => {
    vi.clearAllMocks()
    shuttleService = new ShuttleService()
  })

  describe('healthCheck', () => {
    it('should check Shuttle service health and return status', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: 'DynaVest Shuttle Backend is running!',
          error: null
        }
      }
      mockAxios.get.mockResolvedValue(mockResponse)

      const result = await shuttleService.healthCheck()

      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://shuttle-api.dynavest.app/health'
      )
      expect(result.success).toBe(true)
      expect(result.data).toBe('DynaVest Shuttle Backend is running!')
    })

    it('should throw error when health check fails', async () => {
      mockAxios.get.mockRejectedValue(new Error('Service unavailable'))

      await expect(shuttleService.healthCheck()).rejects.toThrow('Service unavailable')
    })
  })

  describe('getDeploymentStatus', () => {
    it('should get deployment status from Shuttle service', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            status: 'running',
            version: '1.0.0',
            deployed_at: '2024-01-15T10:00:00Z',
            endpoints: [
              '/health',
              '/strategies',
              '/contract/strategy',
              '/defiInfo'
            ]
          },
          error: null
        }
      }
      mockAxios.get.mockResolvedValue(mockResponse)

      const result = await shuttleService.getDeploymentStatus()

      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://shuttle-api.dynavest.app/deployment/status'
      )
      expect(result.status).toBe('running')
      expect(result.version).toBe('1.0.0')
      expect(result.endpoints).toContain('/health')
      expect(result.endpoints).toContain('/contract/strategy')
    })

    it('should throw error when deployment status check fails', async () => {
      mockAxios.get.mockRejectedValue(new Error('Deployment status unavailable'))

      await expect(shuttleService.getDeploymentStatus()).rejects.toThrow('Deployment status unavailable')
    })
  })

  describe('deployService', () => {
    it('should trigger deployment pipeline and return deployment info', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            deployment_id: 'deploy-123456',
            status: 'deploying',
            started_at: '2024-01-15T10:30:00Z',
            estimated_completion: '2024-01-15T10:35:00Z'
          },
          error: null
        }
      }
      mockAxios.post.mockResolvedValue(mockResponse)

      const deploymentConfig = {
        environment: 'production',
        version: '1.1.0',
        features: ['contract-integration', 'ai-service']
      }

      const result = await shuttleService.deployService(deploymentConfig)

      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://shuttle-api.dynavest.app/deployment/deploy',
        deploymentConfig
      )
      expect(result.deployment_id).toBe('deploy-123456')
      expect(result.status).toBe('deploying')
    })

    it('should throw error when deployment fails', async () => {
      mockAxios.post.mockRejectedValue(new Error('Deployment failed'))

      const deploymentConfig = {
        environment: 'production',
        version: '1.1.0',
        features: ['contract-integration']
      }

      await expect(shuttleService.deployService(deploymentConfig)).rejects.toThrow('Deployment failed')
    })
  })

  describe('getDeploymentLogs', () => {
    it('should get deployment logs for monitoring pipeline', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            logs: [
              {
                timestamp: '2024-01-15T10:30:00Z',
                level: 'info',
                message: 'Starting deployment process'
              },
              {
                timestamp: '2024-01-15T10:31:00Z',
                level: 'info', 
                message: 'Building Docker image'
              },
              {
                timestamp: '2024-01-15T10:32:00Z',
                level: 'success',
                message: 'Deployment completed successfully'
              }
            ]
          },
          error: null
        }
      }
      mockAxios.get.mockResolvedValue(mockResponse)

      const deploymentId = 'deploy-123456'
      const result = await shuttleService.getDeploymentLogs(deploymentId)

      expect(mockAxios.get).toHaveBeenCalledWith(
        `https://shuttle-api.dynavest.app/deployment/${deploymentId}/logs`
      )
      expect(result.logs).toHaveLength(3)
      expect(result.logs[0].message).toBe('Starting deployment process')
      expect(result.logs[2].level).toBe('success')
    })

    it('should throw error when getting deployment logs fails', async () => {
      mockAxios.get.mockRejectedValue(new Error('Logs unavailable'))

      const deploymentId = 'deploy-123456'

      await expect(shuttleService.getDeploymentLogs(deploymentId)).rejects.toThrow('Logs unavailable')
    })
  })

  describe('proxyRequest', () => {
    it('should proxy GET request to backend service', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { message: 'Proxied response' },
          error: null
        }
      }
      mockAxios.get.mockResolvedValue(mockResponse)

      const proxyConfig = {
        method: 'GET' as const,
        path: '/crypto/prices/DOT,ETH',
        headers: { 'Authorization': 'Bearer token123' }
      }

      const result = await shuttleService.proxyRequest(proxyConfig)

      expect(mockAxios.get).toHaveBeenCalledWith(
        'https://shuttle-api.dynavest.app/crypto/prices/DOT,ETH',
        { headers: proxyConfig.headers }
      )
      expect(result.success).toBe(true)
      expect(result.data.message).toBe('Proxied response')
    })

    it('should proxy POST request with data to backend service', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { strategy_id: 42 },
          error: null
        }
      }
      mockAxios.post.mockResolvedValue(mockResponse)

      const proxyConfig = {
        method: 'POST' as const,
        path: '/contract/strategy',
        data: {
          name: 'Test Strategy',
          risk_level: 5,
          parameters: '{"protocol": "polkadot"}'
        },
        headers: { 'Content-Type': 'application/json' }
      }

      const result = await shuttleService.proxyRequest(proxyConfig)

      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://shuttle-api.dynavest.app/contract/strategy',
        proxyConfig.data,
        { headers: proxyConfig.headers }
      )
      expect(result.success).toBe(true)
      expect(result.data.strategy_id).toBe(42)
    })

    it('should throw error when proxy request fails', async () => {
      mockAxios.get.mockRejectedValue(new Error('Proxy failed'))

      const proxyConfig = {
        method: 'GET' as const,
        path: '/health'
      }

      await expect(shuttleService.proxyRequest(proxyConfig)).rejects.toThrow('Proxy failed')
    })
  })

  describe('configureProxy', () => {
    it('should configure proxy settings for load balancing', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            proxy_id: 'proxy-config-123',
            load_balancer: {
              strategy: 'round-robin',
              health_check_interval: 30,
              timeout: 5000
            },
            upstreams: [
              'https://primary-backend.shuttle.app',
              'https://secondary-backend.shuttle.app'
            ]
          },
          error: null
        }
      }
      mockAxios.post.mockResolvedValue(mockResponse)

      const proxySettings = {
        load_balancer: {
          strategy: 'round-robin',
          health_check_interval: 30,
          timeout: 5000
        },
        upstreams: [
          'https://primary-backend.shuttle.app',
          'https://secondary-backend.shuttle.app'
        ]
      }

      const result = await shuttleService.configureProxy(proxySettings)

      expect(mockAxios.post).toHaveBeenCalledWith(
        'https://shuttle-api.dynavest.app/proxy/configure',
        proxySettings
      )
      expect(result.proxy_id).toBe('proxy-config-123')
      expect(result.load_balancer.strategy).toBe('round-robin')
      expect(result.upstreams).toHaveLength(2)
    })

    it('should throw error when proxy configuration fails', async () => {
      mockAxios.post.mockRejectedValue(new Error('Proxy configuration failed'))

      const proxySettings = {
        load_balancer: { strategy: 'round-robin', health_check_interval: 30, timeout: 5000 },
        upstreams: ['https://backend.shuttle.app']
      }

      await expect(shuttleService.configureProxy(proxySettings)).rejects.toThrow('Proxy configuration failed')
    })
  })
})