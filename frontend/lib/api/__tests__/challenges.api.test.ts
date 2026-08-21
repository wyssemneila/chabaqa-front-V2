import { normalizeChallengeListResponse, normalizeChallengeResponse } from "../challenges.api"

describe("challenges api helpers", () => {
  it("unwraps backend create and details response envelopes", () => {
    expect(normalizeChallengeResponse({ challenge: { mongoId: "ch1" } })).toEqual({ mongoId: "ch1" })
    expect(normalizeChallengeResponse({ data: { challenge: { mongoId: "ch2" } } })).toEqual({ mongoId: "ch2" })
    expect(normalizeChallengeResponse({ data: { data: { challenge: { mongoId: "ch3" } } } })).toEqual({ mongoId: "ch3" })
  })

  it("unwraps backend challenge list response envelopes", () => {
    expect(normalizeChallengeListResponse([{ mongoId: "ch1" }])).toEqual([{ mongoId: "ch1" }])
    expect(normalizeChallengeListResponse({ challenges: [{ mongoId: "ch2" }] })).toEqual([{ mongoId: "ch2" }])
    expect(normalizeChallengeListResponse({ data: { challenges: [{ mongoId: "ch3" }] } })).toEqual([{ mongoId: "ch3" }])
    expect(normalizeChallengeListResponse({ data: { data: { challenges: [{ mongoId: "ch4" }] } } })).toEqual([{ mongoId: "ch4" }])
  })
})
