'use client'

import Link from 'next/link'
import { Moon, Sun, Languages, ExternalLink, Home } from 'lucide-react'
import { useDashPrefs } from '@/hooks/use-dash-prefs'
import { useCreatorCommunity } from '@/app/(creator)/creator/context/creator-community-context'

interface DashTopbarProps { title: string; subtitle: string }

export default function DashTopbar({ title, subtitle }: DashTopbarProps) {
  const { dark, lang, toggleDark, toggleLang } = useDashPrefs()
  const { selectedCommunity, isLoading: communityLoading } = useCreatorCommunity()
  const communitySlug = String(
    selectedCommunity?.slug ||
    selectedCommunity?.handle ||
    selectedCommunity?._id ||
    selectedCommunity?.id ||
    '',
  )
  const communityHref = communitySlug
    ? `/community/${encodeURIComponent(communitySlug)}`
    : '/creator/communities'

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-3 px-4 sm:px-7"
      style={{ background: 'var(--white)', borderBottom: '1px solid var(--bd)' }}>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[15px] font-semibold" style={{ color: 'var(--t1)' }}>{title}</h1>
        <p className="mt-px hidden truncate text-[12px] sm:block" style={{ color: 'var(--t3)' }}>{subtitle}</p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">

        {/* Home — landing page */}
        <Link href="/"
          aria-label="Go to home page"
          title="Go to home page"
          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-xl transition-all hover:opacity-80"
          style={{ border: '1.5px solid var(--bd)', background: 'var(--bg)', color: 'var(--t2)' }}>
          <Home className="w-3.5 h-3.5" strokeWidth={1.7} />
        </Link>

        {/* View Community */}
        <Link href={communityHref} target={communitySlug ? '_blank' : undefined}
          rel={communitySlug ? 'noopener noreferrer' : undefined}
          aria-disabled={communityLoading}
          aria-label={lang === 'ar' ? 'عرض المجتمع' : 'View Community'}
          title={lang === 'ar' ? 'عرض المجتمع' : 'View Community'}
          className="flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-0 text-[12px] font-semibold transition-all hover:opacity-80 max-sm:w-8 sm:px-3"
          style={{
            background: 'var(--p)',
            color: '#fff',
            opacity: communityLoading ? 0.6 : 1,
            pointerEvents: communityLoading ? 'none' : 'auto',
          }}>
          <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.7} />
          <span className="hidden whitespace-nowrap sm:inline">{lang === 'ar' ? 'عرض المجتمع' : 'View Community'}</span>
        </Link>

        {/* AR / EN toggle */}
        <button
          onClick={toggleLang}
          aria-label="Toggle language"
          title="Toggle language"
          className="flex h-8 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl px-2.5 text-[12px] font-bold transition-all hover:opacity-80 sm:px-3"
          style={{ border: '1.5px solid var(--bd)', background: 'var(--bg)', color: 'var(--t2)' }}>
          <Languages className="w-3.5 h-3.5" />
          {lang === 'en' ? 'AR' : 'EN'}
        </button>

        {/* dark mode toggle */}
        <button
          onClick={toggleDark}
          aria-label="Toggle dark mode"
          title="Toggle dark mode"
          className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-xl transition-all hover:opacity-80"
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
