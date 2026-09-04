// Skeleton shown in the content slot while a Reports page loads. The sidebar
// lives in reports/layout.tsx, so it stays put — only this area shimmers, then
// the real content fades in (YouTube/Facebook style).
export default function ReportsLoading() {
  return (
    <>
      <style>{`
        @keyframes skSweep { 100% { transform: translateX(100%) } }
        .sk { position: relative; overflow: hidden; background: var(--p2); border-radius: 10px; }
        .sk::after {
          content: ''; position: absolute; inset: 0; transform: translateX(-100%);
          background: linear-gradient(90deg, transparent, rgba(142,120,251,.20), transparent);
          animation: skSweep 1.4s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce){ .sk::after{ animation: none } }
      `}</style>

      {/* topbar placeholder */}
      <div className="px-7 h-14 flex items-center sticky top-0 z-40"
        style={{ background: 'var(--white)', borderBottom: '1px solid var(--bd)' }}>
        <div className="sk" style={{ width: 120, height: 16 }} />
      </div>

      <div className="p-7">
        {/* KPI row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-5" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
              <div className="sk" style={{ width: 34, height: 34, borderRadius: 10, marginBottom: 12 }} />
              <div className="sk" style={{ width: '55%', height: 20, marginBottom: 8 }} />
              <div className="sk" style={{ width: '75%', height: 11 }} />
            </div>
          ))}
        </div>

        {/* a wide panel with rows (covers funnel / member list / course cards) */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--white)', border: '1px solid var(--bd)' }}>
          <div className="sk" style={{ width: 170, height: 14, marginBottom: 6 }} />
          <div className="sk" style={{ width: 260, height: 11, marginBottom: 18 }} />
          <div className="flex flex-col gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="sk" style={{ width: 30, height: 30, borderRadius: '50%' }} />
                <div className="sk" style={{ width: 150, height: 12 }} />
                <div className="sk" style={{ flex: 1, height: 22, borderRadius: 7 }} />
                <div className="sk" style={{ width: 38, height: 12 }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
