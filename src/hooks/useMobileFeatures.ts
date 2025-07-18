import { useState, useEffect, useCallback } from 'react'

interface DeviceInfo {
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  hasTouch: boolean
  orientation: 'portrait' | 'landscape'
  viewportHeight: number
  viewportWidth: number
  pixelRatio: number
  isStandalone: boolean // PWA mode
}

interface MobileFeatures {
  canVibrate: boolean
  canInstallPWA: boolean
  hasGyroscope: boolean
  hasBattery: boolean
  canShare: boolean
  canNotify: boolean
}

export const useMobileFeatures = () => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    hasTouch: false,
    orientation: 'landscape',
    viewportHeight: 0,
    viewportWidth: 0,
    pixelRatio: 1,
    isStandalone: false
  })

  const [features, setFeatures] = useState<MobileFeatures>({
    canVibrate: false,
    canInstallPWA: false,
    hasGyroscope: false,
    hasBattery: false,
    canShare: false,
    canNotify: false
  })

  const [installPrompt, setInstallPrompt] = useState<any>(null)

  // Detect device type and capabilities
  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateDeviceInfo = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const isMobile = width <= 768
      const isTablet = width > 768 && width <= 1024
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0

      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop: !isMobile && !isTablet,
        hasTouch,
        orientation: width > height ? 'landscape' : 'portrait',
        viewportHeight: height,
        viewportWidth: width,
        pixelRatio: window.devicePixelRatio || 1,
        isStandalone: window.matchMedia('(display-mode: standalone)').matches ||
                     (window.navigator as any).standalone === true
      })
    }

    const detectFeatures = () => {
      setFeatures({
        canVibrate: 'vibrate' in navigator,
        canInstallPWA: 'serviceWorker' in navigator,
        hasGyroscope: 'DeviceOrientationEvent' in window,
        hasBattery: 'getBattery' in navigator,
        canShare: 'share' in navigator,
        canNotify: 'Notification' in window
      })
    }

    updateDeviceInfo()
    detectFeatures()

    // Listen for resize and orientation changes
    window.addEventListener('resize', updateDeviceInfo)
    window.addEventListener('orientationchange', updateDeviceInfo)

    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('resize', updateDeviceInfo)
      window.removeEventListener('orientationchange', updateDeviceInfo)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  // Haptic feedback
  const vibrate = useCallback((pattern: number | number[] = 200) => {
    if (features.canVibrate) {
      navigator.vibrate(pattern)
    }
  }, [features.canVibrate])

  // Enhanced haptic patterns
  const hapticFeedback = {
    light: () => vibrate(50),
    medium: () => vibrate(100),
    heavy: () => vibrate(200),
    success: () => vibrate([100, 50, 100]),
    error: () => vibrate([200, 100, 200, 100, 200]),
    notification: () => vibrate([50, 50, 50])
  }

  // Native sharing
  const share = useCallback(async (data: { title?: string; text?: string; url?: string }) => {
    if (features.canShare) {
      try {
        await navigator.share(data)
        return true
      } catch (error) {
        console.log('Sharing failed:', error)
        return false
      }
    }
    
    // Fallback: copy to clipboard
    if (data.url && 'clipboard' in navigator) {
      try {
        await navigator.clipboard.writeText(data.url)
        return true
      } catch (error) {
        console.log('Clipboard write failed:', error)
        return false
      }
    }
    
    return false
  }, [features.canShare])

  // PWA installation
  const installPWA = useCallback(async () => {
    if (installPrompt) {
      const result = await installPrompt.prompt()
      setInstallPrompt(null)
      return result.outcome === 'accepted'
    }
    return false
  }, [installPrompt])

  // Battery status
  const getBatteryInfo = useCallback(async () => {
    if (features.hasBattery) {
      try {
        const battery = await (navigator as any).getBattery()
        return {
          level: battery.level,
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime
        }
      } catch (error) {
        console.log('Battery API not available:', error)
      }
    }
    return null
  }, [features.hasBattery])

  // Device orientation
  const requestOrientationPermission = useCallback(async () => {
    if (features.hasGyroscope && 'DeviceOrientationEvent' in window) {
      try {
        const permission = await (DeviceOrientationEvent as any).requestPermission?.()
        return permission === 'granted'
      } catch (error) {
        console.log('Orientation permission request failed:', error)
        return false
      }
    }
    return false
  }, [features.hasGyroscope])

  // Push notifications
  const requestNotificationPermission = useCallback(async () => {
    if (features.canNotify) {
      try {
        const permission = await Notification.requestPermission()
        return permission === 'granted'
      } catch (error) {
        console.log('Notification permission request failed:', error)
        return false
      }
    }
    return false
  }, [features.canNotify])

  const sendNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (features.canNotify && Notification.permission === 'granted') {
      return new Notification(title, {
        icon: '/logo.svg',
        badge: '/logo.svg',
        ...options
      })
    }
    return null
  }, [features.canNotify])

  // Safe area handling for devices with notches
  const getSafeAreaInsets = useCallback(() => {
    if (typeof window === 'undefined') return { top: 0, bottom: 0, left: 0, right: 0 }

    const computedStyle = getComputedStyle(document.documentElement)
    return {
      top: parseInt(computedStyle.getPropertyValue('--sat') || '0'),
      bottom: parseInt(computedStyle.getPropertyValue('--sab') || '0'),
      left: parseInt(computedStyle.getPropertyValue('--sal') || '0'),
      right: parseInt(computedStyle.getPropertyValue('--sar') || '0')
    }
  }, [])

  // Prevent zoom on double tap
  const preventDoubleClickZoom = useCallback((element: HTMLElement) => {
    let lastTapTime = 0
    
    element.addEventListener('touchend', (e) => {
      const currentTime = new Date().getTime()
      const tapLength = currentTime - lastTapTime
      
      if (tapLength < 500 && tapLength > 0) {
        e.preventDefault()
      }
      
      lastTapTime = currentTime
    })
  }, [])

  // Optimize touch targets
  const optimizeTouchTarget = useCallback((element: HTMLElement, minSize: number = 44) => {
    const rect = element.getBoundingClientRect()
    const currentSize = Math.min(rect.width, rect.height)
    
    if (currentSize < minSize) {
      const padding = (minSize - currentSize) / 2
      element.style.padding = `${padding}px`
    }
  }, [])

  // Mobile-specific CSS classes
  const getMobileClasses = useCallback(() => {
    const classes: string[] = []
    
    if (deviceInfo.isMobile) classes.push('is-mobile')
    if (deviceInfo.isTablet) classes.push('is-tablet')
    if (deviceInfo.hasTouch) classes.push('has-touch')
    if (deviceInfo.isStandalone) classes.push('is-pwa')
    if (deviceInfo.orientation === 'portrait') classes.push('portrait')
    else classes.push('landscape')
    
    return classes.join(' ')
  }, [deviceInfo])

  // Performance optimizations for mobile
  const mobileOptimizations = {
    reducedAnimations: deviceInfo.isMobile,
    lazyLoadImages: deviceInfo.isMobile,
    compressedImages: deviceInfo.pixelRatio < 2,
    reducedShadows: deviceInfo.isMobile,
    simpleTransitions: deviceInfo.isMobile
  }

  return {
    deviceInfo,
    features,
    installPrompt: !!installPrompt,
    
    // Actions
    vibrate,
    hapticFeedback,
    share,
    installPWA,
    getBatteryInfo,
    requestOrientationPermission,
    requestNotificationPermission,
    sendNotification,
    getSafeAreaInsets,
    preventDoubleClickZoom,
    optimizeTouchTarget,
    
    // Utilities
    getMobileClasses,
    mobileOptimizations,
    
    // Convenience flags
    isTouch: deviceInfo.hasTouch,
    isSmallScreen: deviceInfo.isMobile,
    isPortrait: deviceInfo.orientation === 'portrait',
    isPWA: deviceInfo.isStandalone,
    canInstall: !!installPrompt
  }
}

export default useMobileFeatures