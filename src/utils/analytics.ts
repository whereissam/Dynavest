// Analytics utility for tracking user interactions and performance
// Can be easily integrated with Google Analytics, Mixpanel, or other analytics services

interface AnalyticsEvent {
  event: string
  category: string
  label?: string
  value?: number
  customProperties?: Record<string, unknown>
}

interface UserProperties {
  userId?: string
  walletAddress?: string
  userType?: 'new' | 'returning'
  deviceType?: 'mobile' | 'desktop' | 'tablet'
}

class AnalyticsService {
  private isEnabled: boolean
  private userProperties: UserProperties = {}

  constructor() {
    // Only enable in production or when explicitly enabled
    this.isEnabled = process.env.NODE_ENV === 'production' || 
                    process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true'
  }

  // Initialize analytics with user properties
  identify(properties: UserProperties) {
    this.userProperties = { ...this.userProperties, ...properties }
    
    if (this.isEnabled) {
      // In production, integrate with your analytics service
      console.log('Analytics: User identified', properties)
    }
  }

  // Track user events
  track(eventData: AnalyticsEvent) {
    if (!this.isEnabled) return

    const enrichedEvent = {
      ...eventData,
      timestamp: new Date().toISOString(),
      userProperties: this.userProperties,
      sessionId: this.getSessionId(),
      url: typeof window !== 'undefined' ? window.location.href : '',
    }

    // In development, just log to console
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', enrichedEvent)
      return
    }

    // In production, send to analytics service
    this.sendToAnalyticsService(enrichedEvent)
  }

  // Track page views
  pageView(pageName: string, properties?: Record<string, unknown>) {
    this.track({
      event: 'page_view',
      category: 'navigation',
      label: pageName,
      customProperties: properties
    })
  }

  // Track user interactions
  interaction(element: string, action: string, properties?: Record<string, unknown>) {
    this.track({
      event: 'user_interaction',
      category: 'ui',
      label: `${element}_${action}`,
      customProperties: properties
    })
  }

  // Track strategy-related events
  strategyEvent(action: string, strategyName?: string, properties?: Record<string, unknown>) {
    this.track({
      event: 'strategy_action',
      category: 'defi',
      label: action,
      customProperties: {
        strategyName,
        ...properties
      }
    })
  }

  // Track wallet-related events
  walletEvent(action: string, walletType?: string, properties?: Record<string, unknown>) {
    this.track({
      event: 'wallet_action',
      category: 'web3',
      label: action,
      customProperties: {
        walletType,
        ...properties
      }
    })
  }

  // Track AI chat interactions
  chatEvent(action: string, messageType?: string, properties?: Record<string, unknown>) {
    this.track({
      event: 'chat_interaction',
      category: 'ai',
      label: action,
      customProperties: {
        messageType,
        ...properties
      }
    })
  }

  // Track performance metrics
  performance(metric: string, value: number, properties?: Record<string, unknown>) {
    this.track({
      event: 'performance_metric',
      category: 'performance',
      label: metric,
      value,
      customProperties: properties
    })
  }

  // Track errors
  error(errorType: string, errorMessage: string, properties?: Record<string, unknown>) {
    this.track({
      event: 'error',
      category: 'error',
      label: errorType,
      customProperties: {
        errorMessage,
        ...properties
      }
    })
  }

  private getSessionId(): string {
    if (typeof window === 'undefined') return 'server'
    
    let sessionId = sessionStorage.getItem('analytics_session_id')
    if (!sessionId) {
      sessionId = Math.random().toString(36).substring(2, 15)
      sessionStorage.setItem('analytics_session_id', sessionId)
    }
    return sessionId
  }

  private async sendToAnalyticsService(eventData: unknown) {
    try {
      // Example: Send to your analytics endpoint
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(eventData)
      // })

      // For now, just log in production too
      console.log('Analytics (Production):', eventData)
    } catch (error) {
      console.error('Failed to send analytics event:', error)
    }
  }
}

// Create singleton instance
export const analytics = new AnalyticsService()

// Convenience functions for common events
export const trackPageView = (pageName: string, properties?: Record<string, unknown>) => {
  analytics.pageView(pageName, properties)
}

export const trackClick = (element: string, properties?: Record<string, unknown>) => {
  analytics.interaction(element, 'click', properties)
}

export const trackStrategyAction = (action: string, strategyName?: string, properties?: Record<string, unknown>) => {
  analytics.strategyEvent(action, strategyName, properties)
}

export const trackWalletAction = (action: string, walletType?: string, properties?: Record<string, unknown>) => {
  analytics.walletEvent(action, walletType, properties)
}

export const trackChatMessage = (messageType: string, properties?: Record<string, unknown>) => {
  analytics.chatEvent('message_sent', messageType, properties)
}

export const trackError = (errorType: string, errorMessage: string, properties?: Record<string, unknown>) => {
  analytics.error(errorType, errorMessage, properties)
}

export default analytics