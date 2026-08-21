import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import { fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AffiliateLinkBuilder } from "../components/affiliate-link-builder"
import { PayoutRequestForm } from "../components/payout-request-form"

const mockToast = jest.fn()

jest.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}))

describe("Affiliate components", () => {
  const writeText = jest.fn().mockResolvedValue(undefined)

  beforeEach(() => {
    jest.clearAllMocks()
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    })
    Object.defineProperty(window.navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    })
  })

  it("link builder selection sets correct target", async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    render(
      <AffiliateLinkBuilder
        partners={[{ id: "p-1", label: "Partner One" }]}
        targetsByType={{
          community: [{ id: "c-1", label: "Community A", path: "/en/community/a" }],
          course: [{ id: "course-7", label: "Course Seven", path: "/en/creator/courses/course-7" }],
          product: [],
          event: [],
          challenge: [],
          session: [],
        }}
        baseUrl="https://chabaqa.io"
        onSubmit={onSubmit}
      />,
    )

    await user.click(screen.getByRole("combobox", { name: /target type/i }))
    await user.click(screen.getByText("Course"))

    await user.click(screen.getByRole("button", { name: /target item/i }))
    await user.click(screen.getByText("Course Seven"))

    await user.click(screen.getByRole("button", { name: /generate link/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          targetType: "course",
          targetId: "course-7",
          targetPath: "/en/creator/courses/course-7",
        }),
      )
    })
  })

  it("copy button writes correct URL", async () => {
    const user = userEvent.setup()
    const onSubmit = jest.fn().mockResolvedValue(undefined)
    const copyToClipboard = jest.fn().mockResolvedValue(undefined)

    render(
      <AffiliateLinkBuilder
        partners={[]}
        targetsByType={{
          community: [{ id: "c-1", label: "Community A", path: "/en/community/a" }],
          course: [],
          product: [],
          event: [],
          challenge: [],
          session: [],
        }}
        baseUrl="https://chabaqa.io"
        onSubmit={onSubmit}
        createdCode="ABCD1234"
        copyToClipboard={copyToClipboard}
      />,
    )

    expect(screen.getByText("https://chabaqa.io/r/ABCD1234")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /copy affiliate link/i }))

    await waitFor(() => {
      expect(copyToClipboard).toHaveBeenCalledWith("https://chabaqa.io/r/ABCD1234")
    })
  })

  it("payout request form validates min and max", async () => {
    const user = userEvent.setup()
    const onSubmit = jest.fn().mockResolvedValue(undefined)

    render(
      <PayoutRequestForm
        minAmount={50}
        maxAmount={100}
        onSubmit={onSubmit}
      />,
    )

    const amountInput = screen.getByLabelText(/amount \(dt\)/i)
    const submitButton = screen.getByRole("button", { name: /submit request/i })

    await user.type(amountInput, "20")
    expect(screen.getByText(/minimum payout is 50 dt/i)).toBeInTheDocument()
    expect(submitButton).toBeDisabled()

    await user.clear(amountInput)
    await user.type(amountInput, "150")
    expect(screen.getByText(/cannot exceed approved balance/i)).toBeInTheDocument()
    expect(submitButton).toBeDisabled()

    await user.clear(amountInput)
    await user.type(amountInput, "80")
    expect(screen.queryByText(/minimum payout/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/cannot exceed approved balance/i)).not.toBeInTheDocument()

    await user.click(submitButton)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ amountDT: 80 }),
      )
    })
  })
})
