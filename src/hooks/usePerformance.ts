import { useEffect, useState, useCallback, useRef } from 'react'

interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  cumulativeLayoutShift: number
  firstInputDelay: number
  memoryUsage?: number
  bundleSize?: number
}

interface NetworkInfo {
  effectiveType: string
  downlink: number
  rtt: number
  saveData: boolean
}

export const usePerformance = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null)
  const [isSlowNetwork, setIsSlowNetwork] = useState(false)
  const [shouldOptimize, setShouldOptimize] = useState(false)
  const observerRef = useRef<PerformanceObserver | null>(null)

  // Measure Core Web Vitals
  useEffect(() => {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

    const observePerformance = () => {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number }
        
        setMetrics(prev => ({
          ...prev!,
          largestContentfulPaint: lastEntry.startTime
        }))
      })

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry) => {
          const fidEntry = entry as PerformanceEntry & { processingStart: number; startTime: number }
          const fid = fidEntry.processingStart - fidEntry.startTime
          
          setMetrics(prev => ({
            ...prev!,
            firstInputDelay: fid
          }))
        })
      })

      // Cumulative Layout Shift
      const clsObserver = new PerformanceObserver((list) => {
        let clsValue = 0
        const entries = list.getEntries()
        
        entries.forEach((entry) => {
          const layoutShiftEntry = entry as PerformanceEntry & { value: number; hadRecentInput: boolean }
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value
          }
        })
        
        setMetrics(prev => ({
          ...prev!,
          cumulativeLayoutShift: clsValue
        }))
      })

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        fidObserver.observe({ entryTypes: ['first-input'] })
        clsObserver.observe({ entryTypes: ['layout-shift'] })
        
        observerRef.current = lcpObserver // Store one for cleanup
      } catch (error) {
        console.warn('Performance Observer not supported:', error)
      }
    }

    observePerformance()

    // Measure initial metrics
    const measureInitialMetrics = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const paintEntries = performance.getEntriesByType('paint')
      
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')
      
      setMetrics({
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        renderTime: performance.now(),
        firstContentfulPaint: fcp?.startTime || 0,
        largestContentfulPaint: 0,
        cumulativeLayoutShift: 0,
        firstInputDelay: 0,
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
      })
    }

    setTimeout(measureInitialMetrics, 1000)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  // Monitor network conditions
  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateNetworkInfo = () => {
      const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
      
      if (connection) {
        const info: NetworkInfo = {
          effectiveType: connection.effectiveType || 'unknown',
          downlink: connection.downlink || 0,
          rtt: connection.rtt || 0,
          saveData: connection.saveData || false
        }
        
        setNetworkInfo(info)
        setIsSlowNetwork(info.effectiveType === 'slow-2g' || info.effectiveType === '2g' || info.saveData)
        setShouldOptimize(info.effectiveType === 'slow-2g' || info.effectiveType === '2g' || info.downlink < 1)
      }
    }

    updateNetworkInfo()

    const connection = (navigator as any).connection
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo)
      return () => connection.removeEventListener('change', updateNetworkInfo)
    }
  }, [])

  // Performance optimization utilities
  const optimizeForSlowNetwork = useCallback(() => {
    if (!shouldOptimize) return false

    // Reduce image quality
    const images = document.querySelectorAll('img')
    images.forEach(img => {
      if (img.srcset) {
        // Use smallest image in srcset for slow networks
        const srcsetArray = img.srcset.split(',')
        if (srcsetArray.length > 0) {
          img.src = srcsetArray[0].trim().split(' ')[0]
        }
      }
    })

    // Disable animations
    document.body.classList.add('reduce-motion')

    return true
  }, [shouldOptimize])

  const measureComponentRender = useCallback((componentName: string) => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      console.log(`${componentName} render time: ${renderTime.toFixed(2)}ms`)
      
      // Track slow renders
      if (renderTime > 16) { // 60fps threshold
        console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`)
      }
    }
  }, [])

  const measureAsyncOperation = useCallback((operationName: string) => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const duration = endTime - startTime
      
      console.log(`${operationName} duration: ${duration.toFixed(2)}ms`)
      return duration
    }
  }, [])

  // Memory monitoring
  const getMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      }
    }
    return null
  }, [])

  // Bundle size estimation
  const estimateBundleSize = useCallback(() => {
    const scripts = Array.from(document.querySelectorAll('script[src]'))
    const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    
    let totalSize = 0
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
    
    resources.forEach(resource => {
      if (resource.name.includes('.js') || resource.name.includes('.css')) {
        totalSize += resource.transferSize || 0
      }
    })
    
    return totalSize
  }, [])

  // Performance scoring
  const getPerformanceScore = useCallback(() => {
    if (!metrics) return null

    let score = 100
    
    // FCP scoring (good: <1.8s, needs improvement: 1.8s-3s, poor: >3s)
    if (metrics.firstContentfulPaint > 3000) score -= 25
    else if (metrics.firstContentfulPaint > 1800) score -= 15
    
    // LCP scoring (good: <2.5s, needs improvement: 2.5s-4s, poor: >4s)
    if (metrics.largestContentfulPaint > 4000) score -= 25
    else if (metrics.largestContentfulPaint > 2500) score -= 15
    
    // FID scoring (good: <100ms, needs improvement: 100ms-300ms, poor: >300ms)
    if (metrics.firstInputDelay > 300) score -= 25
    else if (metrics.firstInputDelay > 100) score -= 15
    
    // CLS scoring (good: <0.1, needs improvement: 0.1-0.25, poor: >0.25)
    if (metrics.cumulativeLayoutShift > 0.25) score -= 25
    else if (metrics.cumulativeLayoutShift > 0.1) score -= 15
    
    return Math.max(0, score)
  }, [metrics])

  // Resource loading optimization
  const prefetchResource = useCallback((url: string, type: 'script' | 'style' | 'image' = 'script') => {
    if (isSlowNetwork) return // Skip prefetching on slow networks

    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = url
    
    if (type === 'script') link.as = 'script'
    else if (type === 'style') link.as = 'style'
    else if (type === 'image') link.as = 'image'
    
    document.head.appendChild(link)
  }, [isSlowNetwork])

  return {
    metrics,
    networkInfo,
    isSlowNetwork,
    shouldOptimize,
    optimizeForSlowNetwork,
    measureComponentRender,
    measureAsyncOperation,
    getMemoryUsage,
    estimateBundleSize,
    getPerformanceScore,
    prefetchResource,
    
    // Performance status indicators
    isGoodPerformance: metrics ? getPerformanceScore()! > 90 : null,
    needsImprovement: metrics ? getPerformanceScore()! < 75 : null,
    
    // Network-aware features
    enabledFeatures: {
      animations: !isSlowNetwork,
      highQualityImages: !isSlowNetwork,
      autoplay: !isSlowNetwork,
      prefetching: !isSlowNetwork
    }
  }
}

export default usePerformance