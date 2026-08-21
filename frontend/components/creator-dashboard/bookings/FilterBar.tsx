'use client'

import { Search, ChevronDown } from 'lucide-react'

type View   = 'all' | 'upcoming' | 'past'
type Status = 'all' | 'confirmed' | 'completed' | 'rejected' | 'pending'
type Sort   = 'date' | 'price' | 'status'

interface Props {
  search: string; setSearch: (v:string) => void
  view: View; setView: (v:View) => void
  status: Status; setStatus: (v:Status) => void
  sort: Sort; setSort: (v:Sort) => void
  count: number
}

const VIEWS:   { id:View;   label:string }[] = [{ id:'all', label:'All' }, { id:'upcoming', label:'Upcoming' }, { id:'past', label:'Past' }]
const STATUSES:{ id:Status; label:string }[] = [{ id:'all', label:'All Status' }, { id:'confirmed', label:'Confirmed' }, { id:'completed', label:'Completed' }, { id:'rejected', label:'Rejected' }, { id:'pending', label:'Pending' }]
const SORTS:   { id:Sort;   label:string }[] = [{ id:'date', label:'Date' }, { id:'price', label:'Price' }, { id:'status', label:'Status' }]

const DM = { fontFamily:"'DM Sans',sans-serif" }

export default function FilterBar({ search,setSearch,view,setView,status,setStatus,sort,setSort,count }: Props) {
  return (
    <div className="px-7 py-4 border-b border-slate-100 bg-white space-y-3 sticky top-[57px] z-30">

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" strokeWidth={1.7} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or session..."
          style={DM}
          className="w-full h-10 pl-10 pr-4 rounded-xl border border-slate-200 text-[13px] text-slate-700 placeholder-slate-400
                     focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all bg-slate-50" />
      </div>

      {/* Row 2: chips + dropdowns + count */}
      <div className="flex items-center gap-2 flex-wrap">

        {/* View chips */}
        <div className="flex items-center gap-0.5 p-1 rounded-lg bg-slate-100">
          {VIEWS.map(v => (
            <button key={v.id} onClick={() => setView(v.id)}
              style={DM}
              className={`h-7 px-3.5 rounded-md text-[12px] font-medium transition-all cursor-pointer ${
                view===v.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}>
              {v.label}
            </button>
          ))}
        </div>

        {/* Status dropdown */}
        <div className="relative">
          <select value={status} onChange={e => setStatus(e.target.value as Status)}
            style={DM}
            className="h-8 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-[12px] font-medium text-slate-600
                       appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all">
            {STATUSES.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <select value={sort} onChange={e => setSort(e.target.value as Sort)}
            style={DM}
            className="h-8 pl-3 pr-8 rounded-lg border border-slate-200 bg-white text-[12px] font-medium text-slate-600
                       appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all">
            {SORTS.map(o => <option key={o.id} value={o.id}>Sort: {o.label}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
        </div>

        {/* Count badge */}
        <div className="ml-auto px-3 h-8 flex items-center rounded-lg bg-slate-100 text-[12px] font-semibold text-slate-500"
          style={DM}>
          {count} result{count!==1?'s':''}
        </div>
      </div>
    </div>
  )
}
