import { getUserProfileHandle, getUserProfileHref } from "@/lib/profile-handle"

describe("profile handle helpers", () => {
  it("keeps valid usernames unchanged", () => {
    expect(getUserProfileHandle({ username: "john_doe-1" })).toBe("john_doe-1")
  })

  it("normalizes malformed usernames with spaces", () => {
    expect(getUserProfileHandle({ username: "Ahmed Hatem" })).toBe("ahmed-hatem")
  })

  it("builds profile href from normalized handle", () => {
    expect(getUserProfileHref({ username: "Ahmed Hatem" })).toBe("/profile/ahmed-hatem")
  })

  it("extracts a clean handle when username payload is serialized metadata", () => {
    const noisyUsername =
      "id-new-objectid-69a053ef1e6640ff7d9eb673-name-mohamed-ismail-email-mohamedisamil-gmail-com-photo-profil-https-api-chabaqa-io-uploads-image"
    expect(getUserProfileHandle({ username: noisyUsername, name: "Mohamed Ismail" })).toBe("mohamed-ismail")
  })
})
