import { NextRequest, NextResponse } from "next/server"

function sanitize(value: unknown): unknown {
  if (!value || typeof value !== "object") return value
  const input = value as Record<string, unknown>
  const output: Record<string, unknown> = {}

  for (const [key, entry] of Object.entries(input)) {
    if (/token|password|secret|cookie|authorization/i.test(key)) {
      output[key] = "[REDACTED]"
    } else if (typeof entry === "string") {
      output[key] = entry.slice(0, 2000)
    } else {
      output[key] = entry
    }
  }

  return output
}

export async function POST(request: NextRequest) {
  try {
    const payload = sanitize(await request.json())
    console.error(JSON.stringify({ level: "error", event: "frontend_error", payload, timestamp: new Date().toISOString() }))
  } catch {
    console.error(JSON.stringify({ level: "error", event: "frontend_error_parse_failed", timestamp: new Date().toISOString() }))
  }

  return NextResponse.json({ success: true })
}
