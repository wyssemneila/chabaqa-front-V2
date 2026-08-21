import {
  buildCourseCreatePayload,
  getInitialCourseValues,
} from "./course-create-model"
import {
  buildChallengeCreatePayload,
  getInitialChallengeValues,
} from "./challenge-create-model"
import {
  buildProductCreatePayload,
  getInitialProductValues,
} from "./product-create-model"
import {
  buildEventCreatePayload,
  getInitialEventValues,
} from "./event-create-model"
import {
  buildSessionCreatePayload,
  getInitialSessionValues,
} from "./session-create-model"
import {
  buildPostCreatePayload,
  getInitialPostValues,
} from "./post-create-model"
import {
  buildCampaignCreatePayload,
  getInitialCampaignValues,
} from "./campaign-create-model"
import {
  buildCommunityCreatePayload,
  getInitialCommunityValues,
} from "./community-create-model"

const community = { id: "community-id", _id: "community-id", slug: "motion-school", name: "Motion School" }
const fixedNow = new Date("2026-05-12T12:00:00.000Z")

export const creatorContentMinimalValues = {
  course: { ...getInitialCourseValues(community), title: "Intro Course", description: "A practical starter course." },
  challenge: { ...getInitialChallengeValues(community, fixedNow), title: "7 Day Sprint", description: "Build one useful habit in seven days." },
  product: { ...getInitialProductValues(community), title: "Template Pack", description: "A useful template pack.", price: 0 },
  event: { ...getInitialEventValues(community, fixedNow), title: "Live Workshop", description: "A focused online workshop.", onlineUrl: "https://example.com/live" },
  session: { ...getInitialSessionValues(community), title: "Coaching Call", description: "A focused one-to-one coaching call." },
  post: { ...getInitialPostValues(community), content: "Welcome to the community." },
  campaign: { ...getInitialCampaignValues(community), subject: "Welcome", content: "Hello {{userName}}, welcome." },
  community: { ...getInitialCommunityValues(), name: "Motion School", country: "Tunisia", socialLinks: { website: "https://example.com" } },
}

export const creatorContentMinimalPayloads = {
  course: buildCourseCreatePayload(creatorContentMinimalValues.course),
  challenge: buildChallengeCreatePayload(creatorContentMinimalValues.challenge),
  product: buildProductCreatePayload(creatorContentMinimalValues.product),
  event: buildEventCreatePayload(creatorContentMinimalValues.event),
  session: buildSessionCreatePayload(creatorContentMinimalValues.session),
  post: buildPostCreatePayload(creatorContentMinimalValues.post),
  campaign: buildCampaignCreatePayload(creatorContentMinimalValues.campaign),
  community: buildCommunityCreatePayload(creatorContentMinimalValues.community),
}
