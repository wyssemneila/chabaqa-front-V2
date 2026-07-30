import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Status",
  description: 'Current operational status of Chabaqa services',
}

type ServiceStatus = 'operational' | 'degraded' | 'down' | 'unknown'

type StatusPayload = {
  overall: ServiceStatus
  checkedAt: string
  services: Array<{
    name: string
    status: ServiceStatus
    detail?: string
  }>
}

async function fetchStatus(): Promise<StatusPayload> {
  const apiBase = (
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3000/api'
  ).replace(/\/$/, '')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:8083'
  const checkedAt = new Date().toISOString()

  const services: StatusPayload['services'] = []

  try {
    const pingRes = await fetch(`${apiBase}/health/ping`, { cache: 'no-store', next: { revalidate: 0 } })
    services.push({
      name: 'API',
      status: pingRes.ok ? 'operational' : 'down',
      detail: pingRes.ok ? 'Ping OK' : `HTTP ${pingRes.status}`,
    })
  } catch {
    services.push({ name: 'API', status: 'down', detail: 'Unreachable' })
  }

  try {
    const deepRes = await fetch(`${apiBase}/health`, { cache: 'no-store', next: { revalidate: 0 } })
    if (deepRes.ok) {
      const body = await deepRes.json()
      const details = body?.details ?? body?.info ?? {}
      const dbDown = Object.values(details).some(
        (entry: unknown) =>
          typeof entry === 'object' &&
          entry !== null &&
          Object.values(entry as Record<string, unknown>).some(
            (check) => typeof check === 'object' && check !== null && (check as { status?: string }).status === 'down',
          ),
      )
      services.push({
        name: 'Database & dependencies',
        status: dbDown ? 'degraded' : 'operational',
      })
    } else {
      services.push({ name: 'Database & dependencies', status: 'degraded', detail: `HTTP ${deepRes.status}` })
    }
  } catch {
    services.push({ name: 'Database & dependencies', status: 'unknown' })
  }

  services.push({
    name: 'Web app',
    status: 'operational',
    detail: appUrl,
  })

  const overall: ServiceStatus = services.some((s) => s.status === 'down')
    ? 'down'
    : services.some((s) => s.status === 'degraded')
      ? 'degraded'
      : 'operational'

  return { overall, checkedAt, services }
}

const statusLabel: Record<ServiceStatus, string> = {
  operational: 'All systems operational',
  degraded: 'Partial degradation',
  down: 'Major outage',
  unknown: 'Status unknown',
}

const statusColor: Record<ServiceStatus, string> = {
  operational: '#16a34a',
  degraded: '#ca8a04',
  down: '#dc2626',
  unknown: '#6b7280',
}

export default async function StatusPage() {
  const status = await fetchStatus()

  return (
    <main style={{ fontFamily: 'system-ui, sans-serif', maxWidth: 640, margin: '48px auto', padding: '0 24px' }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Chabaqa Status</h1>
      <p style={{ color: statusColor[status.overall], fontWeight: 600, marginBottom: 24 }}>
        {statusLabel[status.overall]}
      </p>
      <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 32 }}>
        Last checked: {status.checkedAt}
      </p>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {status.services.map((service) => (
          <li
            key={service.name}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 0',
              borderBottom: '1px solid #e5e7eb',
            }}
          >
            <span>{service.name}</span>
            <span style={{ color: statusColor[service.status], fontWeight: 500, textTransform: 'capitalize' }}>
              {service.status}
              {service.detail ? ` — ${service.detail}` : ''}
            </span>
          </li>
        ))}
      </ul>
      <p style={{ marginTop: 32, fontSize: 13, color: '#9ca3af' }}>
        For incidents, contact support via the in-app help center.
      </p>
    </main>
  )
}
