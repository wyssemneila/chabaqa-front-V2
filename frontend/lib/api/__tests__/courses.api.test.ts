import { normalizeCourseListResponse, normalizeCourseResponse } from "../courses.api"

describe("courses api helpers", () => {
  it("unwraps backend create and details response envelopes", () => {
    expect(normalizeCourseResponse({ cours: { mongoId: "c1" } })).toEqual({ mongoId: "c1" })
    expect(normalizeCourseResponse({ data: { cours: { mongoId: "c2" } } })).toEqual({ mongoId: "c2" })
    expect(normalizeCourseResponse({ data: { data: { course: { mongoId: "c3" } } } })).toEqual({ mongoId: "c3" })
  })

  it("unwraps backend course list response envelopes", () => {
    expect(normalizeCourseListResponse([{ mongoId: "c1" }])).toEqual([{ mongoId: "c1" }])
    expect(normalizeCourseListResponse({ cours: [{ mongoId: "c2" }] })).toEqual([{ mongoId: "c2" }])
    expect(normalizeCourseListResponse({ data: { cours: [{ mongoId: "c3" }] } })).toEqual([{ mongoId: "c3" }])
    expect(normalizeCourseListResponse({ data: { data: { courses: [{ mongoId: "c4" }] } } })).toEqual([{ mongoId: "c4" }])
  })
})
