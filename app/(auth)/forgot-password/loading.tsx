import { ChabaSpinner } from "@/components/ui/ChabaSpinner"

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg,#fafafe)" }}>
      <ChabaSpinner size={48} />
    </div>
  )
}
