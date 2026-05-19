import { CREATOR_CREATE_TEMPLATES, getCreatorCreateTemplate, type CreatorTemplateKind } from "../templates"

const expectedCounts: Record<CreatorTemplateKind, number> = {
  course: 3,
  challenge: 3,
  product: 3,
  event: 3,
  session: 3,
  campaign: 3,
}

describe("creator content templates", () => {
  it("defines the phase 6 template set with direct create links", () => {
    for (const [kind, templates] of Object.entries(CREATOR_CREATE_TEMPLATES) as Array<[CreatorTemplateKind, typeof CREATOR_CREATE_TEMPLATES[CreatorTemplateKind]]>) {
      expect(templates).toHaveLength(expectedCounts[kind])
      templates.forEach((template) => {
        expect(template.slug).toBeTruthy()
        expect(template.label).toBeTruthy()
        expect(template.description).toBeTruthy()
        expect(template.href).toContain(`template=${template.slug}`)
        expect(getCreatorCreateTemplate(kind, template.slug)).toBe(template)
      })
    }
  })

  it("prefills the minimum draft fields for one-pass starts", () => {
    expect(getCreatorCreateTemplate("course", "mini-course")?.data).toEqual(expect.objectContaining({
      title: expect.any(String),
      description: expect.any(String),
      sections: expect.any(Array),
    }))
    expect(getCreatorCreateTemplate("challenge", "7-day-challenge")?.data).toEqual(expect.objectContaining({
      title: expect.any(String),
      description: expect.any(String),
      steps: expect.any(Array),
    }))
    expect(getCreatorCreateTemplate("product", "digital-download")?.data).toEqual(expect.objectContaining({
      title: expect.any(String),
      description: expect.any(String),
      price: expect.any(Number),
    }))
    expect(getCreatorCreateTemplate("event", "online-webinar")?.data).toEqual(expect.objectContaining({
      title: expect.any(String),
      description: expect.any(String),
      tickets: expect.any(Array),
    }))
    expect(getCreatorCreateTemplate("session", "one-to-one-call")?.data).toEqual(expect.objectContaining({
      title: expect.any(String),
      description: expect.any(String),
      duration: expect.any(String),
      price: expect.any(String),
    }))
    expect(getCreatorCreateTemplate("campaign", "announcement")?.data).toEqual(expect.objectContaining({
      kind: "announcement",
      subject: expect.any(String),
      content: expect.any(String),
    }))
  })
})
