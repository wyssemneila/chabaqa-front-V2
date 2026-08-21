import React from "react"
import { render, screen } from "@testing-library/react"
import { SafeHtml } from "@/components/security/safe-html"

describe("SafeHtml", () => {
  it("removes scripts and event handlers from rendered content", () => {
    const { container } = render(
      <SafeHtml html={'<p onclick="alert(1)">Hello</p><script>alert(1)</script><img src="/ok.png" onerror="alert(1)" alt="ok">'} />,
    )

    expect(screen.getByText("Hello")).toBeInTheDocument()
    expect(container.querySelector("script")).toBeNull()
    expect(container.querySelector("p")?.getAttribute("onclick")).toBeNull()
    expect(container.querySelector("img")?.getAttribute("onerror")).toBeNull()
  })

  it("blocks dangerous URL protocols", () => {
    const { container } = render(<SafeHtml html={'<a href="javascript:alert(1)">bad</a>'} />)

    expect(screen.getByText("bad")).toBeInTheDocument()
    expect(container.querySelector("a")?.getAttribute("href")).toBeNull()
  })
})
