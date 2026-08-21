import React from "react"
import { render, waitFor } from "@testing-library/react"
import { COOKIE_CONSENT_KEY } from "@/lib/cookie-consent"
import { Ga4ScriptGate } from "@/components/ga4-script-gate"

jest.mock("next/script", () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => <script {...props}>{children}</script>,
}))

describe("Ga4ScriptGate", () => {
  const originalMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  beforeEach(() => {
    localStorage.clear()
    document.cookie = `${COOKIE_CONSENT_KEY}=; Max-Age=0; Path=/`
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TEST1234"
  })

  afterAll(() => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = originalMeasurementId
  })

  it("does not render GA scripts without analytics consent", () => {
    render(<Ga4ScriptGate />)

    expect(document.querySelector('script[src*="googletagmanager.com/gtag/js"]')).toBeNull()
  })

  it("renders GA scripts when analytics consent exists", () => {
    localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({
        version: "1",
        timestamp: new Date().toISOString(),
        essential: true,
        analytics: true,
      }),
    )

    render(<Ga4ScriptGate />)
    return waitFor(() => {
      expect(document.querySelector('script[src*="googletagmanager.com/gtag/js?id=G-TEST1234"]')).toBeTruthy()
      expect(document.querySelector("script#ga4-init")).toBeTruthy()
    })
  })
})
