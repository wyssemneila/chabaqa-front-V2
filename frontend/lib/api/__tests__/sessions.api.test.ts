import { normalizeSessionListResponse, normalizeSessionResponse } from "../sessions.api"

describe("sessions api helpers", () => {
  it("unwraps backend create and details response envelopes", () => {
    expect(normalizeSessionResponse({ session: { mongoId: "s1" } })).toEqual({ mongoId: "s1" })
    expect(normalizeSessionResponse({ data: { session: { mongoId: "s2" } } })).toEqual({ mongoId: "s2" })
    expect(normalizeSessionResponse({ data: { data: { session: { mongoId: "s3" } } } })).toEqual({ mongoId: "s3" })
  })

  it("unwraps backend session list response envelopes", () => {
    expect(normalizeSessionListResponse([{ mongoId: "s1" }])).toEqual([{ mongoId: "s1" }])
    expect(normalizeSessionListResponse({ sessions: [{ mongoId: "s2" }] })).toEqual([{ mongoId: "s2" }])
    expect(normalizeSessionListResponse({ data: { sessions: [{ mongoId: "s3" }] } })).toEqual([{ mongoId: "s3" }])
    expect(normalizeSessionListResponse({ data: { data: { sessions: [{ mongoId: "s4" }] } } })).toEqual([{ mongoId: "s4" }])
  })
})
