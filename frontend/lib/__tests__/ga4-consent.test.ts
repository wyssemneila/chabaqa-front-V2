import { COOKIE_CONSENT_KEY } from "@/lib/cookie-consent"

describe("ga4 helper consent guard", () => {
  const originalMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

  beforeEach(() => {
    localStorage.clear()
    document.cookie = `${COOKIE_CONSENT_KEY}=; Max-Age=0; Path=/`
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-TEST1234"
    ;(window as any).gtag = jest.fn()
    jest.resetModules()
  })

  afterAll(() => {
    process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = originalMeasurementId
  })

  it("does not send events without consent", () => {
    const { trackEvent } = require("@/lib/ga4")
    trackEvent("test_event", { source: "unit-test" })
    expect((window as any).gtag).not.toHaveBeenCalled()
  })

  it("sends events when consent is granted", () => {
    localStorage.setItem(
      COOKIE_CONSENT_KEY,
      JSON.stringify({
        version: "1",
        timestamp: new Date().toISOString(),
        essential: true,
        analytics: true,
      }),
    )

    const { trackEvent } = require("@/lib/ga4")
    trackEvent("test_event", { source: "unit-test" })
    expect((window as any).gtag).toHaveBeenCalledWith("event", "test_event", { source: "unit-test" })
  })
})
