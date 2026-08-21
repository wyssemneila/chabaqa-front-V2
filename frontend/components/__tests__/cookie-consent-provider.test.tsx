import React from "react"
import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { CookieConsentProvider } from "@/components/cookie-consent-provider"
import { COOKIE_CONSENT_KEY } from "@/lib/cookie-consent"

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

describe("CookieConsentProvider", () => {
  beforeEach(() => {
    localStorage.clear()
    document.cookie = `${COOKIE_CONSENT_KEY}=; Max-Age=0; Path=/`
  })

  it("shows banner on first visit and can reject non-essential cookies", () => {
    render(<CookieConsentProvider />)

    expect(screen.getByText(/we use essential cookies/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /reject non-essential/i }))

    expect(screen.queryByText(/we use essential cookies/i)).not.toBeInTheDocument()
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY)
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw as string)
    expect(parsed.analytics).toBe(false)
  })

  it("opens settings modal and saves preferences", () => {
    render(<CookieConsentProvider />)

    fireEvent.click(screen.getByRole("button", { name: /settings/i }))
    expect(screen.getByText(/cookie preferences/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole("switch", { name: /enable analytics cookies/i }))
    fireEvent.click(screen.getByRole("button", { name: /save preferences/i }))

    expect(screen.queryByText(/we use essential cookies/i)).not.toBeInTheDocument()
    const raw = localStorage.getItem(COOKIE_CONSENT_KEY)
    const parsed = JSON.parse(raw as string)
    expect(parsed.analytics).toBe(true)
  })

  it("reopens preferences when manage cookies event is dispatched", () => {
    render(<CookieConsentProvider />)

    fireEvent.click(screen.getByRole("button", { name: /accept all/i }))
    expect(screen.queryByText(/we use essential cookies/i)).not.toBeInTheDocument()

    window.dispatchEvent(new CustomEvent("chabaqa:open-cookie-preferences"))
    return waitFor(() => {
      expect(screen.getByText(/cookie preferences/i)).toBeInTheDocument()
    })
  })
})
