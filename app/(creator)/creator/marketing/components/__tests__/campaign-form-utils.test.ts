import { buildCampaignPayload, resolveScheduledAt } from "../campaign-form-utils"

describe("campaign-form-utils", () => {
  it("builds inactive-user payload with required inactivity period", () => {
    const payload = buildCampaignPayload(
      {
        title: "Winback",
        type: "inactive-users",
        subject: "Hello",
        content: "Body",
        sendingTime: "now",
        inactivityPeriod: "last_15_days",
      },
      "community-1",
    )

    expect(payload.request).toBe("createInactiveUserCampaign")
    expect((payload as any).data.inactivityPeriod).toBe("last_15_days")
  })

  it("throws if scheduled time is in the past", () => {
    const past = new Date(Date.now() - 60_000)
    const date = past.toISOString().slice(0, 10)
    const time = past.toISOString().slice(11, 16)

    expect(() =>
      resolveScheduledAt({
        title: "x",
        type: "announcement",
        subject: "x",
        content: "x",
        sendingTime: "scheduled",
        scheduledDate: date,
        scheduledTime: time,
      }),
    ).toThrow("Scheduled time must be in the future")
  })
})
