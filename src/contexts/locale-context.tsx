import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { ru, type TranslationKeys } from '@/i18n/locales/ru'
import { en } from '@/i18n/locales/en'

export type Locale = 'ru' | 'en'

const translations: Record<Locale, TranslationKeys> = { ru, en }

interface LocaleContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: TranslationKeys
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined)

const STORAGE_KEY = 'handymanos_locale'

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'en' ? 'en' : 'ru'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, locale)
    document.documentElement.lang = locale
  }, [locale])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
  }, [])

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t: translations[locale] }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  const context = useContext(LocaleContext)
  if (!context) throw new Error('useLocale must be used within LocaleProvider')
  return context
}

export function useTranslation() {
  const { t, locale } = useLocale()
  return { t, locale }
}
