'use client'

import { useEffect } from 'react'

export default function ThemeApplier() {
  useEffect(() => {
    const applyTheme = () => {
      const savedTheme = localStorage.getItem('lunaverse-theme') || 'dark'
      const root = document.documentElement
      
      // Smooth transitions
      root.style.transition = 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease'
      
      root.classList.remove('theme-space', 'theme-neon')
      if (savedTheme !== 'dark' && savedTheme !== 'light') {
        root.classList.add(`theme-${savedTheme}`)
      }
    }

    applyTheme()
    
    // Listen for storage changes (sync across tabs)
    window.addEventListener('storage', (e) => {
      if (e.key === 'lunaverse-theme') applyTheme()
    })
    
    return () => window.removeEventListener('storage', applyTheme)
  }, [])

  return null
}
