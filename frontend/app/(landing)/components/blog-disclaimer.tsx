export function BlogDisclaimer({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950 ${className}`}
      role="note"
    >
      Editorial content. Platform statistics in these posts are illustrative unless explicitly cited from your own analytics.
    </div>
  )
}
