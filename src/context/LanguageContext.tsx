'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import fr from '../locales/fr.json'
import en from '../locales/en.json'

type Locale = 'fr' | 'en'
const translations = { fr, en }

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (path: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('fr')

  useEffect(() => {
    const saved = localStorage.getItem('lunaverse_locale') as Locale
    if (saved && (saved === 'fr' || saved === 'en')) {
      setLocaleState(saved)
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('lunaverse_locale', newLocale)
  }

  const t = useCallback((path: string): string => {
    const keys = path.split('.')
    let result: any = translations[locale]
    
    for (const key of keys) {
      if (result && result[key]) {
        result = result[key]
      } else {
        return path
      }
    }
    
    return typeof result === 'string' ? result : path
  }, [locale])

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
