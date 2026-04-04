import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar  from '@/components/creator-dashboard/DashTopbar'
import { CreateProductForm } from '@/components/products/create-product-form'

export default function CreateProductPage() {
  return (
    <>
      <style>{`
        @keyframes dashFadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:var(--p3);border-radius:10px}
      `}</style>
      <div className="flex h-screen overflow-hidden" style={{ background:'var(--bg)' }}>
        <DashSidebar />
        <div className="ml-[220px] flex-1 flex flex-col h-screen overflow-hidden">
          <DashTopbar title="Create Product" subtitle="Upload a digital product for your community" />
          <main className="flex-1 flex flex-col overflow-hidden" style={{ animation:'dashFadeUp .4s ease both' }}>
            <CreateProductForm />
          </main>
        </div>
      </div>
    </>
  )
}
