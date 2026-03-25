import { ChabaSpinner } from "@/components/ui/ChabaSpinner"

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#fafafe" }}>
      <ChabaSpinner size={64} />
    </div>
  )
}
