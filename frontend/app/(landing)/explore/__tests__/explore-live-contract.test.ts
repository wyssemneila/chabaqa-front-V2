describe("Explore live response contract", () => {
  it("reads the documented challenge and session list envelopes", () => {
    const source = require("fs").readFileSync(
      require("path").join(process.cwd(), "app", "(landing)", "explore", "page.tsx"),
      "utf8",
    )

    expect(source).toContain('extractList(challengesRes.value, "challenges")')
    expect(source).toContain('extractList(sessionsRes.value, "sessions")')
    expect(source).not.toContain("response?.data?.data?.courses")
  })
})