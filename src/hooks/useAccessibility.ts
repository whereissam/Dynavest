import { useEffect, useState } from 'react'

interface AccessibilityPreferences {
  reduceMotion: boolean
  highContrast: boolean
  largeText: boolean
  keyboardNavigation: boolean
}

interface FocusManagement {
  focusedElement: Element | null
  focusTrap: boolean
}

export const useAccessibility = () => {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    reduceMotion: false,
    highContrast: false,
    largeText: false,
    keyboardNavigation: false
  })

  const [focusManagement, setFocusManagement] = useState<FocusManagement>({
    focusedElement: null,
    focusTrap: false
  })

  const [announcements, setAnnouncements] = useState<string[]>([])

  // Detect user preferences from system settings
  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQueries = {
      reduceMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      highContrast: window.matchMedia('(prefers-contrast: high)'),
      largeText: window.matchMedia('(min-resolution: 1.5dppx)')
    }

    const updatePreferences = () => {
      setPreferences(prev => ({
        ...prev,
        reduceMotion: mediaQueries.reduceMotion.matches,
        highContrast: mediaQueries.highContrast.matches,
        largeText: mediaQueries.largeText.matches
      }))
    }

    // Initial check
    updatePreferences()

    // Listen for changes
    Object.values(mediaQueries).forEach(mq => {
      mq.addEventListener('change', updatePreferences)
    })

    return () => {
      Object.values(mediaQueries).forEach(mq => {
        mq.removeEventListener('change', updatePreferences)
      })
    }
  }, [])

  // Keyboard navigation detection
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setPreferences(prev => ({ ...prev, keyboardNavigation: true }))
        document.body.classList.add('keyboard-navigation')
      }
    }

    const handleMouseDown = () => {
      setPreferences(prev => ({ ...prev, keyboardNavigation: false }))
      document.body.classList.remove('keyboard-navigation')
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  // Focus management
  const setFocusTrap = (enabled: boolean, container?: Element) => {
    setFocusManagement(prev => ({ ...prev, focusTrap: enabled }))

    if (enabled && container) {
      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus()
      }
    }
  }

  const moveFocus = (direction: 'next' | 'previous' | 'first' | 'last') => {
    const focusableElements = Array.from(
      document.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ) as HTMLElement[]

    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement)

    let nextIndex = currentIndex
    switch (direction) {
      case 'next':
        nextIndex = (currentIndex + 1) % focusableElements.length
        break
      case 'previous':
        nextIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1
        break
      case 'first':
        nextIndex = 0
        break
      case 'last':
        nextIndex = focusableElements.length - 1
        break
    }

    focusableElements[nextIndex]?.focus()
  }

  // Screen reader announcements
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncements(prev => [...prev, message])

    // Create temporary live region for announcement
    const liveRegion = document.createElement('div')
    liveRegion.setAttribute('aria-live', priority)
    liveRegion.setAttribute('aria-atomic', 'true')
    liveRegion.className = 'sr-only'
    liveRegion.textContent = message

    document.body.appendChild(liveRegion)

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(liveRegion)
      setAnnouncements(prev => prev.filter(a => a !== message))
    }, 1000)
  }

  // Skip links functionality
  const addSkipLink = (targetId: string, label: string) => {
    if (typeof window === 'undefined') return

    const skipLink = document.createElement('a')
    skipLink.href = `#${targetId}`
    skipLink.textContent = label
    skipLink.className = 'skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50'
    
    skipLink.addEventListener('click', (e) => {
      e.preventDefault()
      const target = document.getElementById(targetId)
      if (target) {
        target.focus()
        target.scrollIntoView({ behavior: preferences.reduceMotion ? 'auto' : 'smooth' })
      }
    })

    document.body.insertBefore(skipLink, document.body.firstChild)
  }

  // ARIA label helpers
  const generateAriaLabel = (element: string, action?: string, context?: string) => {
    let label = element
    if (action) label += ` ${action}`
    if (context) label += ` ${context}`
    return label
  }

  const generateAriaDescription = (description: string, additionalInfo?: string) => {
    let fullDescription = description
    if (additionalInfo) fullDescription += `. ${additionalInfo}`
    return fullDescription
  }

  // Color contrast checker
  const checkColorContrast = (foreground: string, background: string): number => {
    // Simplified contrast ratio calculation
    // In production, use a proper color contrast library
    const getLuminance = (color: string) => {
      // This is a simplified version - use proper color parsing in production
      const hex = color.replace('#', '')
      const r = parseInt(hex.substr(0, 2), 16) / 255
      const g = parseInt(hex.substr(2, 2), 16) / 255
      const b = parseInt(hex.substr(4, 2), 16) / 255
      
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }

    const l1 = getLuminance(foreground)
    const l2 = getLuminance(background)
    const lighter = Math.max(l1, l2)
    const darker = Math.min(l1, l2)
    
    return (lighter + 0.05) / (darker + 0.05)
  }

  return {
    preferences,
    focusManagement,
    announcements,
    setFocusTrap,
    moveFocus,
    announce,
    addSkipLink,
    generateAriaLabel,
    generateAriaDescription,
    checkColorContrast,
    
    // Utility classes for conditional styling
    motionClass: preferences.reduceMotion ? 'reduce-motion' : '',
    contrastClass: preferences.highContrast ? 'high-contrast' : '',
    textSizeClass: preferences.largeText ? 'large-text' : '',
    keyboardClass: preferences.keyboardNavigation ? 'keyboard-navigation' : '',
  }
}

export default useAccessibility