import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export function GET() {
  return NextResponse.json({
    message: "pong",
    service: "chabaqa-frontend",
    timestamp: new Date().toISOString(),
  })
}
