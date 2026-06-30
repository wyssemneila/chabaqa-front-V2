import { normalizeEventListResponse, normalizeEventResponse } from "../events.api"

describe("events api helpers", () => {
  it("unwraps backend create and details response envelopes", () => {
    expect(normalizeEventResponse({ event: { mongoId: "e1" } })).toEqual({ mongoId: "e1" })
    expect(normalizeEventResponse({ data: { event: { mongoId: "e2" } } })).toEqual({ mongoId: "e2" })
    expect(normalizeEventResponse({ data: { data: { event: { mongoId: "e3" } } } })).toEqual({ mongoId: "e3" })
  })

  it("unwraps backend event list response envelopes", () => {
    expect(normalizeEventListResponse([{ mongoId: "e1" }])).toEqual([{ mongoId: "e1" }])
    expect(normalizeEventListResponse({ events: [{ mongoId: "e2" }] })).toEqual([{ mongoId: "e2" }])
    expect(normalizeEventListResponse({ data: { events: [{ mongoId: "e3" }] } })).toEqual([{ mongoId: "e3" }])
    expect(normalizeEventListResponse({ data: { data: { events: [{ mongoId: "e4" }] } } })).toEqual([{ mongoId: "e4" }])
  })
})
