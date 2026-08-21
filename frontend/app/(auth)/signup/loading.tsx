export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="relative">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#8e78fb]"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-[#8e78fb] font-bold text-sm">Sign Up</div>
        </div>
      </div>
    </div>
  )
}
