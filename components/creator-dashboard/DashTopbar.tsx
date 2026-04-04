'use client'

import Link from 'next/link'
import { Moon, Sun, Languages, ExternalLink } from 'lucide-react'
import { useDashPrefs } from '@/hooks/use-dash-prefs'

interface DashTopbarProps { title: string; subtitle: string }

export default function DashTopbar({ title, subtitle }: DashTopbarProps) {
  const { dark, lang, toggleDark, toggleLang } = useDashPrefs()

  return (
    <header className="px-7 h-14 flex items-center justify-between sticky top-0 z-40"
      style={{ background: 'var(--white)', borderBottom: '1px solid var(--bd)' }}>
      <div>
        <h1 className="text-[15px] font-semibold" style={{ color: 'var(--t1)' }}>{title}</h1>
        <p className="text-[12px] mt-px" style={{ color: 'var(--t3)' }}>{subtitle}</p>
      </div>

      <div className="flex items-center gap-2">

        {/* View Community */}
        <Link href="/communities/motion-masters" target="_blank"
          className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-[12px] font-semibold cursor-pointer transition-all hover:opacity-80"
          style={{ background: 'var(--p)', color: '#fff' }}>
          <ExternalLink className="w-3.5 h-3.5" strokeWidth={2} />
          {lang === 'ar' ? 'عرض المجتمع' : 'View Community'}
        </Link>

        {/* AR / EN toggle */}
        <button
          onClick={toggleLang}
          title={lang === 'en' ? 'Switch to Arabic' : 'التبديل إلى الإنجليزية'}
          className="flex items-center gap-1.5 h-8 px-3 rounded-xl text-[12px] font-bold cursor-pointer transition-all hover:opacity-80"
          style={{ border: '1.5px solid var(--bd)', background: 'var(--bg)', color: 'var(--t2)' }}>
          <Languages className="w-3.5 h-3.5" />
          {lang === 'en' ? 'AR' : 'EN'}
        </button>

        {/* dark mode toggle */}
        <button
          onClick={toggleDark}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer transition-all hover:opacity-80"
          style={{ border: '1.5px solid var(--bd)', background: 'var(--bg)', color: 'var(--t2)' }}>
          {dark
            ? <Sun  className="w-3.5 h-3.5" />
            : <Moon className="w-3.5 h-3.5" />
          }
        </button>

      </div>
    </header>
  )
}
