import {
  COOKIE_CONSENT_KEY,
  COOKIE_CONSENT_VERSION,
  getStoredConsent,
  hasAnalyticsConsent,
  isConsentRequired,
  saveConsent,
} from "@/lib/cookie-consent"

describe("cookie consent storage", () => {
  beforeEach(() => {
    localStorage.clear()
    document.cookie = `${COOKIE_CONSENT_KEY}=; Max-Age=0; Path=/`
  })

  it("saves and reads consent", () => {
    const saved = saveConsent({ analytics: true })
    expect(saved).not.toBeNull()

    const stored = getStoredConsent()
    expect(stored?.version).toBe(COOKIE_CONSENT_VERSION)
    expect(stored?.essential).toBe(true)
    expect(stored?.analytics).toBe(true)
    expect(hasAnalyticsConsent()).toBe(true)
    expect(isConsentRequired()).toBe(false)
  })

  it("returns null for malformed data", () => {
    document.cookie = `${COOKIE_CONSENT_KEY}=not-json; Path=/`
    expect(getStoredConsent()).toBeNull()
    expect(isConsentRequired()).toBe(true)
  })

  it("requires consent for unsupported version", () => {
    const invalidVersion = encodeURIComponent(
      JSON.stringify({
        version: "0",
        timestamp: new Date().toISOString(),
        essential: true,
        analytics: true,
      }),
    )
    document.cookie = `${COOKIE_CONSENT_KEY}=${invalidVersion}; Path=/`

    expect(getStoredConsent()).toBeNull()
    expect(isConsentRequired()).toBe(true)
  })

  it("reads localStorage fallback when cookie is missing", () => {
    const payload = JSON.stringify({
      version: COOKIE_CONSENT_VERSION,
      timestamp: new Date().toISOString(),
      essential: true,
      analytics: false,
    })
    localStorage.setItem(COOKIE_CONSENT_KEY, payload)

    const stored = getStoredConsent()
    expect(stored?.analytics).toBe(false)
    expect(hasAnalyticsConsent()).toBe(false)
  })
})
