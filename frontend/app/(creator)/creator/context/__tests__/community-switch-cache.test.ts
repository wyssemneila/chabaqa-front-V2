import {
  __resetCommunitySwitchCacheForTests,
  getCached,
  getOrLoad,
  setCached,
} from "@/app/(creator)/creator/context/community-switch-cache"

describe("community-switch-cache", () => {
  afterEach(() => {
    __resetCommunitySwitchCacheForTests()
    jest.restoreAllMocks()
  })

  test("returns cached value before TTL expiry", () => {
    const payload = { courses: [], challenges: [], sessions: [], posts: [], overview: { ok: true } }
    setCached("dashboardCore", "community-a", payload)

    const cached = getCached("dashboardCore", "community-a")
    expect(cached).toEqual(payload)
  })

  test("expires entries after TTL and reloads", async () => {
    const baseTime = 1_700_000_000_000
    const dateSpy = jest.spyOn(Date, "now")
    dateSpy.mockReturnValue(baseTime)

    setCached("dashboardCore", "community-b", {
      courses: [{ id: "old" }],
      challenges: [],
      sessions: [],
      posts: [],
      overview: null,
    })

    dateSpy.mockReturnValue(baseTime + 30_001)
    expect(getCached("dashboardCore", "community-b")).toBeNull()

    const loader = jest.fn().mockResolvedValue({
      courses: [{ id: "new" }],
      challenges: [],
      sessions: [],
      posts: [],
      overview: { refreshed: true },
    })

    const reloaded = await getOrLoad("dashboardCore", "community-b", loader)
    expect(loader).toHaveBeenCalledTimes(1)
    expect(reloaded.courses[0].id).toBe("new")
  })

  test("dedupes concurrent in-flight loads", async () => {
    let callCount = 0
    const loader = jest.fn(async () => {
      callCount += 1
      await new Promise((resolve) => setTimeout(resolve, 25))
      return {
        courses: [{ id: "same-result" }],
        challenges: [],
        sessions: [],
        posts: [],
        overview: null,
      }
    })

    const [first, second] = await Promise.all([
      getOrLoad("dashboardCore", "community-c", loader),
      getOrLoad("dashboardCore", "community-c", loader),
    ])

    expect(callCount).toBe(1)
    expect(first).toEqual(second)
  })

  test("evicts oldest entry when max community size is exceeded", () => {
    for (let i = 1; i <= 7; i += 1) {
      setCached("sessions", `community-${i}`, {
        sessions: [{ id: `s-${i}` }],
        bookings: [],
        revenue: i,
      })
    }

    expect(getCached("sessions", "community-1")).toBeNull()
    expect(getCached("sessions", "community-7")).toEqual({
      sessions: [{ id: "s-7" }],
      bookings: [],
      revenue: 7,
    })
  })
})
