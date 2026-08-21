describe("public profile contract", () => {
  it("uses only the canonical public username endpoint", () => {
    const source = require("fs").readFileSync(
      require("path").join(process.cwd(), "app", "(landing)", "profile", "[slug]", "page.tsx"),
      "utf8",
    )

    expect(source).toContain("/user/by-username/")
    expect(source).not.toContain("/user/user/")
    expect(source).not.toContain("email?: string")
  })
})