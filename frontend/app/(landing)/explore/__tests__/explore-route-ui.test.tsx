import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import Loading from "@/app/(landing)/explore/loading"
import ExploreError from "@/app/(landing)/explore/error"

describe("Explore route UI states", () => {
  test("loading renders non-empty skeleton content", () => {
    const { container } = render(<Loading />)
    expect(container.firstChild).not.toBeNull()
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0)
  })

  test("error renders retry and calls reset", () => {
    const reset = jest.fn()
    render(<ExploreError error={new Error("boom")} reset={reset} />)

    expect(screen.getByText("Unable to load Explore")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Retry" }))
    expect(reset).toHaveBeenCalledTimes(1)
  })
})
