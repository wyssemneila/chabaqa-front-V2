'use client'

import { Globe, MapPin, Layers2 } from 'lucide-react'
import type { DashLang } from '@/hooks/use-dash-prefs'

export type EventFormat = 'online' | 'offline' | 'hybrid'

interface Props {
  value: EventFormat
  onChange: (v: EventFormat) => void
  lang: DashLang
}

const OPTIONS = [
  {
    id: 'online'  as EventFormat,
    Icon: Globe,
    en: { label: 'Online',     desc: 'Virtual meeting or livestream' },
    ar: { label: 'أونلاين',   desc: 'اجتماع افتراضي أو بث مباشر'   },
  },
  {
    id: 'offline' as EventFormat,
    Icon: MapPin,
    en: { label: 'In-Person',  desc: 'Physical venue, people show up' },
    ar: { label: 'حضوري',      desc: 'مكان مادي، يحضر الجمهور'        },
  },
  {
    id: 'hybrid'  as EventFormat,
    Icon: Layers2,
    en: { label: 'Hybrid',     desc: 'Both online and at a venue' },
    ar: { label: 'هجين',       desc: 'أونلاين وحضوري في آنٍ واحد'    },
  },
]

export default function EventTypeSelector({ value, onChange, lang }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {OPTIONS.map(opt => {
        const active = value === opt.id
        const t      = opt[lang]
        return (
          <button key={opt.id} type="button" onClick={() => onChange(opt.id)}
            className="flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 cursor-pointer transition-all"
            style={{
              background:   active ? 'var(--p2)'    : 'var(--white)',
              borderColor:  active ? 'var(--p)'     : 'var(--bd)',
            }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
              style={{ background: active ? 'var(--p)' : 'var(--bg)' }}>
              <opt.Icon className="w-5 h-5" strokeWidth={1.7}
                style={{ color: active ? '#fff' : 'var(--t3)' }} />
            </div>
            <div className="text-center">
              <p className="text-[13px] font-bold"
                style={{ color: active ? 'var(--p)' : 'var(--t1)' }}>{t.label}</p>
              <p className="text-[11px] mt-0.5 leading-snug"
                style={{ color: 'var(--t3)' }}>{t.desc}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}
