'use client'

import { useRouter } from 'next/navigation'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar  from '@/components/creator-dashboard/DashTopbar'
import { useDashPrefs } from '@/hooks/use-dash-prefs'
import { ArrowLeft } from 'lucide-react'

// ─── Animated SVG character ────────────────────────────────────────────────────
function ComingSoonIllustration() {
  return (
    <svg width="260" height="220" viewBox="0 0 260 220" fill="none" xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes blink { 0%,90%,100%{scaleY:1} 95%{scaleY:0.1} }
        @keyframes wave  { 0%,100%{transform:rotate(-10deg)} 50%{transform:rotate(20deg)} }
        .char { animation: float 3s ease-in-out infinite; transform-origin: 130px 110px; }
        .arm  { animation: wave 1.2s ease-in-out infinite; transform-origin: 170px 120px; }
        .star1 { animation: float 2s ease-in-out infinite 0.3s; }
        .star2 { animation: float 2.5s ease-in-out infinite 0.8s; }
        .star3 { animation: float 2.2s ease-in-out infinite 1.1s; }
      `}</style>

      {/* shadow */}
      <ellipse cx="130" cy="200" rx="55" ry="10" fill="rgba(142,120,251,.15)" />

      {/* body */}
      <g className="char">
        {/* torso */}
        <rect x="95" y="120" width="70" height="60" rx="20" fill="var(--p)" />
        {/* screen on torso */}
        <rect x="105" y="130" width="50" height="35" rx="8" fill="rgba(255,255,255,.15)" />
        <rect x="110" y="135" width="40" height="7" rx="3" fill="rgba(255,255,255,.5)" />
        <rect x="110" y="146" width="28" height="7" rx="3" fill="rgba(255,255,255,.3)" />
        <rect x="110" y="157" width="34" height="5" rx="2.5" fill="rgba(255,255,255,.2)" />

        {/* left arm */}
        <rect x="72" y="122" width="24" height="12" rx="6" fill="var(--p)" />
        {/* hand left */}
        <circle cx="66" cy="128" r="8" fill="#fcd7b0" />

        {/* right arm — waving */}
        <g className="arm">
          <rect x="164" y="118" width="24" height="12" rx="6" fill="var(--p)" />
          <circle cx="194" cy="124" r="8" fill="#fcd7b0" />
        </g>

        {/* legs */}
        <rect x="100" y="174" width="22" height="26" rx="8" fill="var(--p3)" />
        <rect x="138" y="174" width="22" height="26" rx="8" fill="var(--p3)" />
        {/* shoes */}
        <rect x="96" y="194" width="30" height="12" rx="6" fill="#2d2b4e" />
        <rect x="134" y="194" width="30" height="12" rx="6" fill="#2d2b4e" />

        {/* neck */}
        <rect x="120" y="108" width="20" height="16" rx="6" fill="#fcd7b0" />

        {/* head */}
        <rect x="98" y="68" width="64" height="52" rx="24" fill="#fcd7b0" />

        {/* hair */}
        <path d="M100 76 Q130 50 160 76" stroke="#3d2c00" strokeWidth="10" strokeLinecap="round" fill="none" />
        <rect x="98" y="68" width="8" height="20" rx="4" fill="#3d2c00" />
        <rect x="154" y="68" width="8" height="20" rx="4" fill="#3d2c00" />

        {/* eyes */}
        <ellipse cx="116" cy="88" rx="6" ry="7" fill="white" />
        <ellipse cx="144" cy="88" rx="6" ry="7" fill="white" />
        <circle cx="117" cy="89" r="3.5" fill="#2d2b4e" />
        <circle cx="145" cy="89" r="3.5" fill="#2d2b4e" />
        <circle cx="118.5" cy="87.5" r="1.5" fill="white" />
        <circle cx="146.5" cy="87.5" r="1.5" fill="white" />

        {/* smile */}
        <path d="M116 100 Q130 112 144 100" stroke="#d4845a" strokeWidth="2.5" strokeLinecap="round" fill="none" />

        {/* rosy cheeks */}
        <circle cx="108" cy="96" r="5" fill="rgba(252,128,90,.25)" />
        <circle cx="152" cy="96" r="5" fill="rgba(252,128,90,.25)" />
      </g>

      {/* floating stars */}
      <g className="star1">
        <text x="42" y="80" fontSize="20" textAnchor="middle">✦</text>
      </g>
      <g className="star2">
        <text x="210" y="65" fontSize="14" textAnchor="middle" fill="var(--p)">✦</text>
      </g>
      <g className="star3">
        <text x="58" y="155" fontSize="12" textAnchor="middle" fill="var(--pink)">✦</text>
      </g>

      {/* speech bubble */}
      <g style={{ animation: 'float 2.8s ease-in-out infinite 0.5s' }}>
        <rect x="152" y="28" width="88" height="36" rx="12" fill="var(--p2)" stroke="var(--p3)" strokeWidth="1.5" />
        <polygon points="165,64 175,64 170,72" fill="var(--p2)" stroke="var(--p3)" strokeWidth="1.5" />
        <text x="196" y="46" fontSize="11" fontWeight="700" fill="var(--p)" textAnchor="middle">Soon! 🚧</text>
        <polygon points="165,64 175,64 170,72" fill="var(--p2)" />
      </g>
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ComingSoonPage() {
  const router = useRouter()
  const { lang } = useDashPrefs()

  const t = {
    title:    lang === 'ar' ? 'قريباً' : 'Coming Soon',
    sub:      lang === 'ar'
      ? 'Front V2 — هذه الصفحة ستكون متاحة قريباً بواسطة Wess & Claude'
      : 'Front V2 — this page will be available soon by Wess & Claude',
    back:     lang === 'ar' ? 'العودة' : 'Go back',
    overview: lang === 'ar' ? 'نظرة عامة' : 'Overview',
  }

  return (
    <>
      <style>{`
        @keyframes dashFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:var(--p3);border-radius:10px}
      `}</style>

      <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
        <DashSidebar />
        <div className="ml-[220px] flex-1 flex flex-col min-h-screen">
          <DashTopbar title={t.title} subtitle={t.sub} />

          <main className="flex-1 flex flex-col items-center justify-center p-12 text-center"
            style={{ animation: 'dashFadeUp .5s ease both' }}>

            <ComingSoonIllustration />

            <div className="mt-6 max-w-sm">
              <h2 className="text-[22px] font-black mb-2" style={{ color: 'var(--t1)' }}>
                {t.title}
              </h2>
              <p className="text-[14px] leading-relaxed" style={{ color: 'var(--t3)' }}>
                {t.sub}
              </p>
            </div>

            <div className="flex items-center gap-3 mt-8">
              <button onClick={() => router.back()}
                className="flex items-center gap-2 h-10 px-5 rounded-xl text-[13px] font-bold cursor-pointer transition-all hover:opacity-80"
                style={{ border: '1.5px solid var(--bd)', background: 'var(--white)', color: 'var(--t2)' }}>
                <ArrowLeft className="w-4 h-4" /> {t.back}
              </button>
              <button onClick={() => router.push('/creator')}
                className="flex items-center gap-2 h-10 px-5 rounded-xl text-[13px] font-bold text-white cursor-pointer transition-all hover:opacity-90"
                style={{ background: 'var(--p)', boxShadow: '0 4px 14px rgba(142,120,251,.35)' }}>
                {t.overview}
              </button>
            </div>

            {/* branding */}
            <p className="mt-10 text-[11px] font-semibold" style={{ color: 'var(--t3)', opacity: 0.5 }}>
              built with ❤️ by Wess & Claude · Chabaqa Front V2
            </p>

          </main>
        </div>
      </div>
    </>
  )
}
