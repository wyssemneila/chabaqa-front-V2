'use client'

import { useEffect, useMemo, useState } from 'react'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar from '@/components/creator-dashboard/DashTopbar'
import { Button } from '@/components/ui/button'
import { Check, ChevronRight, Copy, KeyRound, Play, RotateCcw, Server, Timer, TriangleAlert } from 'lucide-react'

type Endpoint = { method: string; path: string; scope?: string; description?: string; parameters?: { name: string; required?: boolean; description?: string }[] }
type Contract = { endpoints?: Endpoint[]; version?: string }

const FALLBACK_ENDPOINTS: Endpoint[] = [
  { method: 'GET', path: '/creator/integrations/public/v1/me', scope: 'read', description: 'Returns the creator associated with this API key.' },
  { method: 'GET', path: '/creator/integrations/public/v1/communities', scope: 'read', description: 'Lists communities available to this API key.' },
  { method: 'GET', path: '/creator/integrations/public/v1/communities/:communityId', scope: 'read', description: 'Returns a community by its ID.', parameters: [{ name: 'communityId', required: true, description: 'Community ID' }] },
]

function initialBaseUrl() {
  if (typeof window === 'undefined') return '/api'
  return `${window.location.origin}/api`
}

export default function ApiPlaygroundPage() {
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [contract, setContract] = useState<Contract | null>(null)
  const [selected, setSelected] = useState(0)
  const [pathValues, setPathValues] = useState<Record<string, string>>({})
  const [result, setResult] = useState<{ status: number; statusText: string; body: string; duration: number; url: string } | null>(null)
  const [running, setRunning] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setBaseUrl(initialBaseUrl())
    // Remove keys saved by the previous playground implementation. API keys
    // are intentionally memory-only now.
    localStorage.removeItem('chabaqa-playground-api-key')
  }, [])

  useEffect(() => {
    if (!baseUrl) return
    const normalized = baseUrl.replace(/\/+$/, '')
    fetch(`${normalized}/creator/integrations/public/v1/contract`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Contract unavailable')))
      .then(payload => setContract(payload?.data || payload))
      .catch(() => setContract(null))
  }, [baseUrl])

  const endpoints = contract?.endpoints?.length ? contract.endpoints : FALLBACK_ENDPOINTS
  const endpoint = endpoints[selected] || endpoints[0]
  // The deployed API URL convention includes `/api`; the contract paths also
  // include it. Remove one copy so a configured `https://host/api` never
  // becomes `https://host/api/api/...`.
  const endpointPath = useMemo(() => baseUrl.replace(/\/+$/, '').endsWith('/api') ? endpoint.path.replace(/^\/api(?=\/)/, '') : endpoint.path, [baseUrl, endpoint.path])
  const resolvedPath = useMemo(() => endpointPath.replace(/:([A-Za-z0-9_]+)/g, (_, name) => encodeURIComponent(pathValues[name] || `:${name}`)), [endpointPath, pathValues])
  const requestUrl = `${baseUrl.replace(/\/+$/, '')}${resolvedPath}`

  const runRequest = async () => {
    setRunning(true); setResult(null)
    const started = performance.now()
    try {
      const response = await fetch(requestUrl, { headers: { 'X-Chabaqa-Api-Key': apiKey, Accept: 'application/json' } })
      const text = await response.text()
      let body = text
      try { body = JSON.stringify(JSON.parse(text), null, 2) } catch { /* preserve non-JSON responses */ }
      setResult({ status: response.status, statusText: response.statusText, body, duration: Math.round(performance.now() - started), url: requestUrl })
    } catch (error: any) {
      setResult({ status: 0, statusText: 'Network error', body: error?.message || 'Request could not be completed. Check the base URL and CORS configuration.', duration: Math.round(performance.now() - started), url: requestUrl })
    } finally { setRunning(false) }
  }
  const copy = async (value: string) => { await navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1600) }

  return <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}><DashSidebar /><div className="md:ml-[220px] flex min-h-screen flex-1 flex-col"><DashTopbar title="API playground" subtitle="Make live requests against your Chabaqa data with a creator API key." /><main className="mx-auto w-full max-w-7xl space-y-5 p-5 sm:p-7">
    <section className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: 'var(--bd)' }}><div className="flex flex-col gap-4 lg:flex-row lg:items-end"><div className="flex-1"><label className="mb-1.5 flex items-center gap-2 text-sm font-semibold"><Server className="h-4 w-4 text-[var(--p)]" />Base URL</label><input value={baseUrl} readOnly className="w-full rounded-xl border bg-[var(--bg)] px-3 py-2.5 font-mono text-sm" /><p className="mt-1.5 text-xs text-[var(--t3)]">Requests are restricted to this Chabaqa origin so an API key cannot be sent to another host.</p></div><div className="flex-1"><label className="mb-1.5 flex items-center gap-2 text-sm font-semibold"><KeyRound className="h-4 w-4 text-[var(--p)]" />Creator API key</label><input value={apiKey} onChange={e => setApiKey(e.target.value)} type="password" autoComplete="off" placeholder="chq_…" className="w-full rounded-xl border bg-[var(--bg)] px-3 py-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-[var(--p)]" /><p className="mt-1.5 text-xs text-[var(--t3)]">Kept in memory for this page only; it is never saved to local storage.</p></div><Button variant="outline" onClick={() => { setBaseUrl(`${window.location.origin}/api`); setApiKey(''); setResult(null) }}><RotateCcw className="mr-2 h-4 w-4" />Reset</Button></div></section>
    <div className="grid gap-5 lg:grid-cols-[290px_minmax(0,1fr)]"><aside className="overflow-hidden rounded-2xl border bg-white" style={{ borderColor: 'var(--bd)' }}><div className="border-b p-4"><p className="font-semibold">Endpoints</p><p className="mt-1 text-xs text-[var(--t3)]">{contract ? 'Loaded from the live API contract' : 'Using built-in API reference'}</p></div><div className="p-2">{endpoints.map((item, index) => <button key={`${item.method}-${item.path}`} onClick={() => { setSelected(index); setPathValues({}); setResult(null) }} className={`mb-1 w-full rounded-xl p-3 text-left transition ${index === selected ? 'bg-[var(--p)] text-white shadow-sm' : 'hover:bg-[var(--bg)]'}`}><span className="text-[11px] font-bold">{item.method}</span><span className="mt-1 block break-all font-mono text-xs">{item.path}</span></button>)}</div></aside>
      <section className="space-y-5"><div className="rounded-2xl border bg-white p-5 shadow-sm" style={{ borderColor: 'var(--bd)' }}><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="rounded-md bg-emerald-50 px-2 py-1 font-mono text-xs font-bold text-emerald-700">{endpoint.method}</span><h2 className="font-mono text-base font-semibold">{endpoint.path}</h2></div><p className="mt-2 text-sm text-[var(--t3)]">{endpoint.description || 'Live Chabaqa API endpoint.'}</p></div><span className="rounded-full bg-[var(--bg)] px-2.5 py-1 text-xs">Scope: {endpoint.scope || 'read'}</span></div>
        {(endpoint.parameters || []).map(param => <div key={param.name} className="mt-4"><label className="mb-1 block text-sm font-medium">{param.name}{param.required && <span className="text-red-500"> *</span>}</label><input value={pathValues[param.name] || ''} onChange={e => setPathValues({ ...pathValues, [param.name]: e.target.value })} placeholder={param.description || param.name} className="w-full rounded-xl border bg-[var(--bg)] px-3 py-2 font-mono text-sm" /></div>)}
        <div className="mt-5 rounded-xl border bg-slate-950 p-3 text-slate-100"><div className="flex items-center justify-between gap-2"><code className="overflow-x-auto whitespace-nowrap text-xs">{requestUrl}</code><button onClick={() => copy(requestUrl)} className="shrink-0 text-slate-300 hover:text-white">{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}</button></div></div><Button className="mt-4" disabled={running || !apiKey || /:[A-Za-z]/.test(resolvedPath)} onClick={runRequest}>{running ? <Timer className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />} {running ? 'Sending request…' : 'Send request'}</Button>{!apiKey && <p className="mt-2 text-xs text-amber-700">Add a creator API key to send requests.</p>}</div>
        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm" style={{ borderColor: 'var(--bd)' }}><div className="flex items-center justify-between border-b px-5 py-3"><div><h2 className="font-semibold">Response</h2><p className="text-xs text-[var(--t3)]">The raw response from the configured base URL.</p></div>{result && <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${result.status >= 200 && result.status < 300 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{result.status || 'Error'} {result.statusText} · {result.duration} ms</span>}</div>{result ? <pre className="max-h-[440px] overflow-auto bg-slate-950 p-5 text-xs leading-5 text-slate-100">{result.body}</pre> : <div className="flex min-h-48 flex-col items-center justify-center p-6 text-center text-sm text-[var(--t3)]"><ChevronRight className="mb-2 h-6 w-6" />Choose an endpoint and send a request to inspect your live data.</div>}</div>
      </section></div><div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900"><TriangleAlert className="h-4 w-4 shrink-0" />Use a limited, revocable key. This playground keeps it only in memory until you leave or refresh the page; never share it in screenshots.</div>
  </main></div></div>
}
