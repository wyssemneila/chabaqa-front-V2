'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Cable, CheckCircle2, Copy, KeyRound, Loader2, Play, Send, Settings2, ShieldCheck, TestTube2, Webhook, XCircle } from 'lucide-react'
import DashSidebar from '@/components/creator-dashboard/DashSidebar'
import DashTopbar from '@/components/creator-dashboard/DashTopbar'
import GoogleCalendarIntegration from '@/app/(creator)/creator/sessions/components/google-calendar-integration'
import { creatorIntegrationsApi, type IntegrationProvider } from '@/lib/api/creator-integrations.api'
import { Button } from '@/components/ui/button'

const EVENT_OPTIONS = ['member.joined','member.left','purchase.paid','purchase.refunded','subscription.started','subscription.canceled','course.enrolled','course.completed','challenge.joined','challenge.completed','challenge.submitted','session.booked','session.canceled','event.registered','post.created']
const NATIVE_PROVIDERS: IntegrationProvider[] = ['google_sheets','kit','brevo','zoom','discord']
const LABELS: Record<string,string> = { zapier:'Zapier', make:'Make', google_sheets:'Google Sheets', kit:'Kit', brevo:'Brevo', zoom:'Zoom', discord:'Discord', webhook:'Custom webhooks', google_calendar:'Google Calendar' }
const LOGOS: Record<string,string> = { zapier:'/integrations/zapier.svg', make:'/integrations/make.svg', google_sheets:'/integrations/googlesheets.svg', kit:'/integrations/kit.svg', brevo:'/integrations/brevo.svg', zoom:'/integrations/zoom.svg', discord:'/integrations/discord.svg' }

const unwrap = (response: any) => response?.data ?? response

function initialNativeForm(provider?: string, config?: any) {
  return {
    provider: provider || '', apiKey: '', spreadsheetId: config?.spreadsheetId || '', sheetName: config?.sheetName || 'Chabaqa events',
    policyVersion: config?.policyVersion || '', tagIds: Array.isArray(config?.tagIds) ? config.tagIds.join(', ') : '', formId: config?.formId || '',
    listIds: Array.isArray(config?.listIds) ? config.listIds.join(', ') : '', contactSyncEnabled: config?.contactSyncEnabled === true,
    dataProcessingAgreement: false, guildId: config?.guildId || '', channelId: config?.channelId || '', roleId: '',
    announcePosts: config?.announcePosts === true, roleSyncEnabled: false,
    autoCreateMeetings: false, attendanceSync: false,
    events: Array.isArray(config?.events) && config.events.length ? config.events : EVENT_OPTIONS,
  }
}

export default function IntegrationsPage() {
  const [items, setItems] = useState<any[]>([])
  const [hooks, setHooks] = useState<any[]>([])
  const [keys, setKeys] = useState<any[]>([])
  const [deliveries, setDeliveries] = useState<any[]>([])
  const [providerDeliveries, setProviderDeliveries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [secret, setSecret] = useState('')
  const [contract, setContract] = useState<any>(null)
  const [hookForm, setHookForm] = useState({ name: '', url: '', events: ['member.joined'] })
  const [selectedProvider, setSelectedProvider] = useState<IntegrationProvider | null>(null)
  const [nativeForm, setNativeForm] = useState<any>(() => initialNativeForm())

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [integrations, webhookRows, apiKeys, webhookDeliveries, nativeDeliveries] = await Promise.all([
        creatorIntegrationsApi.list(), creatorIntegrationsApi.webhooks(), creatorIntegrationsApi.apiKeys(), creatorIntegrationsApi.deliveries(), creatorIntegrationsApi.providerDeliveries(),
      ])
      setItems(unwrap(integrations) || [])
      setHooks(unwrap(webhookRows) || [])
      setKeys(unwrap(apiKeys) || [])
      setDeliveries(unwrap(webhookDeliveries) || [])
      setProviderDeliveries(unwrap(nativeDeliveries) || [])
    } catch (requestError: any) {
      setError(requestError?.message || 'Unable to load integrations.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    fetch('/api/creator/integrations/public/v1/contract').then((response) => response.json()).then((payload) => setContract(unwrap(payload))).catch(() => undefined)
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.type !== 'CHABAQA_INTEGRATION_OAUTH_RESULT') return
      if (event.data?.success) {
        setSelectedProvider(null)
        void load()
      } else {
        setError(`${LABELS[event.data?.provider] || 'This'} connection was not completed.`)
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const nativeItems = useMemo(() => items.filter((item) => NATIVE_PROVIDERS.includes(item.provider)), [items])
  const toggleHookEvent = (event: string) => setHookForm((current) => ({ ...current, events: current.events.includes(event) ? current.events.filter((item) => item !== event) : [...current.events, event] }))
  const toggleNativeEvent = (event: string) => setNativeForm((current: any) => ({ ...current, events: current.events.includes(event) ? current.events.filter((item: string) => item !== event) : [...current.events, event] }))

  const createWebhook = async (event: FormEvent) => {
    event.preventDefault()
    try {
      const response = await creatorIntegrationsApi.createWebhook(hookForm)
      setSecret(unwrap(response)?.signingSecret || '')
      setHookForm({ name: '', url: '', events: ['member.joined'] })
      await load()
    } catch (requestError: any) {
      setError(requestError?.message || 'Could not create webhook')
    }
  }

  const createKey = async () => {
    const name = window.prompt('Name this API key')
    if (!name) return
    try {
      const response = await creatorIntegrationsApi.createApiKey(name)
      setSecret(unwrap(response)?.token || '')
      await load()
    } catch (requestError: any) {
      setError(requestError?.message || 'Could not create API key')
    }
  }

  const openNativeSetup = (provider: IntegrationProvider, item?: any) => {
    setError('')
    setSelectedProvider(provider)
    setNativeForm(initialNativeForm(provider, item?.connection?.config))
  }

  const nativeConfig = () => ({
    spreadsheetId: nativeForm.spreadsheetId,
    sheetName: nativeForm.sheetName,
    policyVersion: nativeForm.policyVersion,
    tagIds: nativeForm.tagIds.split(',').map((value: string) => value.trim()).filter(Boolean),
    formId: nativeForm.formId,
    listIds: nativeForm.listIds.split(',').map((value: string) => value.trim()).filter(Boolean),
    contactSyncEnabled: nativeForm.contactSyncEnabled,
    dataProcessingAgreement: nativeForm.dataProcessingAgreement,
    guildId: nativeForm.guildId,
    channelId: nativeForm.channelId,
    announcePosts: nativeForm.announcePosts,
    events: nativeForm.events,
  })

  const saveNative = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedProvider) return
    setSaving(true)
    setError('')
    try {
      const config = nativeConfig()
      if (selectedProvider === 'kit' || selectedProvider === 'brevo') {
        await creatorIntegrationsApi.saveCredentials(selectedProvider, nativeForm.apiKey, config)
        setNativeForm((current: any) => ({ ...current, apiKey: '' }))
        setSelectedProvider(null)
        await load()
        return
      }
      const response = await creatorIntegrationsApi.startOAuth(selectedProvider as 'google_sheets'|'zoom'|'discord', config)
      const authorizationUrl = unwrap(response)?.authorizationUrl
      if (!authorizationUrl) throw new Error('The provider did not return an authorization URL')
      const popup = window.open(authorizationUrl, 'chabaqa-integration-oauth', 'popup=yes,width=560,height=720,noopener=no')
      if (!popup) window.location.assign(authorizationUrl)
    } catch (requestError: any) {
      setError(requestError?.message || 'Could not start this provider setup')
    } finally {
      setSaving(false)
    }
  }

  const saveMapping = async () => {
    if (!selectedProvider) return
    setSaving(true)
    try {
      await creatorIntegrationsApi.updateConfiguration(selectedProvider as 'google_sheets'|'kit'|'brevo'|'zoom'|'discord', nativeConfig())
      await load()
      setSelectedProvider(null)
    } catch (requestError: any) {
      setError(requestError?.message || 'Could not save this mapping')
    } finally {
      setSaving(false)
    }
  }

  const renderNativeFields = () => {
    if (selectedProvider === 'google_sheets') return <><Field label="Google spreadsheet ID" value={nativeForm.spreadsheetId} onChange={(value) => setNativeForm({ ...nativeForm, spreadsheetId: value })} placeholder="1Abc…" required /><Field label="Sheet tab name" value={nativeForm.sheetName} onChange={(value) => setNativeForm({ ...nativeForm, sheetName: value })} placeholder="Chabaqa events" /></>
    if (selectedProvider === 'kit') return <><SecretField label="Kit API key" value={nativeForm.apiKey} onChange={(value) => setNativeForm({ ...nativeForm, apiKey: value })} required /><Field label="Kit tag IDs (comma separated)" value={nativeForm.tagIds} onChange={(value) => setNativeForm({ ...nativeForm, tagIds: value })} placeholder="123, 456" /><Field label="Kit form ID (optional)" value={nativeForm.formId} onChange={(value) => setNativeForm({ ...nativeForm, formId: value })} placeholder="123" /><ConsentFields form={nativeForm} setForm={setNativeForm} /></>
    if (selectedProvider === 'brevo') return <><SecretField label="Brevo API key" value={nativeForm.apiKey} onChange={(value) => setNativeForm({ ...nativeForm, apiKey: value })} required /><Field label="Brevo list IDs (comma separated)" value={nativeForm.listIds} onChange={(value) => setNativeForm({ ...nativeForm, listIds: value })} placeholder="2, 17" /><ConsentFields form={nativeForm} setForm={setNativeForm} /></>
    if (selectedProvider === 'zoom') return <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">Zoom OAuth securely verifies the creator connection only. Chabaqa does not create meetings or import attendance in this release.</p>
    if (selectedProvider === 'discord') return <><p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">The bot token remains server-only. Install it in the selected guild before enabling post announcements. Role synchronization is deliberately unavailable until verified member identity linking and role hierarchy checks are shipped.</p><Field label="Guild ID" value={nativeForm.guildId} onChange={(value) => setNativeForm({ ...nativeForm, guildId: value })} placeholder="Discord guild ID" /><Field label="Announcement channel ID" value={nativeForm.channelId} onChange={(value) => setNativeForm({ ...nativeForm, channelId: value })} placeholder="Discord channel ID" /><Check label="Announce new community posts" checked={nativeForm.announcePosts} onChange={(checked) => setNativeForm({ ...nativeForm, announcePosts: checked })} /></>
    return null
  }

  return <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}><DashSidebar /><div className="md:ml-[220px] flex min-h-screen flex-1 flex-col"><DashTopbar title="Integrations" subtitle="Connect creator workflows, enforce consent, and inspect delivery health." /><main className="max-w-6xl space-y-6 p-5 sm:p-7">
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
    {secret && <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900"><b>Copy this secret now.</b> It is never shown again.<div className="mt-2 flex gap-2"><code className="min-w-0 flex-1 overflow-x-auto rounded bg-white p-2">{secret}</code><Button size="sm" onClick={() => navigator.clipboard.writeText(secret)}><Copy className="mr-1 h-4 w-4" />Copy</Button><Button size="sm" variant="outline" onClick={() => setSecret('')}>Done</Button></div></div>}
    <GoogleCalendarIntegration />

    <section className="rounded-2xl border bg-white p-5" style={{ borderColor: 'var(--bd)' }}><div className="mb-4 flex items-start gap-2"><Cable className="mt-0.5 h-5 w-5 text-[var(--p)]" /><div><h2 className="font-bold">Native connectors</h2><p className="text-sm text-[var(--t3)]">Credentials are encrypted at rest, OAuth uses one-time PKCE state, and a connector is only marked connected after a successful account test.</p></div></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{nativeItems.map((item) => { const connected = item.connection?.status === 'connected'; const status = item.connection?.status || item.status; const canTest = Boolean(item.connection) && ['connected', 'needs_attention'].includes(status); const canDisconnect = Boolean(item.connection) && status !== 'setup_required'; const logo = LOGOS[item.provider]; return <div key={item.provider} className="rounded-xl border p-4" style={{ borderColor: 'var(--bd)' }}><div className="flex items-start justify-between gap-2"><div className="flex items-center gap-2.5">{logo && <span className="flex h-9 w-9 items-center justify-center rounded-lg border bg-white p-1.5"><img src={logo} alt="" className="h-full w-full object-contain" /></span>}<b>{LABELS[item.provider]}</b></div><Status status={status} /></div><p className="mt-3 min-h-10 text-xs text-[var(--t3)]">{item.capabilities?.join(' · ').replaceAll('_', ' ')}</p>{item.setup?.requires && <p className="mt-2 text-[11px] text-[var(--t3)]">{item.setup.requires.join(' · ')}</p>}<div className="mt-3 flex flex-wrap gap-2"><Button size="sm" onClick={() => openNativeSetup(item.provider, item)}>{connected ? <Settings2 className="mr-1 h-4 w-4" /> : null}{connected ? 'Configure' : 'Set up'}</Button>{canTest && <Button size="sm" variant="outline" onClick={() => creatorIntegrationsApi.testConnection(item.provider).then(load).catch((e: any) => setError(e?.message || 'Connection test failed'))}><TestTube2 className="mr-1 h-4 w-4" />Test</Button>}{canDisconnect && <Button size="sm" variant="outline" onClick={() => creatorIntegrationsApi.disconnect(item.connection._id || item.connection.id).then(load).catch((e: any) => setError(e?.message || 'Disconnect failed'))}>Disconnect</Button>}</div></div> })}</div></section>

    {selectedProvider && <section className="rounded-2xl border border-[var(--p)] bg-white p-5 shadow-sm"><div className="mb-4 flex items-start justify-between gap-3"><div><h2 className="font-bold">Set up {LABELS[selectedProvider]}</h2><p className="mt-1 text-xs text-[var(--t3)]">Secrets are submitted directly to the backend, encrypted, and never placed in local storage, URLs, or the connection list.</p></div><Button size="sm" variant="outline" onClick={() => setSelectedProvider(null)}>Close</Button></div><form onSubmit={saveNative} className="space-y-3">{renderNativeFields()}<fieldset className="rounded-xl border p-3"><legend className="px-1 text-xs font-semibold">Events this connector may process</legend><div className="mt-1 flex flex-wrap gap-2">{EVENT_OPTIONS.map((event) => <label key={event} className="rounded-full border px-2 py-1 text-xs"><input className="mr-1" type="checkbox" checked={nativeForm.events.includes(event)} onChange={() => toggleNativeEvent(event)} />{event}</label>)}</div></fieldset><div className="flex flex-wrap gap-2"><Button disabled={saving || !nativeForm.events.length}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}{selectedProvider === 'kit' || selectedProvider === 'brevo' ? 'Save encrypted credential' : 'Continue with OAuth'}</Button><Button type="button" variant="outline" disabled={saving} onClick={saveMapping}>Save mapping only</Button></div></form></section>}

    <section className="rounded-2xl border bg-white p-5" style={{ borderColor: 'var(--bd)' }}><h3 className="text-sm font-bold">Zapier / Make Catch Hooks</h3><p className="mt-1 text-xs text-[var(--t3)]">Use a final HTTPS Catch Hook URL. Chabaqa resolves the host, rejects private networks, and does not follow redirects.</p><div className="mt-3 grid gap-3 sm:grid-cols-2">{items.filter((item) => ['zapier', 'make'].includes(item.provider)).map((item) => { const connected = item.connection?.status === 'connected'; return <div key={item.provider} className="rounded-xl border p-4"><div className="flex items-center justify-between"><b>{LABELS[item.provider]}</b><Status status={connected ? 'connected' : 'setup_required'} /></div><Button className="mt-3" size="sm" variant={connected ? 'outline' : 'default'} onClick={async () => { try { if (connected) await creatorIntegrationsApi.disconnect(item.connection._id || item.connection.id); else { const webhookUrl = window.prompt(`Paste the final HTTPS Catch Hook URL from ${LABELS[item.provider]}`); if (!webhookUrl) return; await creatorIntegrationsApi.connect(item.provider as IntegrationProvider, { webhookUrl, events: EVENT_OPTIONS }); } await load() } catch (requestError: any) { setError(requestError?.message || 'Integration update failed') } }}>{connected ? 'Disconnect' : 'Connect hook'}</Button></div> })}</div><ol className="mt-4 list-decimal space-y-1 pl-5 text-xs text-[var(--t3)]"><li>Create a Zapier Catch Hook or Make Custom Webhook, then paste its final HTTPS URL.</li><li>Use <code>x-chabaqa-event-id</code> as the downstream idempotency key.</li><li>Send a signed test delivery after mapping fields.</li></ol></section>

    <section className="grid gap-6 lg:grid-cols-2"><form onSubmit={createWebhook} className="rounded-2xl border bg-white p-5" style={{ borderColor: 'var(--bd)' }}><div className="mb-4 flex gap-2"><Webhook className="h-5 w-5 text-[var(--p)]" /><div><h2 className="font-bold">Signed webhooks</h2><p className="text-xs text-[var(--t3)]">HTTPS only. Every request includes HMAC SHA-256 and a stable delivery ID.</p></div></div><input required value={hookForm.name} onChange={(e) => setHookForm({ ...hookForm, name: e.target.value })} placeholder="Webhook name" className="mb-2 w-full rounded-lg border p-2 text-sm" /><input required type="url" value={hookForm.url} onChange={(e) => setHookForm({ ...hookForm, url: e.target.value })} placeholder="https://your-app.com/chabaqa" className="mb-3 w-full rounded-lg border p-2 text-sm" /><div className="mb-3 flex flex-wrap gap-2">{EVENT_OPTIONS.map((event) => <label key={event} className="rounded-full border px-2 py-1 text-xs"><input className="mr-1" type="checkbox" checked={hookForm.events.includes(event)} onChange={() => toggleHookEvent(event)} />{event}</label>)}</div><Button disabled={!hookForm.events.length}><Send className="mr-2 h-4 w-4" />Create webhook</Button><div className="mt-4 space-y-2">{hooks.map((hook) => <div key={hook._id || hook.id} className="flex items-center justify-between rounded-lg bg-[var(--bg)] p-2 text-xs"><span className="truncate">{hook.name} · {hook.events?.length} events</span><span className="flex gap-1"><Button size="sm" variant="outline" onClick={() => creatorIntegrationsApi.testWebhook(hook._id || hook.id).then(load).catch((e: any) => setError(e?.message || 'Test failed'))}>Test</Button><Button size="sm" variant="outline" onClick={() => creatorIntegrationsApi.deleteWebhook(hook._id || hook.id).then(load).catch((e: any) => setError(e?.message || 'Remove failed'))}>Remove</Button></span></div>)}</div></form>
      <section className="rounded-2xl border bg-white p-5" style={{ borderColor: 'var(--bd)' }}><div className="mb-4 flex gap-2"><KeyRound className="h-5 w-5 text-[var(--p)]" /><div><h2 className="font-bold">API keys</h2><p className="text-xs text-[var(--t3)]">Scoped, hashed credentials for your own tools. Revoke a key instantly if it is exposed.</p></div></div><Button size="sm" onClick={createKey}>Create API key</Button><div className="mt-4 space-y-2">{keys.map((key) => <div key={key._id || key.id} className="flex items-center justify-between rounded-lg bg-[var(--bg)] p-2 text-xs"><span>{key.name} · {key.prefix}… · {(key.scopes || []).join(', ')}</span>{key.revokedAt ? <span className="text-red-500">Revoked</span> : <Button size="sm" variant="outline" onClick={() => creatorIntegrationsApi.revokeApiKey(key._id || key.id).then(load)}>Revoke</Button>}</div>)}</div><h3 className="mt-6 text-sm font-bold">Delivery health</h3><DeliveryRows rows={[...deliveries, ...providerDeliveries].slice(0, 10)} onReplay={(id) => creatorIntegrationsApi.replayDelivery(id).then(load).catch((e: any) => setError(e?.message || 'Replay failed'))} /></section></section>

    <section className="rounded-2xl border bg-white p-5" style={{ borderColor: 'var(--bd)' }}><div className="mb-3 flex items-start justify-between gap-3"><div className="flex gap-2"><BookOpen className="h-5 w-5 text-[var(--p)]" /><div><h2 className="font-bold">Developer API contract</h2><p className="text-xs text-[var(--t3)]">Use a creator API key only from trusted server-side tools.</p></div></div><Button asChild size="sm"><Link href="/creator/integrations/playground"><Play className="mr-2 h-4 w-4" />Open playground</Link></Button></div><div className="grid gap-3 lg:grid-cols-2"><div><p className="mb-1 text-xs font-bold">Authentication</p><code className="block overflow-x-auto rounded bg-[var(--bg)] p-3 text-xs">X-Chabaqa-Api-Key: chq_…</code><p className="mb-1 mt-3 text-xs font-bold">Read your data</p><code className="block overflow-x-auto whitespace-pre rounded bg-[var(--bg)] p-3 text-xs">GET /api/creator/integrations/public/v1/me{'\n'}GET /api/creator/integrations/public/v1/communities{'\n'}GET /api/creator/integrations/public/v1/communities/:communityId</code></div><div><p className="mb-1 text-xs font-bold">Verified event contract</p><div className="flex flex-wrap gap-1">{(contract?.events || EVENT_OPTIONS).map((event: string) => <span key={event} className="rounded bg-[var(--bg)] px-2 py-1 text-[11px]">{event}</span>)}</div><p className="mt-3 text-[11px] text-[var(--t3)]">{contract?.eventPrivacy?.formSubmitted}</p></div></div><p className="mt-3 text-[11px] text-[var(--t3)]">Public API limits: {contract?.rateLimits?.perSecond || 10}/sec · {contract?.rateLimits?.perMinute || 60}/min · {contract?.rateLimits?.perHour || 500}/hour per API key.</p></section>
    {contract?.webhook && <section className="rounded-2xl border bg-white p-5" style={{ borderColor: 'var(--bd)' }}><h3 className="mb-2 text-sm font-bold">Webhook delivery contract</h3><p className="text-xs text-[var(--t3)]">{contract.webhook.successResponse}</p><p className="mt-1 text-xs text-[var(--t3)]">{contract.webhook.redirectPolicy}</p><code className="mt-3 block overflow-x-auto whitespace-pre rounded bg-[var(--bg)] p-3 text-xs">{JSON.stringify(contract.webhook.payload, null, 2)}</code></section>}
    {loading && <div className="flex items-center gap-2 text-sm text-[var(--t3)]"><Loader2 className="h-4 w-4 animate-spin" />Loading integrations…</div>}
  </main></div></div>
}

function Field({ label, value, onChange, placeholder, required = false }: { label: string, value: string, onChange: (value: string) => void, placeholder?: string, required?: boolean }) {
  return <label className="block text-sm"><span className="mb-1 block font-medium">{label}{required && <span className="text-red-500"> *</span>}</span><input required={required} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-lg border p-2 text-sm" /></label>
}

function SecretField(props: { label: string, value: string, onChange: (value: string) => void, required?: boolean }) {
  return <label className="block text-sm"><span className="mb-1 block font-medium">{props.label}{props.required && <span className="text-red-500"> *</span>}</span><input required={props.required} type="password" autoComplete="new-password" value={props.value} onChange={(event) => props.onChange(event.target.value)} placeholder="Stored encrypted; never displayed again" className="w-full rounded-lg border p-2 text-sm" /></label>
}

function Check({ label, checked, onChange }: { label: string, checked: boolean, onChange: (checked: boolean) => void }) {
  return <label className="flex items-start gap-2 text-xs"><input className="mt-0.5" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span>{label}</span></label>
}

function ConsentFields({ form, setForm }: { form: any, setForm: (value: any) => void }) {
  return <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="text-xs text-amber-900"><b>Consent protection:</b> contact sync never sends a member email until that member has recorded consent for this provider and community.</p><Check label="Enable consented contact synchronization" checked={form.contactSyncEnabled} onChange={(checked) => setForm({ ...form, contactSyncEnabled: checked })} /><Field label="Consent/privacy policy version" value={form.policyVersion} onChange={(value) => setForm({ ...form, policyVersion: value })} placeholder="2026-08" required={form.contactSyncEnabled} /><Check label="I confirm this mapping and my data-processing policy are ready." checked={form.dataProcessingAgreement} onChange={(checked) => setForm({ ...form, dataProcessingAgreement: checked })} /></div>
}

function Status({ status }: { status: string }) {
  if (status === 'connected') return <span className="inline-flex items-center gap-1 text-xs text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" />Connected</span>
  if (status === 'needs_attention') return <span className="inline-flex items-center gap-1 text-xs text-amber-700"><XCircle className="h-3.5 w-3.5" />Needs attention</span>
  return <span className="text-xs text-[var(--t3)]">Setup required</span>
}

function DeliveryRows({ rows, onReplay }: { rows: any[], onReplay: (id: string) => void }) {
  if (!rows.length) return <p className="mt-2 text-xs text-[var(--t3)]">No deliveries yet.</p>
  return <div className="mt-2 space-y-2">{rows.map((delivery) => <div key={delivery._id || delivery.id} className="flex items-center justify-between gap-2 text-xs"><span className="truncate">{delivery.provider ? `${LABELS[delivery.provider] || delivery.provider} · ` : ''}{delivery.event}</span><span className="flex items-center gap-2"><span className={delivery.status === 'delivered' ? 'text-emerald-600' : delivery.status === 'skipped' ? 'text-[var(--t3)]' : 'text-red-600'}>{delivery.status}{delivery.responseStatus ? ` (${delivery.responseStatus})` : ''}</span>{delivery.webhookId && <Button size="sm" variant="outline" onClick={() => onReplay(delivery._id || delivery.id)}>Replay</Button>}</span></div>)}</div>
}
