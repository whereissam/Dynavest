import axios from 'axios'

const SHUTTLE_API_BASE_URL = process.env.NEXT_PUBLIC_SHUTTLE_API_URL || 'http://localhost:8000'

export interface ShuttleHealthResponse {
  success: boolean
  data: string
  error: string | null
}

export interface DeploymentStatus {
  status: string
  version: string
  deployed_at: string
  endpoints: string[]
}

export interface ShuttleDeploymentResponse {
  success: boolean
  data: DeploymentStatus
  error: string | null
}

export interface DeploymentConfig {
  environment: string
  version: string
  features: string[]
}

export interface DeploymentInfo {
  deployment_id: string
  status: string
  started_at: string
  estimated_completion: string
}

export interface DeploymentLog {
  timestamp: string
  level: string
  message: string
}

export interface DeploymentLogsResponse {
  logs: DeploymentLog[]
}

export interface ProxyRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  data?: any
  headers?: Record<string, string>
}

export interface ProxyResponse {
  success: boolean
  data: any
  error: string | null
}

export interface LoadBalancerConfig {
  strategy: string
  health_check_interval: number
  timeout: number
}

export interface ProxySettings {
  load_balancer: LoadBalancerConfig
  upstreams: string[]
}

export interface ProxyConfigResponse {
  proxy_id: string
  load_balancer: LoadBalancerConfig
  upstreams: string[]
}

export class ShuttleService {
  async healthCheck(): Promise<ShuttleHealthResponse> {
    try {
      const response = await axios.get(`${SHUTTLE_API_BASE_URL}/health`)
      return response.data
    } catch (error) {
      console.error('Error checking Shuttle service health:', error)
      throw error
    }
  }

  async getDeploymentStatus(): Promise<DeploymentStatus> {
    try {
      const response = await axios.get(`${SHUTTLE_API_BASE_URL}/deployment/status`)
      return response.data.data
    } catch (error) {
      console.error('Error getting deployment status:', error)
      throw error
    }
  }

  async deployService(config: DeploymentConfig): Promise<DeploymentInfo> {
    try {
      const response = await axios.post(`${SHUTTLE_API_BASE_URL}/deployment/deploy`, config)
      return response.data.data
    } catch (error) {
      console.error('Error deploying service:', error)
      throw error
    }
  }

  async getDeploymentLogs(deploymentId: string): Promise<DeploymentLogsResponse> {
    try {
      const response = await axios.get(`${SHUTTLE_API_BASE_URL}/deployment/${deploymentId}/logs`)
      return response.data.data
    } catch (error) {
      console.error('Error getting deployment logs:', error)
      throw error
    }
  }

  async proxyRequest(config: ProxyRequestConfig): Promise<ProxyResponse> {
    try {
      const url = `${SHUTTLE_API_BASE_URL}${config.path}`
      const axiosConfig = config.headers ? { headers: config.headers } : {}
      
      let response
      switch (config.method) {
        case 'GET':
          response = await axios.get(url, axiosConfig)
          break
        case 'POST':
          response = await axios.post(url, config.data, axiosConfig)
          break
        case 'PUT':
          response = await axios.put(url, config.data, axiosConfig)
          break
        case 'DELETE':
          response = await axios.delete(url, axiosConfig)
          break
        default:
          throw new Error(`Unsupported HTTP method: ${config.method}`)
      }
      
      return response.data
    } catch (error) {
      console.error('Error making proxy request:', error)
      throw error
    }
  }

  async configureProxy(settings: ProxySettings): Promise<ProxyConfigResponse> {
    try {
      const response = await axios.post(`${SHUTTLE_API_BASE_URL}/proxy/configure`, settings)
      return response.data.data
    } catch (error) {
      console.error('Error configuring proxy:', error)
      throw error
    }
  }
}