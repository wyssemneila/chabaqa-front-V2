import {
  buildCampaignCreatePayload,
  buildChallengeCreatePayload,
  buildCommunityCreatePayload,
  buildCourseCreatePayload,
  buildEventCreatePayload,
  buildPostCreatePayload,
  buildProductCreatePayload,
  buildSessionCreatePayload,
  creatorContentMinimalPayloads,
  creatorContentMinimalValues,
  validateCampaignDraft,
  validateCampaignPublish,
  validateChallengeDraft,
  validateChallengePublish,
  validateCommunityDraft,
  validateCourseDraft,
  validateCoursePublish,
  validateEventDraft,
  validateEventPublish,
  validatePostDraft,
  validatePostPublish,
  validateProductDraft,
  validateProductPublish,
  validateSessionDraft,
} from "../index"

describe("creator content create models", () => {
  it("builds backend-compatible minimal draft payloads for every content type", () => {
    expect(creatorContentMinimalPayloads.course.titre).toBe("Intro Course")
    expect(creatorContentMinimalPayloads.course.sections[0].chapitres[0].titre).toBe("Introduction")
    expect(creatorContentMinimalPayloads.challenge.tasks[0].day).toBe(1)
    expect(creatorContentMinimalPayloads.product.category).toBe("Digital Product")
    expect(creatorContentMinimalPayloads.event.tickets[0].name).toBe("Free ticket")
    expect(creatorContentMinimalPayloads.session.resources).toEqual([])
    expect(creatorContentMinimalPayloads.post.content).toBe("Welcome to the community.")
    expect(creatorContentMinimalPayloads.campaign.request).toBe("createCampaign")
    expect(creatorContentMinimalPayloads.community.feeAmount).toBe("0")
  })

  it("accepts valid minimal drafts", () => {
    expect(validateCourseDraft(creatorContentMinimalValues.course).ok).toBe(true)
    expect(validateChallengeDraft(creatorContentMinimalValues.challenge).ok).toBe(true)
    expect(validateProductDraft(creatorContentMinimalValues.product).ok).toBe(true)
    expect(validateEventDraft(creatorContentMinimalValues.event).ok).toBe(true)
    expect(validateSessionDraft(creatorContentMinimalValues.session).ok).toBe(true)
    expect(validatePostDraft(creatorContentMinimalValues.post).ok).toBe(true)
    expect(validateCampaignDraft(creatorContentMinimalValues.campaign).ok).toBe(true)
    expect(validateCommunityDraft(creatorContentMinimalValues.community).ok).toBe(true)
  })

  it("keeps publish checks stricter than draft checks", () => {
    expect(validateCoursePublish(creatorContentMinimalValues.course).publishBlockers).toContain("Add lesson content or a video before publishing.")
    expect(validateChallengePublish(creatorContentMinimalValues.challenge).publishBlockers).toContain("Task 1 needs a description of at least 10 characters.")
    expect(validateProductPublish({ ...creatorContentMinimalValues.product, price: 25 }).publishBlockers).toContain(
      "Paid digital products need at least one delivery file before publishing.",
    )
    expect(validateEventPublish({ ...creatorContentMinimalValues.event, onlineUrl: "" }).publishBlockers).toContain(
      "Add a valid online event link before publishing.",
    )
    expect(validatePostPublish({ ...creatorContentMinimalValues.post, links: [{ url: "not-a-url" }] }).publishBlockers).toContain(
      "Link 1 must be a valid URL.",
    )
    expect(
      validateCampaignPublish(
        { ...creatorContentMinimalValues.campaign, sendingTime: "scheduled", scheduledDate: "2026-01-01", scheduledTime: "10:00" },
        new Date("2026-05-12T12:00:00.000Z"),
      ).publishBlockers,
    ).toContain("Scheduled time must be in the future.")
  })

  it("maps course UI fields to the current French backend contract", () => {
    const payload = buildCourseCreatePayload({
      ...creatorContentMinimalValues.course,
      price: 99,
      level: "Intermediate",
      sections: [
        {
          title: "Basics",
          chapters: [{ title: "Variables", content: "Learn variables", isPreview: false }],
        },
      ],
    })

    expect(payload).toMatchObject({
      titre: "Intro Course",
      prix: 99,
      isPaid: true,
      devise: "TND",
      communitySlug: "motion-school",
      niveau: "intermédiaire",
    })
    expect(payload.sections[0]).toMatchObject({ titre: "Basics", ordre: 1 })
    expect(payload.sections[0].chapitres[0]).toMatchObject({
      titre: "Variables",
      description: "Learn variables",
      isPaid: true,
      prix: 99,
      ordre: 1,
    })
  })

  it("keeps non-preview chapters free when the course price is free", () => {
    const payload = buildCourseCreatePayload({
      ...creatorContentMinimalValues.course,
      price: 0,
      sections: [
        {
          title: "Basics",
          chapters: [
            { title: "Intro", content: "Welcome", isPreview: true },
            { title: "Second lesson", content: "Keep learning", isPreview: false },
          ],
        },
      ],
    })

    expect(payload).toMatchObject({
      prix: 0,
      isPaid: false,
    })
    expect(payload.sections[0].chapitres[1]).toMatchObject({
      titre: "Second lesson",
      isPaid: false,
      prix: 0,
    })
  })

  it("builds payloads from explicit values without mutating validation behavior", () => {
    expect(buildChallengeCreatePayload(creatorContentMinimalValues.challenge).communitySlug).toBe("motion-school")
    expect(buildProductCreatePayload(creatorContentMinimalValues.product).communityId).toBe("community-id")
    expect(buildEventCreatePayload(creatorContentMinimalValues.event).type).toBe("Online")
    expect(buildSessionCreatePayload(creatorContentMinimalValues.session).duration).toBe(60)
    expect(buildPostCreatePayload(creatorContentMinimalValues.post).communityId).toBe("community-id")
    expect(buildCampaignCreatePayload({ ...creatorContentMinimalValues.campaign, type: "content-reminder" }).data).toMatchObject({
      contentType: "all",
    })
    expect(buildCommunityCreatePayload(creatorContentMinimalValues.community).socialLinks.website).toBe("https://example.com")
  })
})
