'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

export type DashLang = 'en' | 'ar'

const LANG_KEY = 'chabaqa_dash_lang'
const EVENT = 'dashpref-change'

function applyLang(lang: DashLang) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
  document.documentElement.setAttribute('lang', lang)
}

function readLang(): DashLang {
  if (typeof localStorage === 'undefined') return 'en'
  return (localStorage.getItem(LANG_KEY) as DashLang) || 'en'
}

function emit() {
  window.dispatchEvent(new Event(EVENT))
}

export function useDashPrefs() {
  const { resolvedTheme, setTheme } = useTheme()
  const [lang, setLang] = useState<DashLang>('en')

  useEffect(() => {
    const sync = () => {
      const nextLang = readLang()
      setLang(nextLang)
      applyLang(nextLang)
    }
    sync()
    window.addEventListener(EVENT, sync)
    return () => window.removeEventListener(EVENT, sync)
  }, [])

  const toggleDark = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
  }, [resolvedTheme, setTheme])

  const toggleLang = useCallback(() => {
    const next: DashLang = readLang() === 'en' ? 'ar' : 'en'
    localStorage.setItem(LANG_KEY, next)
    applyLang(next)
    emit()
  }, [])

  return { dark: resolvedTheme === 'dark', lang, toggleDark, toggleLang }
}
