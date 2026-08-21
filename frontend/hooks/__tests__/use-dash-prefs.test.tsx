import { act, renderHook } from '@testing-library/react'
import { useDashPrefs } from '../use-dash-prefs'

describe('useDashPrefs', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
    document.documentElement.lang = 'en'
    document.documentElement.dir = 'ltr'
  })

  it('applies and toggles the persisted dark theme', () => {
    localStorage.setItem('chabaqa_dash_theme', 'dark')
    const { result } = renderHook(() => useDashPrefs())

    expect(result.current.dark).toBe(true)
    expect(document.documentElement).toHaveClass('dark')

    act(() => result.current.toggleDark())
    expect(localStorage.getItem('chabaqa_dash_theme')).toBe('light')
    expect(document.documentElement).not.toHaveClass('dark')
  })

  it('synchronizes theme changes from another tab', () => {
    const { result } = renderHook(() => useDashPrefs())
    localStorage.setItem('chabaqa_dash_theme', 'dark')

    act(() => window.dispatchEvent(new StorageEvent('storage', { key: 'chabaqa_dash_theme' })))

    expect(result.current.dark).toBe(true)
    expect(document.documentElement).toHaveClass('dark')
  })
})
