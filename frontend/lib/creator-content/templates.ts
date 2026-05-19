export type CreatorTemplateKind =
  | "course"
  | "challenge"
  | "product"
  | "event"
  | "session"
  | "campaign"

export interface CreatorCreateTemplate {
  slug: string
  label: string
  description: string
  href: string
  data: Record<string, any>
}

const courseTemplates: CreatorCreateTemplate[] = [
  {
    slug: "mini-course",
    label: "Mini course",
    description: "A compact course with one starter lesson.",
    href: "/creator/courses/new?template=mini-course",
    data: {
      title: "Mini Course",
      description: "A focused short course that helps members learn one practical outcome quickly.",
      duration: "45 minutes",
      learningObjectives: ["Learn one practical outcome"],
      requirements: ["No prior experience required"],
      sections: [{
        id: "section-mini-course",
        title: "Start here",
        description: "Core lessons",
        order: 1,
        chapters: [{
          id: "chapter-mini-course",
          title: "Introduction",
          content: "Use this first lesson to explain the result members will achieve.",
          videoUrl: "",
          duration: 10,
          order: 1,
          isPreview: true,
          price: "",
          notes: "",
        }],
      }],
    },
  },
  {
    slug: "workshop-replay",
    label: "Workshop replay",
    description: "A replay course with notes and next steps.",
    href: "/creator/courses/new?template=workshop-replay",
    data: {
      title: "Workshop Replay",
      description: "A recorded workshop with a practical recap, replay lesson, and follow-up action steps.",
      duration: "90 minutes",
      learningObjectives: ["Watch the workshop replay", "Apply the key takeaways"],
      requirements: ["Bring your notes or current project"],
      sections: [{
        id: "section-workshop-replay",
        title: "Replay",
        description: "Workshop recording and recap",
        order: 1,
        chapters: [{
          id: "chapter-workshop-replay",
          title: "Replay and key takeaways",
          content: "Add the replay video and summarize the most important workshop takeaways.",
          videoUrl: "",
          duration: 60,
          order: 1,
          isPreview: true,
          price: "",
          notes: "",
        }],
      }],
    },
  },
  {
    slug: "bootcamp",
    label: "Bootcamp",
    description: "A structured multi-step course starter.",
    href: "/creator/courses/new?template=bootcamp",
    data: {
      title: "Bootcamp",
      description: "A structured bootcamp that guides members through foundations, practice, and implementation.",
      duration: "4 weeks",
      learningObjectives: ["Understand the foundations", "Complete guided practice", "Ship a final result"],
      requirements: ["Commit weekly practice time"],
      sections: [{
        id: "section-bootcamp",
        title: "Week 1",
        description: "Foundations",
        order: 1,
        chapters: [{
          id: "chapter-bootcamp",
          title: "Orientation",
          content: "Introduce the bootcamp outcome, weekly rhythm, and first assignment.",
          videoUrl: "",
          duration: 15,
          order: 1,
          isPreview: true,
          price: "",
          notes: "",
        }],
      }],
    },
  },
]

const challengeTemplates: CreatorCreateTemplate[] = [
  {
    slug: "7-day-challenge",
    label: "7-day challenge",
    description: "A simple daily accountability challenge.",
    href: "/creator/challenges/new?template=7-day-challenge",
    data: {
      title: "7-Day Challenge",
      description: "A focused seven-day challenge that helps members build momentum through one daily task.",
      duration: "7 days",
      steps: [{ day: 1, title: "Day 1 action", description: "Complete the first small action.", deliverable: "Share proof of completion", points: 100, resources: [], instructions: "" }],
    },
  },
  {
    slug: "30-day-challenge",
    label: "30-day challenge",
    description: "A longer habit-building challenge.",
    href: "/creator/challenges/new?template=30-day-challenge",
    data: {
      title: "30-Day Challenge",
      description: "A thirty-day challenge designed to help members build consistency and visible progress.",
      duration: "30 days",
      steps: [{ day: 1, title: "Start the habit", description: "Complete your first habit action.", deliverable: "Post your first check-in", points: 100, resources: [], instructions: "" }],
    },
  },
  {
    slug: "accountability-sprint",
    label: "Accountability sprint",
    description: "A short sprint for shared execution.",
    href: "/creator/challenges/new?template=accountability-sprint",
    data: {
      title: "Accountability Sprint",
      description: "A short execution sprint where members pick a goal, check in, and finish together.",
      duration: "7 days",
      steps: [{ day: 1, title: "Commit to your goal", description: "Choose the outcome you will complete during the sprint.", deliverable: "Write your sprint commitment", points: 100, resources: [], instructions: "" }],
    },
  },
]

const productTemplates: CreatorCreateTemplate[] = [
  {
    slug: "digital-download",
    label: "Digital download",
    description: "A simple downloadable product.",
    href: "/creator/products/new?template=digital-download",
    data: { title: "Digital Download", description: "A downloadable resource that gives members a practical shortcut or reference.", price: 0, category: "Digital Product", type: "digital", features: ["Instant access"], requirements: ["Download after purchase"] },
  },
  {
    slug: "template-pack",
    label: "Template pack",
    description: "A bundle of reusable templates.",
    href: "/creator/products/new?template=template-pack",
    data: { title: "Template Pack", description: "A pack of reusable templates members can copy, customize, and apply immediately.", price: 0, category: "Digital Product", type: "digital", features: ["Reusable templates", "Quick-start instructions"], requirements: ["Basic editing tool access"] },
  },
  {
    slug: "resource-bundle",
    label: "Resource bundle",
    description: "A curated set of files and references.",
    href: "/creator/products/new?template=resource-bundle",
    data: { title: "Resource Bundle", description: "A curated bundle of resources, examples, and references for members working on one outcome.", price: 0, category: "Digital Product", type: "digital", features: ["Curated resources", "Organized by use case"], requirements: ["Review the included guide"] },
  },
]

const eventTemplates: CreatorCreateTemplate[] = [
  {
    slug: "online-webinar",
    label: "Online webinar",
    description: "A free online event with one ticket.",
    href: "/creator/events/new?template=online-webinar",
    data: { title: "Online Webinar", description: "A live online session where members learn a focused topic and leave with clear next steps.", type: "Online", category: "General", onlineUrl: "", tickets: [{ id: "ticket-online-webinar", type: "free", name: "Free ticket", price: "0", description: "General admission", quantity: "" }] },
  },
  {
    slug: "in-person-meetup",
    label: "In-person meetup",
    description: "A local community meetup starter.",
    href: "/creator/events/new?template=in-person-meetup",
    data: { title: "In-Person Meetup", description: "A local community gathering for members to connect, share progress, and build relationships.", type: "In-person", category: "General", location: "", tickets: [{ id: "ticket-in-person-meetup", type: "free", name: "Free ticket", price: "0", description: "General admission", quantity: "" }] },
  },
  {
    slug: "paid-workshop",
    label: "Paid workshop",
    description: "A paid live workshop with one ticket.",
    href: "/creator/events/new?template=paid-workshop",
    data: { title: "Paid Workshop", description: "A practical live workshop where members learn, practice, and leave with a concrete result.", type: "Online", category: "Workshop", onlineUrl: "", tickets: [{ id: "ticket-paid-workshop", type: "regular", name: "Workshop ticket", price: "49", description: "Workshop access", quantity: "" }] },
  },
]

const sessionTemplates: CreatorCreateTemplate[] = [
  {
    slug: "one-to-one-call",
    label: "1:1 call",
    description: "A general discovery or help call.",
    href: "/creator/sessions/new?template=one-to-one-call",
    data: { title: "1:1 Call", description: "A focused one-on-one call where members can ask questions and get direct guidance.", duration: "60", price: "0", sessionFormat: "Video Call (Google Meet)" },
  },
  {
    slug: "portfolio-review",
    label: "Portfolio review",
    description: "Review work and give feedback.",
    href: "/creator/sessions/new?template=portfolio-review",
    data: { title: "Portfolio Review", description: "A practical review session with clear feedback, priorities, and next steps.", duration: "60", price: "0", sessionFormat: "Screen Sharing Session", whatYoullGet: ["Actionable feedback", "Priority improvements"] },
  },
  {
    slug: "coaching-session",
    label: "Coaching session",
    description: "A paid coaching offer starter.",
    href: "/creator/sessions/new?template=coaching-session",
    data: { title: "Coaching Session", description: "A personalized coaching session focused on one goal, blocker, or decision.", duration: "60", price: "100", sessionFormat: "Video Call (Zoom)", whatYoullGet: ["Personalized guidance", "Next-step plan"] },
  },
]

const campaignTemplates: CreatorCreateTemplate[] = [
  {
    slug: "announcement",
    label: "Announcement",
    description: "Send a simple update to your members.",
    href: "/creator/marketing/emails?create=1&template=announcement",
    data: { kind: "announcement", subject: "New update from {{communityName}}", content: "Hi {{userName}},\n\nWe have a new update for the community.\n\nOpen Chabaqa to see what is new.", isHtml: false, trackOpens: true, trackClicks: true },
  },
  {
    slug: "launch-reminder",
    label: "Launch reminder",
    description: "Remind members about a new launch.",
    href: "/creator/marketing/emails?create=1&template=launch-reminder",
    data: { kind: "content-reminder", subject: "Reminder: new {{contentTypeLabel}} in {{communityName}}", content: "Hi {{userName}},\n\nQuick reminder that a new {{contentTypeLabel}} is available for you.\n\nTake a look when you are ready.", contentType: "all", isHtml: false, trackOpens: true, trackClicks: true },
  },
  {
    slug: "reactivation",
    label: "Reactivation",
    description: "Win back inactive members.",
    href: "/creator/marketing/emails?create=1&template=reactivation",
    data: { kind: "inactive-users", subject: "We saved your spot in {{communityName}}", content: "Hi {{userName}},\n\nIt has been a while since your last visit. The community has fresh updates waiting for you.\n\nCome back today and continue your progress.", inactivityPeriod: "last_30_days", isHtml: false, trackOpens: true, trackClicks: true },
  },
]

export const CREATOR_CREATE_TEMPLATES: Record<CreatorTemplateKind, CreatorCreateTemplate[]> = {
  course: courseTemplates,
  challenge: challengeTemplates,
  product: productTemplates,
  event: eventTemplates,
  session: sessionTemplates,
  campaign: campaignTemplates,
}

export const getCreatorCreateTemplate = (kind: CreatorTemplateKind, slug?: string | null) => {
  if (!slug) return undefined
  return CREATOR_CREATE_TEMPLATES[kind].find((template) => template.slug === slug)
}

export const getDefaultCreatorCreateTemplate = (kind: CreatorTemplateKind) => CREATOR_CREATE_TEMPLATES[kind][0]
