'use client'

import { useState, useEffect } from 'react'
import usePerformance from '@/hooks/usePerformance'
import useAccessibility from '@/hooks/useAccessibility'
import useMobileFeatures from '@/hooks/useMobileFeatures'
import { analytics } from '@/utils/analytics'

interface DashboardProps {
  showInProduction?: boolean
}

export const DeveloperDashboard = ({ showInProduction = false }: DashboardProps) => {
  const [isVisible, setIsVisible] = useState(false)
  const [activeTab, setActiveTab] = useState<'performance' | 'accessibility' | 'mobile' | 'analytics'>('performance')
  
  const {
    metrics,
    networkInfo,
    isSlowNetwork,
    getPerformanceScore,
    getMemoryUsage
  } = usePerformance()
  
  const {
    preferences,
    announcements,
    checkColorContrast
  } = useAccessibility()
  
  const {
    deviceInfo,
    features,
    mobileOptimizations
  } = useMobileFeatures()

  // Only show in development unless explicitly enabled for production
  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development'
    const shouldShow = isDev || showInProduction
    setIsVisible(shouldShow)
  }, [showInProduction])

  // Keyboard shortcut to toggle dashboard
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsVisible(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeydown)
    return () => window.removeEventListener('keydown', handleKeydown)
  }, [])

  if (!isVisible) return null

  const performanceScore = getPerformanceScore()
  const memoryUsage = getMemoryUsage()

  return (
    <div className="fixed top-4 right-4 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
      <div className="border-b border-gray-200 p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">Developer Dashboard</h3>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close dashboard"
          >
            ✕
          </button>
        </div>
        
        <div className="flex mt-2 space-x-1">
          {(['performance', 'accessibility', 'mobile', 'analytics'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2 py-1 text-xs rounded capitalize ${
                activeTab === tab
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="p-3 overflow-y-auto max-h-80">
        {activeTab === 'performance' && (
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-1">Performance Score</h4>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      performanceScore && performanceScore > 90
                        ? 'bg-green-500'
                        : performanceScore && performanceScore > 75
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${performanceScore || 0}%` }}
                  />
                </div>
                <span className="text-xs text-gray-600">{performanceScore || 0}/100</span>
              </div>
            </div>

            {metrics && (
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-1">Core Web Vitals</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>FCP:</span>
                    <span className={metrics.firstContentfulPaint < 1800 ? 'text-green-600' : 'text-red-600'}>
                      {metrics.firstContentfulPaint.toFixed(0)}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>LCP:</span>
                    <span className={metrics.largestContentfulPaint < 2500 ? 'text-green-600' : 'text-red-600'}>
                      {metrics.largestContentfulPaint.toFixed(0)}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>CLS:</span>
                    <span className={metrics.cumulativeLayoutShift < 0.1 ? 'text-green-600' : 'text-red-600'}>
                      {metrics.cumulativeLayoutShift.toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {memoryUsage && (
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-1">Memory Usage</h4>
                <div className="text-xs">
                  <div className="flex justify-between">
                    <span>Used:</span>
                    <span>{(memoryUsage.used / 1024 / 1024).toFixed(1)} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Usage:</span>
                    <span className={memoryUsage.percentage > 80 ? 'text-red-600' : 'text-green-600'}>
                      {memoryUsage.percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {networkInfo && (
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-1">Network</h4>
                <div className="text-xs">
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span className={isSlowNetwork ? 'text-red-600' : 'text-green-600'}>
                      {networkInfo.effectiveType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Speed:</span>
                    <span>{networkInfo.downlink} Mbps</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'accessibility' && (
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-1">User Preferences</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Reduce Motion:</span>
                  <span className={preferences.reduceMotion ? 'text-green-600' : 'text-gray-600'}>
                    {preferences.reduceMotion ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>High Contrast:</span>
                  <span className={preferences.highContrast ? 'text-green-600' : 'text-gray-600'}>
                    {preferences.highContrast ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Keyboard Nav:</span>
                  <span className={preferences.keyboardNavigation ? 'text-green-600' : 'text-gray-600'}>
                    {preferences.keyboardNavigation ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-1">Contrast Check</h4>
              <div className="text-xs">
                <div className="flex justify-between">
                  <span>Primary/White:</span>
                  <span className="text-green-600">
                    {checkColorContrast('#5F79F1', '#FFFFFF').toFixed(1)}:1
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Text/Background:</span>
                  <span className="text-green-600">
                    {checkColorContrast('#374151', '#FFFFFF').toFixed(1)}:1
                  </span>
                </div>
              </div>
            </div>

            {announcements.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-700 mb-1">Recent Announcements</h4>
                <div className="space-y-1">
                  {announcements.slice(-3).map((announcement, index) => (
                    <div key={index} className="text-xs text-gray-600 bg-gray-50 p-1 rounded">
                      {announcement}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'mobile' && (
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-1">Device Info</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span>
                    {deviceInfo.isMobile ? 'Mobile' : deviceInfo.isTablet ? 'Tablet' : 'Desktop'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Touch:</span>
                  <span className={deviceInfo.hasTouch ? 'text-green-600' : 'text-gray-600'}>
                    {deviceInfo.hasTouch ? 'Supported' : 'Not supported'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Orientation:</span>
                  <span className="capitalize">{deviceInfo.orientation}</span>
                </div>
                <div className="flex justify-between">
                  <span>Viewport:</span>
                  <span>{deviceInfo.viewportWidth}×{deviceInfo.viewportHeight}</span>
                </div>
                <div className="flex justify-between">
                  <span>PWA Mode:</span>
                  <span className={deviceInfo.isStandalone ? 'text-green-600' : 'text-gray-600'}>
                    {deviceInfo.isStandalone ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-1">Mobile Features</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Vibration:</span>
                  <span className={features.canVibrate ? 'text-green-600' : 'text-gray-600'}>
                    {features.canVibrate ? 'Supported' : 'Not supported'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Web Share:</span>
                  <span className={features.canShare ? 'text-green-600' : 'text-gray-600'}>
                    {features.canShare ? 'Supported' : 'Not supported'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Notifications:</span>
                  <span className={features.canNotify ? 'text-green-600' : 'text-gray-600'}>
                    {features.canNotify ? 'Supported' : 'Not supported'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-1">Optimizations</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Reduced Animations:</span>
                  <span className={mobileOptimizations.reducedAnimations ? 'text-green-600' : 'text-gray-600'}>
                    {mobileOptimizations.reducedAnimations ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Lazy Loading:</span>
                  <span className={mobileOptimizations.lazyLoadImages ? 'text-green-600' : 'text-gray-600'}>
                    {mobileOptimizations.lazyLoadImages ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-1">Session Info</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Environment:</span>
                  <span className="capitalize">{process.env.NODE_ENV}</span>
                </div>
                <div className="flex justify-between">
                  <span>Build Time:</span>
                  <span>{new Date().toLocaleTimeString()}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-1">Feature Status</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span>Analytics:</span>
                  <span className="text-green-600">Enabled</span>
                </div>
                <div className="flex justify-between">
                  <span>Error Boundary:</span>
                  <span className="text-green-600">Active</span>
                </div>
                <div className="flex justify-between">
                  <span>Performance Monitor:</span>
                  <span className="text-green-600">Active</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium text-gray-700 mb-1">Quick Actions</h4>
              <div className="space-y-1">
                <button
                  onClick={() => analytics.track({
                    event: 'developer_dashboard_test',
                    category: 'debug',
                    label: 'manual_test'
                  })}
                  className="w-full text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                >
                  Test Analytics
                </button>
                <button
                  onClick={() => {
                    console.log('Performance Metrics:', metrics)
                    console.log('Device Info:', deviceInfo)
                    console.log('Accessibility Preferences:', preferences)
                  }}
                  className="w-full text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
                >
                  Log Debug Info
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 p-2 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          Press Ctrl+Shift+D to toggle • DynaVest Developer Tools
        </div>
      </div>
    </div>
  )
}

export default DeveloperDashboard