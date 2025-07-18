'use client'

import { useEffect, useState } from 'react'

interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  interactionDelay: number
}

export const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)

  useEffect(() => {
    // Measure page load performance
    const measurePerformance = () => {
      if (typeof window !== 'undefined' && 'performance' in window) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        const loadTime = navigation.loadEventEnd - navigation.loadEventStart
        
        setMetrics({
          loadTime,
          renderTime: performance.now(),
          interactionDelay: 0
        })

        // Log performance metrics for debugging
        console.log('Performance Metrics:', {
          loadTime: `${loadTime.toFixed(2)}ms`,
          DOMContentLoaded: `${navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart}ms`,
          FirstContentfulPaint: `${navigation.loadEventEnd - navigation.fetchStart}ms`
        })
      }
    }

    // Measure after component mount
    setTimeout(measurePerformance, 100)
  }, [])

  // Only show in development
  if (process.env.NODE_ENV !== 'development' || !metrics) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white text-xs p-2 rounded opacity-50 hover:opacity-100 transition-opacity z-50">
      <div>Load: {metrics.loadTime.toFixed(1)}ms</div>
      <div>Render: {metrics.renderTime.toFixed(1)}ms</div>
    </div>
  )
}

export default PerformanceMonitor