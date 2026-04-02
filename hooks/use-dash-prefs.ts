'use client'

import { useEffect, useState, useCallback } from 'react'

export type DashLang = 'en' | 'ar'

const LANG_KEY  = 'chabaqa_dash_lang'
const THEME_KEY = 'chabaqa_dash_theme'

function applyTheme(dark: boolean) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', dark)
}

function applyLang(lang: DashLang) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
  document.documentElement.setAttribute('lang', lang)
}

export function useDashPrefs() {
  const [dark, setDarkState] = useState(false)
  const [lang, setLangState] = useState<DashLang>('en')

  useEffect(() => {
    const savedDark = localStorage.getItem(THEME_KEY) === 'dark'
    const savedLang = (localStorage.getItem(LANG_KEY) as DashLang) || 'en'
    setDarkState(savedDark)
    setLangState(savedLang)
    applyTheme(savedDark)
    applyLang(savedLang)
  }, [])

  const toggleDark = useCallback(() => {
    setDarkState(prev => {
      const next = !prev
      localStorage.setItem(THEME_KEY, next ? 'dark' : 'light')
      applyTheme(next)
      return next
    })
  }, [])

  const toggleLang = useCallback(() => {
    setLangState(prev => {
      const next: DashLang = prev === 'en' ? 'ar' : 'en'
      localStorage.setItem(LANG_KEY, next)
      applyLang(next)
      return next
    })
  }, [])

  return { dark, lang, toggleDark, toggleLang }
}
