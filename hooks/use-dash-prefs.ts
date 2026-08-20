'use client'

import { useEffect, useState, useCallback } from 'react'

export type DashLang = 'en' | 'ar'

const LANG_KEY  = 'chabaqa_dash_lang'
const THEME_KEY = 'chabaqa_dash_theme'
const EVENT     = 'dashpref-change'

function applyTheme(dark: boolean) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', dark)
}

function applyLang(lang: DashLang) {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
  document.documentElement.setAttribute('lang', lang)
}

function readDark(): boolean {
  if (typeof localStorage === 'undefined') return false
  return localStorage.getItem(THEME_KEY) === 'dark'
}

function readLang(): DashLang {
  if (typeof localStorage === 'undefined') return 'en'
  return (localStorage.getItem(LANG_KEY) as DashLang) || 'en'
}

function emit() {
  window.dispatchEvent(new Event(EVENT))
}

export function useDashPrefs() {
  const [dark, setDark] = useState<boolean>(false)
  const [lang, setLang] = useState<DashLang>('en')

  // Sync from storage on mount + whenever EVENT fires
  useEffect(() => {
    const sync = () => {
      const d = readDark()
      const l = readLang()
      setDark(d)
      setLang(l)
      applyTheme(d)
      applyLang(l)
    }
    sync()
    window.addEventListener(EVENT, sync)
    return () => window.removeEventListener(EVENT, sync)
  }, [])

  const toggleDark = useCallback(() => {
    const next = !readDark()
    localStorage.setItem(THEME_KEY, next ? 'dark' : 'light')
    applyTheme(next)
    emit()
  }, [])

  const toggleLang = useCallback(() => {
    const next: DashLang = readLang() === 'en' ? 'ar' : 'en'
    localStorage.setItem(LANG_KEY, next)
    applyLang(next)
    emit()
  }, [])

  return { dark, lang, toggleDark, toggleLang }
}
