#!/usr/bin/env node

const path = require('path');
const crypto = require('crypto');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
require('dotenv').config({ path: path.join(__dirname, '../.env.local-db'), override: true, quiet: true });

const SEED_KEY = 'rich-demo-v1';
const PASSWORD = 'Demo123456!';
const VIDEO_URL = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';
const YOUTUBE_VIDEO_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
const YOUTUBE_THUMBNAIL_URL = 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg';
const DOC_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
const MEDIA_LIBRARY = {
  imageHost: 'images.unsplash.com',
  courseVideo: VIDEO_URL,
  embedVideo: YOUTUBE_VIDEO_URL,
  videoThumbnail: YOUTUBE_THUMBNAIL_URL,
  pdf: DOC_URL,
};
const THEME_COLORS = [
  ['#155e75', '#cffafe'],
  ['#7c2d12', '#ffedd5'],
  ['#166534', '#dcfce7'],
  ['#6d28d9', '#ede9fe'],
  ['#be123c', '#ffe4e6'],
];
const ADMIN_BLUEPRINTS = [
  {
    name: 'Chabaqa Demo Admin',
    email: 'admin.demo@chabaqa.demo',
    username: 'demo-admin',
    ville: 'Tunis',
    poste: 'Platform Operations Lead',
    departement: 'Admin',
  },
];

function resolveDbName(uri) {
  if (process.env.DB_NAME) return process.env.DB_NAME;
  try {
    const url = new URL(uri);
    const dbName = (url.pathname || '').replace(/^\/+/, '').split('/')[0];
    return dbName || 'chabaqa_local';
  } catch {
    return 'chabaqa_local';
  }
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function oid(seed) {
  return new ObjectId(
    crypto.createHash('md5').update(`${SEED_KEY}:${seed}`).digest('hex').slice(0, 24),
  );
}

function metricSeed(...parts) {
  return parseInt(
    crypto.createHash('sha1').update(parts.map((part) => String(part)).join(':')).digest('hex').slice(0, 8),
    16,
  );
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function pick(values, index) {
  return values[index % values.length];
}

function asset(kind, slug, index = 0) {
  return `https://images.unsplash.com/photo-${[
    '1497366754035-f200968a6e72',
    '1516321318423-f06f85e504b3',
    '1552664730-d307ca884978',
    '1522202176988-66273c2fd55f',
    '1517245386807-bb43f82c33c4',
    '1500530855697-b586d89ba3ee',
    '1556761175-b413da4baf72',
    '1557804506-669a67965ba0',
    '1498050108023-c5249f4df085',
    '1519389950473-47ba0277781c',
  ][index % 10]}?auto=format&fit=crop&w=1400&q=80&seed=${encodeURIComponent(`${kind}-${slug}`)}`;
}

function phoneNumber(seed) {
  const suffix = String(1000000 + (metricSeed(seed, 'phone') % 8999999)).padStart(7, '0');
  return `+216 2${suffix}`;
}

function genderForUsername(username) {
  const femaleUsernames = new Set([
    'amina-trabelsi',
    'meriem-ben-salah',
    'hela-cherif',
    'sarra-kefi',
    'nour-dridi',
    'lina-gharbi',
    'ines-saidi',
    'rania-belaid',
    'salma-mahfoudh',
    'aya-mbarek',
    'dorsaf-nasri',
  ]);
  return femaleUsernames.has(username) ? 'female' : 'male';
}

function futureDate(days, hour = 10) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
}

function pastDate(days, hour = 10) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
}

function dayStamp(daysAgo, hour = 0) {
  const date = pastDate(daysAgo, hour);
  date.setUTCHours(hour, 0, 0, 0);
  return date;
}

function priceConfig(price, currency = 'TND', priceType = 'one-time', features = []) {
  return {
    price,
    currency,
    priceType,
    isRecurring: priceType === 'monthly' || priceType === 'yearly',
    recurringInterval: priceType === 'monthly' ? 'month' : priceType === 'yearly' ? 'year' : undefined,
    features,
    paymentOptions: {
      allowInstallments: price > 100,
      installmentCount: price > 100 ? 3 : undefined,
      earlyBirdDiscount: price > 0 ? 10 : undefined,
      groupDiscount: price > 0 ? 15 : undefined,
      memberDiscount: price > 0 ? 8 : undefined,
    },
    freeTrialDays: priceType === 'monthly' ? 7 : 0,
    trialFeatures: priceType === 'monthly' ? ['First workshop replay', 'Community preview'] : [],
  };
}

const userBlueprints = [
  ['Amina Trabelsi', 'amina-trabelsi', 'amina.creator@chabaqa.demo', 'creator', 'Tunis', 'Product educator helping creators package practical skills.'],
  ['Youssef Haddad', 'youssef-haddad', 'youssef.creator@chabaqa.demo', 'creator', 'Sousse', 'Motion designer and challenge host for visual creators.'],
  ['Meriem Ben Salah', 'meriem-ben-salah', 'meriem.creator@chabaqa.demo', 'creator', 'Ariana', 'Data and operations mentor for small teams.'],
  ['Hela Cherif', 'hela-cherif', 'hela.creator@chabaqa.demo', 'creator', 'Mahdia', 'Wellness coach designing habit systems, live circles, and calm accountability rituals.'],
  ['Tarek Mokrani', 'tarek-mokrani', 'tarek.creator@chabaqa.demo', 'creator', 'Tunis', 'Automation consultant helping operators build lean AI-assisted workflows.'],
  ['Sarra Kefi', 'sarra-kefi', 'sarra.member@chabaqa.demo', 'user', 'Tunis', 'Marketing specialist learning community building.'],
  ['Omar Jaziri', 'omar-jaziri', 'omar.member@chabaqa.demo', 'user', 'Sfax', 'Frontend developer building portfolio projects.'],
  ['Nour Dridi', 'nour-dridi', 'nour.member@chabaqa.demo', 'user', 'Nabeul', 'Designer interested in productized services.'],
  ['Karim Mansour', 'karim-mansour', 'karim.member@chabaqa.demo', 'user', 'Monastir', 'Founder testing paid education offers.'],
  ['Lina Gharbi', 'lina-gharbi', 'lina.member@chabaqa.demo', 'user', 'Tunis', 'Student practicing analytics and content systems.'],
  ['Fares Mejri', 'fares-mejri', 'fares.member@chabaqa.demo', 'user', 'Bizerte', 'No-code builder testing product launch workflows.'],
  ['Ines Saidi', 'ines-saidi', 'ines.member@chabaqa.demo', 'user', 'Tunis', 'Growth marketer practicing daily shipping habits.'],
  ['Mehdi Ayari', 'mehdi-ayari', 'mehdi.member@chabaqa.demo', 'user', 'Sousse', 'Junior developer building public portfolio projects.'],
  ['Rania Belaid', 'rania-belaid', 'rania.member@chabaqa.demo', 'user', 'Ariana', 'Operations analyst learning dashboard storytelling.'],
  ['Hatem Ouertani', 'hatem-ouertani', 'hatem.member@chabaqa.demo', 'user', 'Gabes', 'SMB owner testing offers, sessions, and repeat purchase flows.'],
  ['Salma Mahfoudh', 'salma-mahfoudh', 'salma.member@chabaqa.demo', 'user', 'Kairouan', 'Teacher building a blended cohort with events and homework checkpoints.'],
  ['Malek Chatti', 'malek-chatti', 'malek.member@chabaqa.demo', 'user', 'Djerba', 'Freelance editor comparing video resources and product bundles.'],
  ['Aya Mbarek', 'aya-mbarek', 'aya.member@chabaqa.demo', 'user', 'Tunis', 'Community manager testing comments, bookmarks, and moderation signals.'],
  ['Sami Ben Ali', 'sami-ben-ali', 'sami.member@chabaqa.demo', 'user', 'Sfax', 'Revenue analyst checking paid orders and creator dashboards.'],
  ['Dorsaf Nasri', 'dorsaf-nasri', 'dorsaf.member@chabaqa.demo', 'user', 'Nabeul', 'Mobile-first learner validating video playback, PDFs, and course progress.'],
];

const communityBlueprints = [
  {
    name: 'Creator Launch Studio',
    category: 'Business',
    creator: 'amina-trabelsi',
    priceType: 'monthly',
    price: 39,
    tags: ['Creator Economy', 'Launches', 'Offers', 'Community'],
    description: 'A polished workspace for creators turning expertise into courses, cohorts, events, and digital products.',
    audience: 'Coaches, consultants, and educators who already have expertise but need a structured offer and repeatable sales rhythm.',
    outcomes: ['Define a profitable member promise', 'Publish a paid offer page', 'Run a warm launch', 'Retain members with rituals'],
    cadence: 'Weekly live lab, async critique thread, and monthly launch teardown.',
    faqs: [
      ['Do I need a big audience?', 'No. The seed includes validation and small-list launch workflows.'],
      ['Can I sell products too?', 'Yes. Courses, toolkits, events, sessions, and posts are all seeded for this community.'],
    ],
  },
  {
    name: 'Motion School Lab',
    category: 'Creative Arts',
    creator: 'youssef-haddad',
    priceType: 'one-time',
    price: 97,
    tags: ['Motion Design', 'After Effects', 'Animation', 'Portfolio'],
    description: 'Hands-on motion design practice with courses, critiques, challenges, and reusable production templates.',
    audience: 'Designers and video creators who want portfolio pieces, critique loops, and a clean project delivery workflow.',
    outcomes: ['Build polished loops', 'Export social-ready motion assets', 'Package a case study', 'Collect peer critique'],
    cadence: 'Two critique windows each week plus a monthly portfolio sprint.',
    faqs: [
      ['Is this beginner friendly?', 'The starter course covers timing foundations, then the challenge raises the pace.'],
      ['Are videos included?', 'Yes. Direct MP4 resources and a YouTube embed are seeded for playback testing.'],
    ],
  },
  {
    name: 'Data Operators Guild',
    category: 'Technology',
    creator: 'meriem-ben-salah',
    priceType: 'free',
    price: 0,
    tags: ['Data', 'Dashboards', 'Automation', 'Analytics'],
    description: 'A builder community for analysts and operators shipping dashboards, automations, and repeatable reporting systems.',
    audience: 'Analysts, operations leads, and founders who need useful dashboards without heavy enterprise tooling.',
    outcomes: ['Choose the right metrics', 'Build KPI cards', 'Automate refreshes', 'Present insight with confidence'],
    cadence: 'Weekly dashboard teardown, shared templates, and office-hour support.',
    faqs: [
      ['Is it free?', 'Yes. This seeded community intentionally tests free access and free courses.'],
      ['What analytics are seeded?', 'Views, starts, completions, watch time, ratings, comments, and revenue attribution.'],
    ],
  },
  {
    name: 'Wellness Habit Studio',
    category: 'Health & Wellness',
    creator: 'hela-cherif',
    priceType: 'monthly',
    price: 29,
    tags: ['Habits', 'Wellness', 'Accountability', 'Mindful Productivity'],
    description: 'A calm practice community for building sustainable wellness routines with guided lessons, circles, and accountability.',
    audience: 'Busy professionals who want realistic routines, lightweight reflection, and supportive accountability.',
    outcomes: ['Create a seven-day reset', 'Track habits without guilt', 'Join guided live circles', 'Turn reflection into action'],
    cadence: 'Morning check-ins, Wednesday circle, and Sunday planning reset.',
    faqs: [
      ['Is this medical advice?', 'No. It is a practical habit and accountability community.'],
      ['Can members book clinics?', 'Yes. Free and paid session states are seeded for booking workflows.'],
    ],
  },
  {
    name: 'AI Automation Desk',
    category: 'Productivity',
    creator: 'tarek-mokrani',
    priceType: 'one-time',
    price: 129,
    tags: ['AI', 'Automation', 'Operations', 'No-code'],
    description: 'A practical automation workspace for turning messy repeated tasks into documented, measurable workflows.',
    audience: 'Operators, founders, and freelancers who want safer automation habits and clearer process analytics.',
    outcomes: ['Map repetitive workflows', 'Build a no-code automation', 'Add human review checkpoints', 'Measure saved time'],
    cadence: 'Biweekly build lab, async template drops, and office-hour debugging.',
    faqs: [
      ['Do I need to code?', 'No. The seeded path starts with no-code workflows and clear implementation notes.'],
      ['Can I test revenue analytics?', 'Yes. Courses, sessions, events, and products include paid orders and daily metrics.'],
    ],
  },
];

const courseBlueprints = [
  {
    community: 'creator-launch-studio',
    creator: 'amina-trabelsi',
    title: 'Build and Sell Your First Paid Community',
    category: 'Community Building',
    level: 'Débutant',
    price: 149,
    sections: [
      ['Positioning Foundation', ['Choose a profitable member promise', 'Design the transformation map', 'Validate with ten conversations']],
      ['Launch System', ['Craft the paid offer page', 'Run a seven-day warm launch', 'Convert objections into content']],
      ['Retention Engine', ['Create onboarding rituals', 'Set weekly member cadence', 'Measure activation and churn']],
    ],
  },
  {
    community: 'motion-school-lab',
    creator: 'youssef-haddad',
    title: 'Motion Design Portfolio Sprint',
    category: 'Motion Design',
    level: 'Intermédiaire',
    price: 89,
    sections: [
      ['Visual Rhythm', ['Timing basics for clean loops', 'Animating type with intent', 'Building a reusable motion grid']],
      ['Case Study Production', ['Storyboard a 15-second product shot', 'Add polish with easing and overshoot', 'Export social-ready versions']],
    ],
  },
  {
    community: 'data-operators-guild',
    creator: 'meriem-ben-salah',
    title: 'Analytics Dashboard Bootcamp',
    category: 'Data',
    level: 'Débutant',
    price: 0,
    sections: [
      ['Metrics That Matter', ['Define the operating dashboard', 'Clean source data', 'Build KPI cards']],
      ['Automation Layer', ['Schedule refreshes', 'Create anomaly alerts', 'Present insights to stakeholders']],
    ],
  },
  {
    community: 'wellness-habit-studio',
    creator: 'hela-cherif',
    title: 'Design Your Seven-Day Wellness Reset',
    category: 'Wellness',
    level: 'Débutant',
    price: 59,
    sections: [
      ['Reset Map', ['Choose the smallest useful habit', 'Design your morning and evening anchors', 'Set a kind accountability rule']],
      ['Practice Loop', ['Run the first guided check-in', 'Review energy patterns', 'Prepare a sustainable next week']],
    ],
  },
  {
    community: 'ai-automation-desk',
    creator: 'tarek-mokrani',
    title: 'AI Automation Starter Kit',
    category: 'Automation',
    level: 'Intermédiaire',
    price: 179,
    sections: [
      ['Workflow Discovery', ['Map the repeated task', 'Identify risk and review points', 'Choose the first automation target']],
      ['Build and Measure', ['Create the automation blueprint', 'Connect the no-code workflow', 'Measure saved time and error reduction']],
      ['Operationalize', ['Write the handoff SOP', 'Add monitoring checkpoints', 'Plan the next automation']],
    ],
  },
];

async function upsertBy(db, collectionName, filter, doc) {
  const existing = await db.collection(collectionName).findOne(filter, { projection: { _id: 1 } });
  if (existing) {
    const { _id, ...withoutId } = doc;
    await db.collection(collectionName).updateOne({ _id: existing._id }, { $set: withoutId });
    return;
  }
  await db.collection(collectionName).insertOne(doc);
}

function buildCourse(blueprint, usersByUsername, communitiesBySlug, index) {
  const courseId = `demo-course-${slugify(blueprint.title)}`;
  const sections = blueprint.sections.map(([sectionTitle, chapters], sectionIndex) => {
    const sectionId = `${courseId}-section-${sectionIndex + 1}`;
    return {
      id: sectionId,
      titre: sectionTitle,
      description: `Focused module for ${sectionTitle.toLowerCase()} with a clear outcome, applied checkpoints, and a review prompt.`,
      courseId,
      ordre: sectionIndex + 1,
      createdAt: new Date(),
      chapitres: chapters.map((chapterTitle, chapterIndex) => {
        const order = sectionIndex * 10 + chapterIndex + 1;
        return {
          id: `${courseId}-chapter-${order}`,
          titre: chapterTitle,
          contenu: `In this lesson, students follow a practical workflow for ${chapterTitle.toLowerCase()} with examples, checkpoints, implementation notes, a reflection prompt, and a concrete deliverable they can submit or discuss in the community.`,
          videoUrl: VIDEO_URL,
          duree: 4 + chapterIndex + sectionIndex,
          sectionId,
          ordre: chapterIndex + 1,
          isPreview: order === 1,
          prix: order > 1 && blueprint.price > 0 ? 19 : 0,
          isPaidChapter: order > 1 && blueprint.price > 0,
          notes: 'Seeded lesson with a working remote MP4 demo video, worksheet, and reference media.',
          aiTutorEnabled: true,
          ressources: [
            {
              id: `${courseId}-chapter-${order}-resource-1`,
              titre: 'Lesson worksheet',
              type: 'pdf',
              url: DOC_URL,
              description: 'Printable worksheet for this chapter.',
              ordre: 1,
            },
            {
              id: `${courseId}-chapter-${order}-resource-2`,
              titre: 'Reference clip',
              type: 'video',
              url: VIDEO_URL,
              description: 'Short demo video used by the player.',
              ordre: 2,
            },
            {
              id: `${courseId}-chapter-${order}-resource-3`,
              titre: 'Embed playback check',
              type: 'video',
              url: YOUTUBE_VIDEO_URL,
              thumbnailUrl: YOUTUBE_THUMBNAIL_URL,
              description: 'YouTube video used to verify embedded playback and remote thumbnail rendering.',
              ordre: 3,
            },
          ],
          createdAt: new Date(),
        };
      }),
    };
  });

  const creator = usersByUsername.get(blueprint.creator);
  const community = communitiesBySlug.get(blueprint.community);
  return {
    _id: oid(`course:${courseId}`),
    id: courseId,
    titre: blueprint.title,
    description: `A complete practical course for ${blueprint.category.toLowerCase()} with video lessons, worksheets, sequential chapters, paid/free access states, learner progress, reviews, and analytics-ready engagement data.`,
    thumbnail: asset('course', courseId, index),
    communityId: String(community._id),
    creatorId: creator._id,
    prix: blueprint.price,
    isPaidCourse: blueprint.price > 0,
    devise: 'TND',
    pricing: priceConfig(blueprint.price, 'TND', blueprint.price > 0 ? 'one-time' : 'free', [
      'HD lesson videos',
      'Downloadable worksheets',
      'Community Q&A',
      'Progress tracking with realistic learner history',
      'Completion certificates',
    ]),
    isPublished: true,
    sections,
    inscriptions: [],
    category: blueprint.category,
    niveau: blueprint.level,
    duree: `${sections.reduce((sum, section) => sum + section.chapitres.reduce((s, c) => s + c.duree, 0), 0)} min`,
    learningObjectives: ['Ship a practical project', 'Follow a repeatable workflow', 'Understand common mistakes', 'Build a reusable asset', 'Measure progress with analytics'],
    requirements: ['Basic computer skills', 'A willingness to practice', 'Access to the community workspace'],
    certificate: {
      enabled: true,
      title: `${blueprint.title} Completion Certificate`,
      issuer: 'Chabaqa Demo Academy',
      criteria: 'Complete every chapter and submit the final reflection.',
    },
    notes: `Seeded by ${SEED_KEY}. Includes working remote MP4 lessons, embedded video references, PDF worksheets, and realistic progress rows.`,
    ressources: [
      { id: `${courseId}-resource-1`, titre: 'Course workbook', type: 'pdf', url: DOC_URL, description: 'Full course workbook.', ordre: 1 },
      { id: `${courseId}-resource-2`, titre: 'Example video', type: 'video', url: VIDEO_URL, description: 'Working MP4 demo asset.', ordre: 2 },
      { id: `${courseId}-resource-3`, titre: 'Embed video sample', type: 'video', url: YOUTUBE_VIDEO_URL, thumbnailUrl: YOUTUBE_THUMBNAIL_URL, description: 'Working YouTube embed sample with remote thumbnail.', ordre: 3 },
    ],
    sequentialProgression: true,
    unlockMessage: 'Finish the previous lesson to unlock this chapter.',
    aiTutorEnabled: true,
    averageRating: 4.7 + index * 0.1,
    ratingCount: 12 + index * 9,
    seedKey: SEED_KEY,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function flattenCourseChapters(course) {
  return (course.sections || []).flatMap((section) =>
    (section.chapitres || []).map((chapter) => ({ ...chapter, sectionId: section.id })),
  );
}

function courseProgressPercent(userIndex, courseIndex, courseId) {
  const pattern = [100, 86, 72, 58, 43, 27, 12, 0];
  return pick(pattern, metricSeed('course-progress', userIndex, courseIndex, courseId) + userIndex + courseIndex);
}

function buildEnrollmentProgression(enrollment, course, progressPercent, now) {
  const chapters = flattenCourseChapters(course);
  if (!chapters.length || progressPercent <= 0) return [];
  const completedCount = progressPercent >= 100
    ? chapters.length
    : Math.floor((chapters.length * progressPercent) / 100);
  const visibleCount = clamp(completedCount + (completedCount < chapters.length ? 1 : 0), 1, chapters.length);

  return chapters.slice(0, visibleCount).map((chapter, index) => {
    const isCompleted = index < completedCount;
    return {
      id: `demo-course-progress-${enrollment.id}-${chapter.id}`,
      enrollmentId: enrollment._id,
      chapterId: chapter.id,
      isCompleted,
      watchTime: isCompleted ? chapter.duree * 60 : Math.round(chapter.duree * 60 * 0.42),
      videoDuration: chapter.duree * 60,
      completedAt: isCompleted ? pastDate(clamp(24 - index, 1, 30), 16) : undefined,
      lastAccessedAt: pastDate(clamp(12 - index, 0, 20), 18),
      createdAt: now,
      updatedAt: now,
    };
  });
}

function objectIdOrNull(value) {
  if (!value) return undefined;
  if (value instanceof ObjectId) return value;
  const asString = String(value);
  return ObjectId.isValid(asString) ? new ObjectId(asString) : undefined;
}

function contentCreatorId(type, doc) {
  if (doc.creatorId) return doc.creatorId;
  if (doc.createur) return doc.createur;
  if (doc.author) return doc.author;
  if (doc.authorId) return doc.authorId;
  return undefined;
}

function contentCommunityId(type, doc) {
  if (type === 'community') return String(doc._id);
  if (doc.communityId) return String(doc.communityId);
  return undefined;
}

function contentPrice(type, doc) {
  if (type === 'course') return Number(doc.prix || 0);
  if (type === 'challenge') return Number(doc.pricing?.participationFee || doc.depositAmount || 0);
  if (type === 'event') return Math.max(0, ...(doc.tickets || []).map((ticket) => Number(ticket.price || 0)));
  if (type === 'session') return Number(doc.price || 0);
  if (type === 'product') return Number(doc.price || 0);
  if (type === 'resource') return Number(doc.pricing?.price || 0);
  if (type === 'community') return Number(doc.fees_of_join || doc.price || 0);
  return 0;
}

function progressProfile(user, userIndex, type, contentId, doc, contentIndex, now) {
  const score = metricSeed(user.username, type, contentId, contentIndex);
  const patternByType = {
    course: [100, 88, 74, 61, 45, 28, 12, 0],
    challenge: [100, 84, 66, 48, 30, 15, 0],
    event: [100, 72, 38, 0],
    session: [100, 56, 0],
    product: [100, 52, 0],
    post: [100, 72, 34, 0],
    resource: [100, 82, 51, 19, 0],
    community: [100, 91, 68, 39, 11],
  };
  const progressPercent = pick(patternByType[type] || [100, 50, 0], score + userIndex + contentIndex);
  const totalChapters = type === 'course' ? flattenCourseChapters(doc).length : 0;
  const completedChapters = totalChapters ? Math.round((totalChapters * progressPercent) / 100) : 0;
  const isCompleted = progressPercent >= 95;
  const viewCount = progressPercent > 0 ? 1 + (score % 9) : score % 7 === 0 ? 1 : 0;
  const likeCount = progressPercent > 25 && score % 3 === 0 ? 1 : 0;
  const shareCount = progressPercent > 45 && score % 5 === 0 ? 1 : 0;
  const downloadCount = ['course', 'challenge', 'product', 'resource'].includes(type) && progressPercent > 20
    ? (score % 4 === 0 ? 2 : score % 2 === 0 ? 1 : 0)
    : 0;
  const rating = progressPercent >= 55 ? Math.min(5, Math.round((4.1 + (score % 9) / 10) * 10) / 10) : 0;
  const review = rating > 0 && score % 3 === 0
    ? pick([
        'The structure is clear and the next action is easy to follow.',
        'Useful examples, especially the checkpoints and downloadable resources.',
        'Great pacing for a demo account. I can test progress, ratings, and reviews quickly.',
        'The media loads cleanly and the resource list feels realistic.',
      ], score)
    : undefined;

  return {
    score,
    progressPercent,
    isCompleted,
    watchTime: progressPercent > 0 ? Math.round((progressPercent / 100) * (900 + (score % 1800))) : 0,
    rating,
    review,
    completedAt: isCompleted ? pastDate(1 + (score % 14), 18) : undefined,
    lastAccessedAt: progressPercent > 0 ? pastDate(score % 21, 8 + (score % 10)) : pastDate(35 + (score % 20), 10),
    bookmarks: progressPercent > 0 && score % 4 === 0 ? [`${type}:${contentId}`] : [],
    viewCount,
    likeCount,
    shareCount,
    downloadCount,
    metadata: {
      progressPercent,
      completedChapters,
      totalChapters,
      engagementSegment: progressPercent >= 80 ? 'power-user' : progressPercent >= 35 ? 'active-learner' : progressPercent > 0 ? 'new-learner' : 'dormant',
      source: pick(['community-home', 'course-player', 'resource-vault', 'analytics-email', 'creator-profile'], score),
      device: pick(['desktop', 'mobile', 'tablet'], score + userIndex),
      mediaChecked: {
        image: Boolean(doc.thumbnail || doc.image || doc.logo || doc.thumbnailUrl || doc.coverImageUrl),
        video: Boolean(doc.videoUrl || doc.content?.videoUrl || (Array.isArray(doc.videos) && doc.videos.length)),
        pdf: true,
      },
    },
    now,
  };
}

function buildTrackingActions(user, type, contentId, profile) {
  const actions = [];
  const push = (actionType, sequence, metadata = {}) => {
    actions.push({
      _id: oid(`tracking:${user.username}:${type}:${contentId}:${actionType}:${sequence}`),
      id: `demo-tracking-${user.username}-${type}-${slugify(contentId)}-${actionType}-${sequence}`,
      userId: user._id,
      contentId,
      contentType: type,
      actionType,
      metadata: {
        seedKey: SEED_KEY,
        progressPercent: profile.progressPercent,
        engagementSegment: profile.metadata.engagementSegment,
        ...metadata,
      },
      timestamp: pastDate((profile.score + sequence) % 28, 8 + (sequence % 10)),
      seedKey: SEED_KEY,
      createdAt: pastDate((profile.score + sequence) % 28, 8 + (sequence % 10)),
      updatedAt: profile.now,
    });
  };

  for (let index = 0; index < Math.min(profile.viewCount, 3); index += 1) {
    push('view', index + 1, { viewNumber: index + 1 });
  }
  if (profile.progressPercent > 0) {
    push('start', 10, { source: profile.metadata.source });
    push('progress', 11, { watchTime: profile.watchTime });
  }
  if (profile.isCompleted) push('complete', 12, { completedAt: profile.completedAt });
  if (profile.likeCount > 0) push('like', 13);
  if (profile.shareCount > 0) push('share', 14, { channel: pick(['copy-link', 'whatsapp', 'linkedin'], profile.score) });
  if (profile.downloadCount > 0) push('download', 15, { downloads: profile.downloadCount });
  if (profile.bookmarks.length > 0) push('bookmark', 16);
  if (profile.rating > 0) push('rate', 17, { rating: profile.rating });
  if (profile.review) push('comment', 18, { review: profile.review });
  if (type === 'session' && profile.progressPercent > 0) {
    push(profile.score % 5 === 0 ? 'session_noshow' : 'session_show', 19);
    if (profile.score % 4 === 0) push('session_rebook', 20);
  }
  if (type === 'challenge' && profile.progressPercent > 20) {
    push('challenge_streak', 21, { streakDays: 1 + (profile.score % 7) });
  }
  if (type === 'community' && profile.progressPercent > 30) {
    push('email_open', 22, { campaign: 'demo-weekly-digest' });
    if (profile.score % 2 === 0) push('email_click', 23, { campaign: 'demo-weekly-digest' });
  }
  if (profile.score % 6 === 0) push('ab_impression', 24, { experiment: 'demo-hero-layout' });
  if (profile.score % 13 === 0) push('ab_convert', 25, { experiment: 'demo-hero-layout' });

  return actions;
}

function buildOrderDoc(user, type, contentId, doc, orderIndex, now) {
  const gross = contentPrice(type, doc);
  const discountDT = gross > 90 && orderIndex % 3 === 0 ? 10 : 0;
  const amountDT = Math.max(0, gross - discountDT);
  const platformFeeDT = Math.round((amountDT * 0.1 + (amountDT > 0 ? 1 : 0)) * 100) / 100;
  const status = pick(['paid', 'paid', 'pending_verification', 'refunded'], orderIndex);
  return {
    _id: oid(`order:${user.username}:${type}:${contentId}:${orderIndex}`),
    buyerId: user._id,
    creatorId: contentCreatorId(type, doc),
    communityId: objectIdOrNull(contentCommunityId(type, doc)),
    contentType: type,
    contentId,
    amountDT,
    platformPercent: 10,
    platformFixedDT: amountDT > 0 ? 1 : 0,
    platformFeeDT,
    creatorNetDT: Math.max(0, Math.round((amountDT - platformFeeDT) * 100) / 100),
    promoCode: discountDT > 0 ? 'DEMO10' : null,
    discountDT,
    paymentId: `demo-order-${orderIndex}-${type}-${slugify(contentId).slice(0, 50)}`,
    paymentMethod: pick(['offline', 'flouci', 'manual', 'stripe'], orderIndex),
    status,
    paymentProof: status === 'pending_verification' ? asset('payment-proof', `${type}-${contentId}`, orderIndex) : undefined,
    metadata: {
      seedKey: SEED_KEY,
      note: `Demo ${status} ${type} order`,
      mediaUrlsVerified: MEDIA_LIBRARY,
    },
    seedKey: SEED_KEY,
    createdAt: pastDate(1 + (orderIndex % 14), 11 + (orderIndex % 8)),
    updatedAt: now,
  };
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function memberUsersPreview(index) {
  const names = ['Sarra Kefi', 'Omar Jaziri', 'Nour Dridi', 'Lina Gharbi', 'Aya Mbarek', 'Sami Ben Ali'];
  return [pick(names, index), pick(names, index + 2)];
}

function buildAnalyticsDailyRows(allContent, paidOrders, now) {
  return allContent.flatMap(([type, contentId, doc], contentIndex) => {
    const creatorId = contentCreatorId(type, doc);
    if (!creatorId) return [];
    const rows = [];
    for (let days = 13; days >= 0; days -= 1) {
      const date = dayStamp(days);
      const score = metricSeed('analytics', type, contentId, days);
      const contentWeight = ['community', 'post', 'resource'].includes(type) ? 1.45 : ['course', 'challenge'].includes(type) ? 1.15 : 0.9;
      const views = Math.max(0, Math.round((10 + (score % 20) + (14 - days)) * contentWeight));
      const starts = ['course', 'challenge', 'session', 'event', 'community'].includes(type)
        ? Math.round(views * (0.28 + (score % 10) / 100))
        : Math.round(views * 0.12);
      const completes = ['course', 'challenge', 'session', 'event'].includes(type)
        ? Math.round(starts * (0.18 + (score % 8) / 100))
        : Math.round(views * 0.05);
      const revenueAttributed = paidOrders
        .filter((order) => order.status === 'paid' && order.contentType === type && order.contentId === contentId && dateKey(order.createdAt) === dateKey(date))
        .reduce((sum, order) => sum + Number(order.amountDT || 0), 0);

      rows.push({
        _id: oid(`analytics:${type}:${contentId}:${dateKey(date)}`),
        id: `demo-analytics-${type}-${slugify(contentId)}-${dateKey(date)}`,
        creatorId,
        contentType: type,
        contentId,
        communityId: contentCommunityId(type, doc),
        date,
        views,
        starts,
        completes,
        chapterCompletes: type === 'course' ? completes * 2 + (score % 3) : 0,
        likes: Math.round(views * 0.11),
        shares: Math.round(views * 0.04),
        downloads: ['course', 'challenge', 'product', 'resource'].includes(type) ? Math.round(views * 0.07) : 0,
        bookmarks: Math.round(views * 0.05),
        avgRating: Number((4.2 + (score % 7) / 10).toFixed(1)),
        ratingsCount: Math.round(views * 0.08),
        watchTime: Math.round(views * (45 + (score % 240))),
        uniqueUsers: Math.min(views, 3 + (score % 18)),
        avgProgressPercent: ['course', 'challenge'].includes(type) ? 25 + (score % 65) : 0,
        revenueAttributed,
        currency: 'TND',
        countryViews: {
          Tunisie: Math.round(views * 0.72),
          France: Math.round(views * 0.16),
          Canada: Math.max(0, views - Math.round(views * 0.88)),
        },
        comments: ['post', 'challenge', 'community'].includes(type) ? Math.round(views * 0.06) : 0,
        sessionShowUps: type === 'session' ? Math.round(starts * 0.72) : 0,
        sessionNoShows: type === 'session' ? Math.round(starts * 0.12) : 0,
        sessionRebookings: type === 'session' ? Math.round(starts * 0.18) : 0,
        activeStreaks: type === 'challenge' ? 2 + (score % 9) : 0,
        maxStreakDays: type === 'challenge' ? 3 + (score % 7) : 0,
        emailSent: type === 'community' ? 40 + (score % 60) : 0,
        emailOpened: type === 'community' ? 22 + (score % 35) : 0,
        emailClicked: type === 'community' ? 6 + (score % 15) : 0,
        affiliateCode: score % 5 === 0 ? `DEMO-${String(contentIndex + 1).padStart(2, '0')}` : undefined,
        metadata: { seedKey: SEED_KEY },
        seedKey: SEED_KEY,
        createdAt: now,
        updatedAt: now,
      });
    }
    return rows;
  });
}

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error('Missing MONGO_URI env var');

  const client = new MongoClient(mongoUri, { ignoreUndefined: true });
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  try {
    await client.connect();
    const db = client.db(resolveDbName(mongoUri));

    await Promise.all([
      db.collection('users').deleteMany({ email: { $in: userBlueprints.map(([, , email]) => email) } }),
      db.collection('admins').deleteMany({ email: { $in: ADMIN_BLUEPRINTS.map(({ email }) => email) } }),
      db.collection('adminusers').deleteMany({ 'metadata.seedKey': SEED_KEY }),
      db.collection('communities').deleteMany({ slug: { $in: communityBlueprints.map((community) => slugify(community.name)) } }),
      db.collection('cours').deleteMany({ id: /^demo-course-/ }),
      db.collection('courseenrollments').deleteMany({ id: /^demo-enrollment-/ }),
      db.collection('contentprogresses').deleteMany({ seedKey: SEED_KEY }),
      db.collection('trackingactions').deleteMany({ seedKey: SEED_KEY }),
      db.collection('analyticsdailies').deleteMany({ seedKey: SEED_KEY }),
      db.collection('challenges').deleteMany({ id: /^demo-challenge-/ }),
      db.collection('challengesubmissions').deleteMany({ seedKey: SEED_KEY }),
      db.collection('events').deleteMany({ id: /^demo-event-/ }),
      db.collection('sessions').deleteMany({ id: /^demo-session-/ }),
      db.collection('products').deleteMany({ id: /^demo-product-/ }),
      db.collection('posts').deleteMany({ id: /^demo-post-/ }),
      db.collection('resources').deleteMany({ seedKey: SEED_KEY }),
      db.collection('orders').deleteMany({ seedKey: SEED_KEY }),
    ]);

    const now = new Date();
    const usersByUsername = new Map();
    for (const [userIndex, [name, username, email, role, ville, bio]] of userBlueprints.entries()) {
      const user = {
        _id: oid(`user:${username}`),
        name,
        username,
        email,
        password: passwordHash,
        authProvider: 'local',
        hasLocalPassword: true,
        role,
        createdCommunities: [],
        joinedCommunities: [],
        adminCommunities: [],
        moderatorCommunities: [],
        purchasedProducts: [],
        numtel: phoneNumber(username),
        date_naissance: new Date(Date.UTC(1988 + (userIndex % 12), userIndex % 12, 10 + (userIndex % 18))),
        sexe: genderForUsername(username),
        pays: 'Tunisie',
        ville,
        code_postal: '1000',
        adresse: `${ville} Creative District`,
        photo_profil: asset('avatar', username, userIndex),
        profile_picture: asset('profile', username, userIndex),
        bio,
        lien_instagram: `https://instagram.com/${username}`,
        socialLinks: {
          instagram: `https://instagram.com/${username}`,
          linkedin: `https://linkedin.com/in/${username}`,
          website: `https://${username}.demo.chabaqa.local`,
        },
        twoFactorEnabled: false,
        lastActive: now,
        walletBalance: role === 'creator' ? 250 : 40,
        totalPointsEarned: role === 'creator' ? 1200 : 180,
        isSuspended: false,
        accountStatus: 'active',
        seedKey: SEED_KEY,
        createdAt: now,
      };
      usersByUsername.set(username, user);
      await upsertBy(db, 'users', { email }, user);
    }

    const adminDocs = [];
    for (const [adminIndex, adminBlueprint] of ADMIN_BLUEPRINTS.entries()) {
      const admin = {
        _id: oid(`admin:${adminBlueprint.email}`),
        name: adminBlueprint.name,
        email: adminBlueprint.email,
        username: adminBlueprint.username,
        password: passwordHash,
        role: 'admin',
        numtel: phoneNumber(adminBlueprint.username),
        date_naissance: new Date('1990-04-18T00:00:00.000Z'),
        sexe: 'male',
        pays: 'Tunisie',
        ville: adminBlueprint.ville,
        code_postal: '1000',
        adresse: `${adminBlueprint.ville} Operations Center`,
        photo_profil: asset('admin-avatar', adminBlueprint.username, adminIndex),
        poste: adminBlueprint.poste,
        departement: adminBlueprint.departement,
        failedLoginAttempts: 0,
        lockoutUntil: null,
        lastLoginAt: pastDate(1, 9),
        passwordChangedAt: now,
        adminPreferences: {
          theme: 'system',
          locale: 'fr-TN',
          timezone: 'Africa/Tunis',
          emailNotifications: true,
        },
        seedKey: SEED_KEY,
        createdAt: now,
        updatedAt: now,
      };
      adminDocs.push(admin);
      await upsertBy(db, 'admins', { email: admin.email }, admin);
    }

    const platformOwner = usersByUsername.get('amina-trabelsi');
    const adminUserDoc = {
      _id: oid('adminuser:amina-trabelsi'),
      userId: platformOwner._id,
      roles: ['super_admin', 'analytics_viewer', 'community_manager', 'financial_manager'],
      permissions: [
        'view_users',
        'user_read',
        'view_communities',
        'approve_communities',
        'moderate_communities',
        'view_content_queue',
        'approve_content',
        'view_financial_data',
        'process_payouts',
        'analytics_read',
        'view_analytics',
        'export_data',
        'manage_admin_users',
      ],
      isActive: true,
      lastLoginAt: pastDate(1, 10),
      lastActivityAt: now,
      metadata: {
        seedKey: SEED_KEY,
        linkedLegacyAdminEmail: ADMIN_BLUEPRINTS[0].email,
        note: 'Enhanced RBAC admin profile linked to a seeded creator user.',
      },
      createdAt: now,
      updatedAt: now,
    };
    await upsertBy(db, 'adminusers', { userId: adminUserDoc.userId }, adminUserDoc);

    const communitiesBySlug = new Map();
    for (let index = 0; index < communityBlueprints.length; index += 1) {
      const blueprint = communityBlueprints[index];
      const slug = slugify(blueprint.name);
      const creator = usersByUsername.get(blueprint.creator);
      const members = Array.from(usersByUsername.values()).map((user) => user._id);
      const [primaryColor, secondaryColor] = pick(THEME_COLORS, index);
      const community = {
        _id: oid(`community:${slug}`),
        name: blueprint.name,
        slug,
        logo: asset('logo', slug, index),
        photo_de_couverture: asset('cover', slug, index + 1),
        short_description: blueprint.description,
        country: 'Tunisie',
        currency: 'TND',
        long_description: [
          { type: 'text', title: 'Overview', content: blueprint.description, order: 1 },
          { type: 'text', title: 'Who this is for', content: blueprint.audience, order: 2 },
          { type: 'text', title: 'Member outcomes', content: blueprint.outcomes.join('\n'), order: 3 },
          { type: 'image', title: 'Workspace', content: asset('community-long', slug, index + 2), order: 4 },
          { type: 'video', title: 'Welcome Video', content: VIDEO_URL, order: 5 },
          { type: 'video', title: 'Embed Preview', content: YOUTUBE_VIDEO_URL, thumbnailUrl: YOUTUBE_THUMBNAIL_URL, order: 6 },
        ],
        createur: creator._id,
        creatorBanner: asset('creator-banner', slug, index + 3),
        creatorAvatar: creator.profile_picture,
        category: blueprint.category,
        priceType: blueprint.priceType,
        image: asset('community-image', slug, index + 4),
        tags: blueprint.tags,
        featured: index < 2,
        type: 'community',
        settings: {
          primaryColor,
          secondaryColor,
          welcomeMessage: `Welcome to ${blueprint.name}. Start with the pinned post, then pick a course.`,
          features: ['Courses', 'Events', 'Challenges', 'Sessions', 'Products', 'Resources'],
          benefits: blueprint.outcomes,
          audience: blueprint.audience,
          cadence: blueprint.cadence,
          template: 'modern',
          fontFamily: 'Inter',
          borderRadius: 8,
          backgroundStyle: 'solid',
          heroLayout: 'centered',
          headerStyle: 'default',
          contentWidth: 'wide',
          showStats: true,
          showHero: true,
          showFeatures: true,
          showBenefits: true,
          showTestimonials: true,
          showPosts: true,
          showFAQ: true,
          enableAnimations: true,
          enableParallax: false,
          logo: asset('settings-logo', slug, index),
          heroBackground: asset('hero', slug, index + 5),
          gallery: [asset('gallery', slug, index), asset('gallery', slug, index + 1)],
          videoUrl: VIDEO_URL,
          youtubeUrl: YOUTUBE_VIDEO_URL,
          videoThumbnailUrl: YOUTUBE_THUMBNAIL_URL,
          socialLinks: { instagram: `https://instagram.com/${slug}`, linkedin: `https://linkedin.com/company/${slug}` },
          customSections: [
            { id: 1, type: 'text', title: 'Start Here', content: 'Enroll in a course, join a challenge, book a session, or download a resource.', visible: true },
            { id: 2, type: 'text', title: 'Weekly Cadence', content: blueprint.cadence, visible: true },
            { id: 3, type: 'image', title: 'Member Workspace', content: asset('custom-section', slug, index + 6), visible: true },
          ],
          testimonials: memberUsersPreview(index).map((name, testimonialIndex) => ({
            id: `${slug}-testimonial-${testimonialIndex + 1}`,
            name,
            role: testimonialIndex === 0 ? 'Active member' : 'Cohort participant',
            quote: pick([
              'The path is concrete enough to test every core product flow in minutes.',
              'The mix of courses, resources, events, and analytics feels like a real community.',
              'I can validate media playback, comments, purchases, and progress from one account.',
            ], index + testimonialIndex),
            avatar: asset('testimonial-avatar', `${slug}-${testimonialIndex}`, testimonialIndex),
          })),
          faq: blueprint.faqs.map(([question, answer], faqIndex) => ({ id: `${slug}-faq-${faqIndex + 1}`, question, answer })),
          metaTitle: `${blueprint.name} | Chabaqa Demo`,
          metaDescription: blueprint.description,
          customDomain: '',
          headerScripts: '',
        },
        aiSettings: {
          courseTutorEnabled: true,
          supportAgentEnabled: true,
          learningPathsEnabled: true,
          providerOverride: 'openrouter',
          agentsEnabled: true,
          cofounderEnabled: true,
        },
        stats: { totalRevenue: 1200 * (index + 1), monthlyGrowth: 12 + index * 4, engagementRate: 78 + index * 3, retentionRate: 82 + index * 2 },
        members,
        admins: [creator._id],
        moderateurs: [members[(index + 4) % members.length]],
        rank: index + 1,
        fees_of_join: blueprint.price,
        pricing: {
          ...priceConfig(blueprint.price, 'TND', blueprint.priceType, ['Community access', 'Live workshops', 'Resource vault']),
          limits: { maxMembers: 1000, maxCourses: 50, maxPosts: 2000, storageLimit: '25GB' },
        },
        isActive: true,
        isPrivate: false,
        isVerified: true,
        membersCount: members.length,
        inviteCode: `DEMO${index + 1}CHABAQA`,
        inviteLink: `http://localhost:8080/community/join/DEMO${index + 1}CHABAQA`,
        averageRating: 4.6 + index * 0.1,
        ratingCount: 30 + index * 11,
        cours: [],
        longDescription: blueprint.description,
        description: blueprint.description,
        coverImage: asset('cover-image', slug, index + 6),
        rating: 4.6 + index * 0.1,
        price: blueprint.price,
        verified: true,
        creator: creator.name,
        createdDate: now.toISOString(),
        updatedDate: now.toISOString(),
        approvalStatus: 'approved',
        approvedAt: now,
        isSuspended: false,
        seedKey: SEED_KEY,
        createdAt: now,
        updatedAt: now,
      };
      communitiesBySlug.set(slug, community);
      await upsertBy(db, 'communities', { slug }, community);
    }

    const courses = courseBlueprints.map((blueprint, index) =>
      buildCourse(blueprint, usersByUsername, communitiesBySlug, index),
    );
    for (const course of courses) {
      await upsertBy(db, 'cours', { id: course.id }, course);
      await db.collection('communities').updateOne(
        { _id: new ObjectId(String(course.communityId)) },
        { $addToSet: { cours: course._id }, $set: { updatedAt: now } },
      );
    }

    const memberUsers = Array.from(usersByUsername.values()).filter((user) => user.role === 'user');
    const enrollments = [];
    for (const [userIndex, user] of memberUsers.entries()) {
      for (const [courseIndex, course] of courses.entries()) {
        const progressPercent = courseProgressPercent(userIndex, courseIndex, course.id);
        const paidChapterIds = course.isPaidCourse && progressPercent > 0
          ? flattenCourseChapters(course).filter((chapter) => chapter.isPaidChapter).map((chapter) => chapter.id)
          : [];
        const enrollment = {
          _id: oid(`enrollment:${user.username}:${course.id}`),
          id: `demo-enrollment-${user.username}-${course.id}`,
          userId: user._id,
          courseId: course._id,
          progression: [],
          purchasedChapterIds: paidChapterIds,
          enrolledAt: pastDate(20 - ((userIndex + courseIndex) % 12), 9),
          completedAt: progressPercent >= 100 ? pastDate(2 + ((userIndex + courseIndex) % 5), 17) : undefined,
          isActive: true,
          seedKey: SEED_KEY,
          createdAt: now,
          updatedAt: now,
        };
        enrollment.progression = buildEnrollmentProgression(enrollment, course, progressPercent, now);
        enrollments.push(enrollment);
        await upsertBy(db, 'courseenrollments', { id: enrollment.id }, enrollment);
        await db.collection('cours').updateOne({ _id: course._id }, { $addToSet: { inscriptions: enrollment._id } });
      }
    }

    for (const user of usersByUsername.values()) {
      const created = Array.from(communitiesBySlug.values()).filter((c) => String(c.createur) === String(user._id)).map((c) => c._id);
      const joined = Array.from(communitiesBySlug.values()).map((c) => c._id);
      await db.collection('users').updateOne(
        { _id: user._id },
        {
          $set: {
            createdCommunities: created,
            joinedCommunities: joined,
            adminCommunities: created,
            moderatorCommunities: Array.from(communitiesBySlug.values()).filter((c) => c.moderateurs.some((id) => String(id) === String(user._id))).map((c) => c._id),
          },
        },
      );
    }

    const challengeDocs = Array.from(communitiesBySlug.values()).map((community, index) => {
      const id = `demo-challenge-${slugify(community.name)}-sprint`;
      return {
        _id: oid(`challenge:${id}`),
        id,
        title: `${community.name} 7-Day Implementation Sprint`,
        description: 'A rich challenge with daily tasks, resources, participant baselines, and community posts.',
        communityId: String(community._id),
        creatorId: community.createur,
        startDate: futureDate(2 + index, 9),
        endDate: futureDate(9 + index, 20),
        isActive: true,
        participants: memberUsers.map((user, userIndex) => {
          const completedCount = (userIndex + index) % 8;
          return {
            id: `demo-participant-${id}-${user.username}`,
            userId: user._id,
            joinedAt: pastDate(6 - Math.min(5, completedCount), 9),
            isActive: true,
            progress: Math.round((Math.min(completedCount, 7) / 7) * 100),
            totalPoints: completedCount * 100,
            completedTasks: Array.from({ length: Math.min(completedCount, 7) }).map((_, taskIndex) => `${id}-task-${taskIndex + 1}`),
            streak: Math.min(completedCount, 7),
            lastActivityAt: completedCount > 0 ? pastDate(Math.max(0, 7 - completedCount), 18) : pastDate(11 + userIndex, 10),
          };
        }),
        posts: [
          {
            id: `demo-challenge-post-${id}`,
            content: 'Introduce yourself and share what you want to ship by the end of the sprint.',
            images: [asset('challenge-post', id, index)],
            userId: memberUsers[index % memberUsers.length]._id,
            likes: 3,
            comments: [],
            createdAt: now,
            updatedAt: now,
          },
        ],
        depositAmount: index === 0 ? 20 : 0,
        maxParticipants: 80,
        completionReward: 25,
        topPerformerBonus: 50,
        streakBonus: 15,
        category: community.category,
        difficulty: ['beginner', 'intermediate', 'advanced'][index % 3],
        duration: '7 days',
        thumbnail: asset('challenge', id, index),
        notes: 'Seeded challenge with mixed participant progress, streaks, daily task state, and working media resources.',
        resources: [
          { id: `${id}-resource-1`, title: 'Sprint guide', type: 'pdf', url: DOC_URL, description: 'Challenge workbook.', order: 1 },
          { id: `${id}-resource-2`, title: 'Kickoff replay', type: 'video', url: VIDEO_URL, description: 'Working MP4 demo.', order: 2 },
          { id: `${id}-resource-3`, title: 'Embed replay check', type: 'video', url: YOUTUBE_VIDEO_URL, thumbnailUrl: YOUTUBE_THUMBNAIL_URL, description: 'YouTube embed and thumbnail playback check.', order: 3 },
        ],
        tasks: Array.from({ length: 7 }).map((_, taskIndex) => ({
          id: `${id}-task-${taskIndex + 1}`,
          day: taskIndex + 1,
          title: `Day ${taskIndex + 1}: ${['Plan', 'Draft', 'Build', 'Review', 'Publish', 'Measure', 'Retrospective'][taskIndex]}`,
          description: `Complete the day ${taskIndex + 1} milestone and share proof in the community.`,
          deliverable: 'A screenshot, link, or written update.',
          isCompleted: false,
          isActive: true,
          points: 100,
          resources: [{ id: `${id}-task-${taskIndex + 1}-resource`, title: 'Daily reference', type: 'link', url: DOC_URL, description: 'Daily checklist.' }],
          instructions: 'Read the brief, do the work, submit your evidence, and comment on two peer updates.',
          createdAt: now,
        })),
        sequentialProgression: true,
        unlockMessage: 'Complete the previous task to unlock this one.',
        pricing: {
          ...priceConfig(index === 2 ? 0 : 29, 'TND', index === 2 ? 'free' : 'one-time', ['Daily prompts', 'Peer review', 'Completion badge']),
          participationFee: index === 2 ? 0 : 29,
          depositRequired: index === 0,
          depositAmount: index === 0 ? 20 : 0,
          isPremium: index !== 2,
          premiumFeatures: {
            personalMentoring: index === 0,
            exclusiveResources: true,
            priorityFeedback: index !== 2,
            certificate: true,
            liveSessions: true,
            communityAccess: true,
          },
        },
        averageRating: 4.5 + index * 0.1,
        ratingCount: 10 + index * 5,
        seedKey: SEED_KEY,
        createdAt: now,
        updatedAt: now,
      };
    });

    const leaderboardCommunity = communitiesBySlug.get('creator-launch-studio') || Array.from(communitiesBySlug.values())[0];
    const leaderboardId = 'demo-challenge-leaderboard-points-arena';
    const leaderboardTaskTitles = [
      'Set your public shipping goal',
      'Publish the first proof-of-work post',
      'Create the working prototype',
      'Collect peer feedback',
      'Improve the strongest feature',
      'Submit the final demo',
    ];
    const leaderboardTasks = leaderboardTaskTitles.map((title, taskIndex) => ({
      id: `${leaderboardId}-task-${taskIndex + 1}`,
      day: taskIndex + 1,
      title,
      description: [
        'Define the outcome, target user, and success metric for the mini project.',
        'Share a screenshot, sketch, or outline so peers can react early.',
        'Build the smallest usable version of the offer, workflow, or interface.',
        'Ask for specific feedback and respond to at least two reviewers.',
        'Apply the most useful critique and document what changed.',
        'Submit the finished project with links, images, and a concise recap.',
      ][taskIndex],
      deliverable: [
        'Goal statement plus one measurable success metric.',
        'Community post with one screenshot or artifact link.',
        'Prototype URL, repo, Figma file, or screen recording.',
        'Feedback summary with two peer comments addressed.',
        'Before/after note showing the improvement.',
        'Final project submission with evidence and next steps.',
      ][taskIndex],
      isCompleted: false,
      isActive: taskIndex <= 3,
      points: [80, 100, 140, 120, 160, 200][taskIndex],
      resources: [
        {
          id: `${leaderboardId}-task-${taskIndex + 1}-resource`,
          title: `${title} checklist`,
          type: 'link',
          url: DOC_URL,
          description: 'Daily checklist used by the seeded leaderboard challenge.',
        },
      ],
      instructions: 'Complete the task, attach evidence, and submit it for review.',
      notes: taskIndex === 3 ? 'This day has pending seeded submissions for testing review states.' : undefined,
      createdAt: now,
    }));
    const leaderboardParticipantPlans = [
      ['sarra-kefi', 5, 640, 83, 5],
      ['omar-jaziri', 4, 590, 67, 4],
      ['nour-dridi', 4, 560, 67, 3],
      ['karim-mansour', 3, 440, 50, 3],
      ['lina-gharbi', 3, 410, 50, 2],
      ['fares-mejri', 2, 280, 33, 2],
      ['ines-saidi', 2, 260, 33, 2],
      ['aya-mbarek', 4, 520, 67, 4],
      ['salma-mahfoudh', 3, 390, 50, 3],
      ['hatem-ouertani', 2, 300, 33, 2],
      ['malek-chatti', 2, 275, 33, 2],
      ['mehdi-ayari', 1, 120, 17, 1],
      ['rania-belaid', 1, 100, 17, 1],
      ['sami-ben-ali', 1, 110, 17, 1],
      ['dorsaf-nasri', 2, 245, 33, 2],
      ['amina-trabelsi', 0, 0, 0, 0],
      ['youssef-haddad', 0, 0, 0, 0],
      ['meriem-ben-salah', 0, 0, 0, 0],
      ['hela-cherif', 0, 0, 0, 0],
      ['tarek-mokrani', 0, 0, 0, 0],
    ];
    const leaderboardParticipants = leaderboardParticipantPlans
      .map(([username, completedCount, totalPoints, progress, streak], index) => {
        const user = usersByUsername.get(username);
        if (!user) return null;
        return {
          id: `demo-participant-${leaderboardId}-${username}`,
          userId: user._id,
          joinedAt: new Date(now.getTime() - (12 - index) * 60 * 60 * 1000),
          isActive: true,
          progress,
          totalPoints,
          completedTasks: leaderboardTasks.slice(0, completedCount).map((task) => task.id),
          streak,
          lastActivityAt: new Date(now.getTime() - index * 45 * 60 * 1000),
        };
      })
      .filter(Boolean);
    const leaderboardChallenge = {
      _id: oid(`challenge:${leaderboardId}`),
      id: leaderboardId,
      title: 'Leaderboard Points Arena',
      description: 'A seeded challenge built specifically to test podium overlays, ranks 4+, current-user position, task locks, pending submissions, approved submissions, points, streaks, rewards, posts, and resources.',
      communityId: String(leaderboardCommunity._id),
      creatorId: leaderboardCommunity.createur,
      startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      isActive: true,
      participants: leaderboardParticipants,
      posts: [
        {
          id: `demo-challenge-post-${leaderboardId}-kickoff`,
          content: 'Leaderboard test kickoff: post your goal, then submit every day so the podium keeps moving.',
          images: [asset('challenge-post', leaderboardId, 4)],
          userId: usersByUsername.get('sarra-kefi')._id,
          likes: 9,
          comments: [
            {
              id: `demo-challenge-comment-${leaderboardId}-1`,
              content: 'The points race makes it easy to see who is shipping consistently.',
              userId: usersByUsername.get('omar-jaziri')._id,
              createdAt: now,
              updatedAt: now,
            },
          ],
          createdAt: now,
          updatedAt: now,
        },
      ],
      depositAmount: 15,
      maxParticipants: 120,
      completionReward: 30,
      topPerformerBonus: 75,
      streakBonus: 20,
      category: 'Testing',
      difficulty: 'intermediate',
      duration: '6 days',
      thumbnail: asset('challenge', leaderboardId, 7),
      notes: 'Seeded challenge with realistic leaderboard points and mixed submission states for UI testing.',
      resources: [
        { id: `${leaderboardId}-resource-1`, title: 'Leaderboard QA script', type: 'pdf', url: DOC_URL, description: 'Checklist for validating podium, rows, points, and current-user state.', order: 1 },
        { id: `${leaderboardId}-resource-2`, title: 'Submission demo video', type: 'video', url: VIDEO_URL, description: 'Working MP4 used to test resource playback links.', order: 2 },
        { id: `${leaderboardId}-resource-3`, title: 'Final project template', type: 'link', url: 'https://example.com/chabaqa-leaderboard-template', description: 'Example project submission template.', order: 3 },
      ],
      tasks: leaderboardTasks,
      sequentialProgression: true,
      unlockMessage: 'This arena is sequential: finish the previous day before opening the next one.',
      pricing: {
        ...priceConfig(49, 'TND', 'one-time', ['Podium leaderboard', 'Daily review', 'Final certificate', 'Reward eligibility']),
        participationFee: 49,
        depositRequired: true,
        depositAmount: 15,
        completionReward: 30,
        topPerformerBonus: 75,
        streakBonus: 20,
        isPremium: true,
        premiumFeatures: {
          personalMentoring: true,
          exclusiveResources: true,
          priorityFeedback: true,
          certificate: true,
          liveSessions: true,
          communityAccess: true,
        },
      },
      averageRating: 4.9,
      ratingCount: 24,
      seedKey: SEED_KEY,
      createdAt: now,
      updatedAt: now,
    };
    challengeDocs.push(leaderboardChallenge);
    for (const challenge of challengeDocs) await upsertBy(db, 'challenges', { id: challenge.id }, challenge);

    const leaderboardSubmissionUsers = [
      ['sarra-kefi', 5],
      ['omar-jaziri', 4],
      ['nour-dridi', 4],
      ['karim-mansour', 3],
      ['lina-gharbi', 3],
      ['fares-mejri', 2],
      ['ines-saidi', 2],
      ['aya-mbarek', 4],
      ['salma-mahfoudh', 3],
      ['hatem-ouertani', 2],
      ['malek-chatti', 2],
      ['mehdi-ayari', 1],
      ['rania-belaid', 1],
      ['sami-ben-ali', 1],
      ['dorsaf-nasri', 2],
    ];
    const leaderboardSubmissions = leaderboardSubmissionUsers.flatMap(([username, submittedCount]) => {
      const user = usersByUsername.get(username);
      return leaderboardTasks.slice(0, submittedCount).map((task, taskIndex) => {
        const isLatestPending = taskIndex === submittedCount - 1 && submittedCount < 5;
        return {
          _id: oid(`challenge-submission:${leaderboardId}:${username}:${task.id}`),
          challengeId: leaderboardChallenge._id,
          taskId: task.id,
          userId: user._id,
          content: `${user.name} seeded submission for ${task.title}. Includes notes, evidence, and a clear next step for reviewer testing.`,
          links: [`https://example.com/${username}/${task.id}`],
          files: [asset('submission', `${leaderboardId}-${username}-${task.id}`, taskIndex)],
          status: isLatestPending ? 'pending' : 'approved',
          feedback: isLatestPending ? undefined : 'Approved in the rich demo seed. Points are reflected in the leaderboard.',
          reviewedBy: isLatestPending ? undefined : leaderboardCommunity.createur,
          reviewedAt: isLatestPending ? undefined : new Date(now.getTime() - (submittedCount - taskIndex) * 30 * 60 * 1000),
          pointsAwarded: isLatestPending ? 0 : task.points,
          seedKey: SEED_KEY,
          createdAt: new Date(now.getTime() - (submittedCount - taskIndex + 1) * 60 * 60 * 1000),
          updatedAt: now,
        };
      });
    });
    for (const submission of leaderboardSubmissions) {
      await upsertBy(db, 'challengesubmissions', {
        challengeId: submission.challengeId,
        userId: submission.userId,
        taskId: submission.taskId,
      }, submission);
    }

    const productDocs = Array.from(communitiesBySlug.values()).map((community, index) => {
      const id = `demo-product-${slugify(community.name)}-toolkit`;
      const productPrice = pick([37, 57, 0, 42, 69], index);
      const proPrice = productPrice > 0 ? productPrice + pick([42, 42, 0, 38, 60], index) : 0;
      return {
        _id: oid(`product:${id}`),
        id,
        title: `${community.name} Toolkit`,
        slug: slugify(`${community.name} Toolkit`),
        description: 'A rich digital product with images, files, variants, license terms, and pricing.',
        price: productPrice,
        currency: 'TND',
        communityId: String(community._id),
        creatorId: community.createur,
        isPublished: true,
        inventory: 0,
        sales: 8 + index * 3,
        category: community.category,
        type: 'digital',
        images: [asset('product', id, index), asset('product-gallery', id, index + 1)],
        variants: [
          { id: `${id}-starter`, name: 'Starter', price: productPrice, description: 'Core templates and guide.', inventory: 0, attributes: { access: 'digital' } },
          { id: `${id}-pro`, name: 'Pro', price: proPrice, description: 'Templates plus bonus workshop.', inventory: 0, attributes: { access: 'digital-plus-workshop' } },
        ],
        files: [
          { id: `${id}-file-1`, name: 'Toolkit PDF', url: DOC_URL, type: 'PDF', size: '120 KB', description: 'Seed PDF file.', order: 1, downloadCount: 4, isActive: true, uploadedAt: now },
          { id: `${id}-file-2`, name: 'Demo video', url: VIDEO_URL, type: 'MP4', size: '2 MB', description: 'Seed MP4 file.', order: 2, downloadCount: 2, isActive: true, uploadedAt: now },
          { id: `${id}-file-3`, name: 'Embed preview', url: YOUTUBE_VIDEO_URL, type: 'VIDEO_LINK', size: 'external', thumbnailUrl: YOUTUBE_THUMBNAIL_URL, description: 'Seed YouTube file reference.', order: 3, downloadCount: 1, isActive: true, uploadedAt: now },
        ],
        licenseTerms: 'Personal and educational use. Do not redistribute as a standalone product.',
        features: ['Templates', 'Checklists', 'Demo files', 'Usage guide'],
        pricing: priceConfig(productPrice, 'TND', productPrice > 0 ? 'one-time' : 'free', ['Lifetime access', 'Updates included']),
        averageRating: 4.4 + index * 0.15,
        ratingCount: 7 + index * 6,
        seedKey: SEED_KEY,
        createdAt: now,
        updatedAt: now,
      };
    });
    for (const product of productDocs) await upsertBy(db, 'products', { id: product.id }, product);

    const eventDocs = Array.from(communitiesBySlug.values()).map((community, index) => {
      const id = `demo-event-${slugify(community.name)}-live`;
      const creator = Array.from(usersByUsername.values()).find((user) => String(user._id) === String(community.createur));
      return {
        _id: oid(`event:${id}`),
        id,
        title: `${community.name} Live Workshop`,
        description: 'A complete event with tickets, speakers, sessions, attendees, and pricing.',
        startDate: futureDate(14 + index * 3, 17),
        endDate: futureDate(14 + index * 3, 20),
        startTime: '17:00',
        endTime: '20:00',
        timezone: 'Africa/Tunis',
        location: index === 1 ? 'Tunis Creative Hub' : 'Online',
        onlineUrl: 'https://meet.google.com/demo-chabaqa',
        category: community.category,
        type: index === 1 ? 'Hybrid' : 'Online',
        isActive: true,
        notes: 'Seeded event with sample tickets and attendee records.',
        image: asset('event', id, index),
        replayVideoUrl: VIDEO_URL,
        promoVideoUrl: YOUTUBE_VIDEO_URL,
        promoThumbnailUrl: YOUTUBE_THUMBNAIL_URL,
        attendees: memberUsers.slice(0, 3).map((user, attendeeIndex) => ({
          id: `${id}-attendee-${attendeeIndex + 1}`,
          userId: user._id,
          ticketType: attendeeIndex === 0 ? 'vip' : 'regular',
          registeredAt: now,
          checkedIn: false,
        })),
        tickets: [
          { id: `${id}-ticket-free`, type: 'free', name: 'Community Seat', price: 0, description: 'Included for members.', quantity: 50, sold: 2 },
          { id: `${id}-ticket-vip`, type: 'vip', name: 'VIP Review Seat', price: 49, description: 'Includes live review.', quantity: 10, sold: 1 },
        ],
        pricing: priceConfig(49, 'TND', 'one-time', ['Live workshop', 'Replay', 'Slides']),
        averageRating: 4.6,
        ratingCount: 9,
        speakers: [
          { id: `${id}-speaker-1`, name: creator?.name || 'Demo Creator', title: 'Community Creator', bio: creator?.bio || 'Leads the seeded demo workshop.', photo: creator?.profile_picture || asset('speaker', id, index) },
        ],
        sessions: [
          { id: `${id}-session-1`, title: 'Framework', description: 'The core operating model.', startTime: '17:00', endTime: '18:00', speaker: creator?.name || 'Demo Creator', isActive: true, attendance: 0 },
          { id: `${id}-session-2`, title: 'Implementation Lab', description: 'Hands-on walkthrough.', startTime: '18:15', endTime: '20:00', speaker: 'Community Host', isActive: true, attendance: 0 },
        ],
        communityId: community._id,
        creatorId: community.createur,
        totalRevenue: 49,
        totalAttendees: 3,
        averageAttendance: 0,
        tags: community.tags,
        isPublished: true,
        publishedAt: now,
        reminderSent: false,
        seedKey: SEED_KEY,
        createdAt: now,
        updatedAt: now,
      };
    });
    for (const event of eventDocs) await upsertBy(db, 'events', { id: event.id }, event);

    const sessionDocs = Array.from(communitiesBySlug.values()).map((community, index) => {
      const id = `demo-session-${slugify(community.name)}-clinic`;
      const duration = pick([45, 60, 30, 50, 75], index);
      const sessionPrice = pick([80, 120, 0, 65, 150], index);
      const packagePrice = pick([200, 300, 0, 165, 390], index);
      return {
        _id: oid(`session:${id}`),
        id,
        title: `${community.name} 1:1 Strategy Clinic`,
        description: 'Book a focused one-to-one session with the creator for review, planning, and next steps.',
        thumbnail: asset('session', id, index),
        duration,
        price: sessionPrice,
        currency: 'TND',
        pricing: { ...priceConfig(sessionPrice, 'TND', sessionPrice > 0 ? 'one-time' : 'free', ['Private call', 'Action notes', 'Recording']), packages: [{ name: 'Three-session pack', sessionsCount: 3, price: packagePrice, discount: 15, features: ['Priority booking'] }] },
        averageRating: 4.8,
        ratingCount: 11,
        communityId: String(community._id),
        creatorId: community.createur,
        isActive: true,
        bookings: [
          { id: `${id}-booking-1`, userId: memberUsers[index % memberUsers.length]._id, scheduledAt: futureDate(5 + index, 11), status: 'confirmed', meetingUrl: 'https://meet.google.com/demo-chabaqa', meetStatus: 'created', notes: 'Seed booking.', createdAt: now, updatedAt: now },
        ],
        category: community.category,
        maxBookingsPerWeek: 8,
        notes: 'Seeded session with availability slots.',
        resources: [
          { id: `${id}-resource-1`, title: 'Pre-call worksheet', type: 'pdf', url: DOC_URL, description: 'Prepare before the session.', order: 1 },
          { id: `${id}-resource-2`, title: 'Clinic intro video', type: 'video', url: VIDEO_URL, description: 'Direct MP4 playback check.', order: 2 },
        ],
        recurringAvailability: [
          { id: `${id}-availability-1`, dayOfWeek: 2, startTime: '10:00', endTime: '14:00', slotDuration: 60, isActive: true, createdAt: now },
          { id: `${id}-availability-2`, dayOfWeek: 4, startTime: '15:00', endTime: '18:00', slotDuration: 60, isActive: true, createdAt: now },
        ],
        availableSlots: [1, 2, 3].map((n) => ({ id: `${id}-slot-${n}`, startTime: futureDate(7 + n + index, 9 + n), endTime: futureDate(7 + n + index, 10 + n), isAvailable: true, createdAt: now })),
        autoGenerateSlots: true,
        advanceBookingDays: 45,
        seedKey: SEED_KEY,
        createdAt: now,
        updatedAt: now,
      };
    });
    for (const session of sessionDocs) await upsertBy(db, 'sessions', { id: session.id }, session);

    const postDocs = Array.from(communitiesBySlug.values()).flatMap((community, index) => {
      return [0, 1, 2].map((postIndex) => {
        const id = `demo-post-${slugify(community.name)}-${postIndex + 1}`;
        const author = postIndex === 0 ? usersByUsername.get(communityBlueprints[index].creator) : memberUsers[(index + postIndex) % memberUsers.length];
        return {
          _id: oid(`post:${id}`),
          id,
          title: ['Welcome and Start Here', 'Weekly Wins Thread', 'Resource Drop'][postIndex],
          content: [
            `Welcome to ${community.name}. Use this thread to introduce yourself and choose your first course.`,
            'Share one win, one blocker, and one thing you are shipping this week.',
            'Here are reusable assets, links, and screenshots for this week’s implementation sprint.',
          ][postIndex],
          excerpt: 'Seeded community post with comments, reactions, images, and links.',
          thumbnail: asset('post', id, postIndex + index),
          communityId: String(community._id),
          authorId: author._id,
          isPublished: true,
          likes: 3 + postIndex,
          shareCount: 1,
          comments: memberUsers.slice(0, 2).map((user, commentIndex) => ({ id: `${id}-comment-${commentIndex + 1}`, content: 'This is helpful. I am using it for my current sprint.', userId: user._id, createdAt: now, updatedAt: now })),
          tags: community.tags.slice(0, 3),
          likedBy: memberUsers.slice(0, 3).map((user) => user._id),
          sharedBy: [memberUsers[0]._id],
          bookmarks: [memberUsers[1]._id],
          reactions: [{ emoji: '🔥', userIds: memberUsers.slice(0, 2).map((user) => user._id) }],
          isPinned: postIndex === 0,
          pinnedAt: postIndex === 0 ? now : undefined,
          mentionedUserIds: [community.createur],
          images: [asset('post-image', id, postIndex)],
          videos: postIndex === 2 ? [VIDEO_URL, YOUTUBE_VIDEO_URL] : [],
          links: [{ url: DOC_URL, title: 'Demo PDF', description: 'A working linked resource.', thumbnail: asset('link', id, postIndex) }],
          pricing: priceConfig(0, 'TND', 'free', []),
          seedKey: SEED_KEY,
          createdAt: now,
          updatedAt: now,
        };
      });
    });
    for (const post of postDocs) await upsertBy(db, 'posts', { id: post.id }, post);

    const resourceDocs = Array.from(communitiesBySlug.values()).flatMap((community, index) => {
      const author = Array.from(usersByUsername.values()).find((user) => String(user._id) === String(community.createur));
      const items = [
        ['Article', 'Launch Checklist Article'],
        ['Video', 'Workshop Replay Video'],
        ['Guide', 'Implementation Playbook Guide'],
      ];
      return items.map(([type, title], resourceIndex) => {
        const slug = slugify(`${community.name} ${title}`);
        const base = {
          _id: oid(`resource:${slug}`),
          titre: `${community.name}: ${title}`,
          slug,
          description: 'A rich resource with typed content, images, premium metadata, and community attachment.',
          type,
          readTime: type === 'Video' ? '12 min' : '8 min',
          category: index === 1 ? 'Design' : index === 2 ? 'Technique' : 'Business',
          author: community.createur,
          authorName: author?.name || 'Demo Creator',
          communityId: community._id,
          thumbnailUrl: asset('resource-thumb', slug, resourceIndex),
          coverImageUrl: asset('resource-cover', slug, resourceIndex + 1),
          isPublished: true,
          isFeature: resourceIndex === 0,
          isPremium: resourceIndex === 2,
          pricing: priceConfig(resourceIndex === 2 ? 19 : 0, 'TND', resourceIndex === 2 ? 'one-time' : 'free', ['Structured walkthrough', 'Examples']),
          viewsCount: 120 + resourceIndex * 40,
          likesCount: 12 + resourceIndex * 3,
          sharesCount: 4 + resourceIndex,
          commentsCount: 2,
          rating: 4.5 + resourceIndex * 0.1,
          tags: community.tags,
          publishedAt: now,
          seedKey: SEED_KEY,
          createdAt: now,
          updatedAt: now,
        };
        if (type === 'Video') {
          base.content = {
            videoUrl: VIDEO_URL,
            embedVideoUrl: YOUTUBE_VIDEO_URL,
            thumbnailUrl: asset('resource-video', slug, resourceIndex),
            embedThumbnailUrl: YOUTUBE_THUMBNAIL_URL,
            duration: 720,
            quality: 'HD',
            subtitles: [],
            videoMetadata: { resolution: '1280x720', codec: 'h264', frameRate: 30 },
            description: [{ type: 'text', content: 'Watch the full workshop replay and follow the steps.', order: 1, isVisible: true, createdAt: now, updatedAt: now }],
            chapters: ['00:00 Intro', '03:00 Workflow', '09:00 Recap'],
          };
        } else if (type === 'Guide') {
          base.content = {
            introduction: [{ type: 'text', content: 'Use this guide as a step-by-step reference.', order: 1, isVisible: true, createdAt: now, updatedAt: now }],
            sections: [
              { title: 'Setup', description: 'Prepare your workspace.', order: 1, isVisible: true, createdAt: now, updatedAt: now, elements: [{ type: 'text', content: 'Create your project folder and success metric.', order: 1, isVisible: true, createdAt: now, updatedAt: now }] },
              { title: 'Execution', description: 'Ship the first version.', order: 2, isVisible: true, createdAt: now, updatedAt: now, elements: [{ type: 'link', content: DOC_URL, title: 'Worksheet', order: 1, isVisible: true, createdAt: now, updatedAt: now }] },
            ],
            conclusion: [{ type: 'quote', content: 'Progress is clearer when the next action is small.', order: 1, isVisible: true, createdAt: now, updatedAt: now }],
            guideMetadata: { difficulty: 'Débutant', prerequisites: ['Community membership'], learningOutcomes: ['Plan', 'Execute', 'Review'], tools: ['Chabaqa'], resources: [DOC_URL] },
          };
        } else {
          base.content = {
            excerpt: 'A concise article for fast implementation.',
            tags: community.tags,
            seoMetadata: { metaTitle: `${community.name} ${title}`, metaDescription: base.description, keywords: community.tags },
            elements: [
              { type: 'text', content: 'Start with the outcome, then map the steps backward.', title: 'Core Idea', order: 1, isVisible: true, createdAt: now, updatedAt: now },
              { type: 'image', content: asset('article-inline', slug, resourceIndex), alt: 'Workspace screenshot', caption: 'Example workspace', order: 2, isVisible: true, createdAt: now, updatedAt: now },
            ],
          };
        }
        return base;
      });
    });
    for (const resource of resourceDocs) await upsertBy(db, 'resources', { slug: resource.slug }, resource);

    const allContent = [
      ...courses.map((doc) => ['course', doc.id, doc]),
      ...challengeDocs.map((doc) => ['challenge', doc.id, doc]),
      ...eventDocs.map((doc) => ['event', doc.id, doc]),
      ...sessionDocs.map((doc) => ['session', doc.id, doc]),
      ...productDocs.map((doc) => ['product', doc.id, doc]),
      ...postDocs.map((doc) => ['post', doc.id, doc]),
      ...resourceDocs.map((doc) => ['resource', doc.slug, doc]),
      ...Array.from(communitiesBySlug.values()).map((doc) => ['community', doc.slug, doc]),
    ];

    const trackingActions = [];
    let contentProgressRows = 0;
    let completedProgressRows = 0;
    for (const [userIndex, user] of memberUsers.entries()) {
      for (let contentIndex = 0; contentIndex < allContent.length; contentIndex += 1) {
        const [type, contentId, doc] = allContent[contentIndex];
        const profile = progressProfile(user, userIndex, type, contentId, doc, contentIndex, now);
        contentProgressRows += 1;
        if (profile.isCompleted) completedProgressRows += 1;
        await upsertBy(db, 'contentprogresses', {
          userId: user._id,
          contentId,
          contentType: type,
          seedKey: SEED_KEY,
        }, {
          _id: oid(`progress:${user.username}:${type}:${contentId}`),
          id: `demo-progress-${user.username}-${type}-${contentId}`,
          userId: user._id,
          contentId,
          contentType: type,
          isCompleted: profile.isCompleted,
          watchTime: profile.watchTime,
          rating: profile.rating,
          review: profile.review,
          completedAt: profile.completedAt,
          lastAccessedAt: profile.lastAccessedAt,
          bookmarks: profile.bookmarks,
          viewCount: profile.viewCount,
          likeCount: profile.likeCount,
          shareCount: profile.shareCount,
          downloadCount: profile.downloadCount,
          metadata: profile.metadata,
          seedKey: SEED_KEY,
          createdAt: now,
          updatedAt: now,
        });
        trackingActions.push(...buildTrackingActions(user, type, contentId, profile));
      }
    }
    if (trackingActions.length) {
      await db.collection('trackingactions').insertMany(trackingActions, { ordered: false });
    }

    const paidOrders = [];
    let orderIndex = 0;
    for (let contentIndex = 0; contentIndex < allContent.length; contentIndex += 1) {
      const [type, contentId, doc] = allContent[contentIndex];
      if (!contentPrice(type, doc)) continue;
      const purchaseCount = contentPrice(type, doc) >= 100 ? 3 : 2;
      for (let purchaseIndex = 0; purchaseIndex < purchaseCount; purchaseIndex += 1) {
        const buyer = memberUsers[(contentIndex + purchaseIndex * 3) % memberUsers.length];
        orderIndex += 1;
        paidOrders.push(buildOrderDoc(buyer, type, contentId, doc, orderIndex, now));
      }
    }
    for (const order of paidOrders) {
      await upsertBy(db, 'orders', { paymentId: order.paymentId }, order);
      if (order.status === 'paid' && order.contentType === 'product') {
        await db.collection('users').updateOne(
          { _id: order.buyerId },
          { $addToSet: { purchasedProducts: order.contentId }, $set: { updatedAt: now } },
        );
      }
    }

    const analyticsDailyRows = buildAnalyticsDailyRows(allContent, paidOrders, now);
    if (analyticsDailyRows.length) {
      await db.collection('analyticsdailies').insertMany(analyticsDailyRows, { ordered: false });
    }

    console.log(JSON.stringify({
      ok: true,
      seedKey: SEED_KEY,
      passwordForSeedUsers: PASSWORD,
      mediaLibrary: MEDIA_LIBRARY,
      counts: {
        admins: adminDocs.length,
        rbacAdminUsers: 1,
        users: userBlueprints.length,
        communities: communityBlueprints.length,
        courses: courses.length,
        enrollments: enrollments.length,
        challenges: challengeDocs.length,
        events: eventDocs.length,
        sessions: sessionDocs.length,
        products: productDocs.length,
        posts: postDocs.length,
        resources: resourceDocs.length,
        contentProgressRows,
        completedProgressRows,
        trackingActions: trackingActions.length,
        analyticsDailyRows: analyticsDailyRows.length,
        orders: paidOrders.length,
        paidOrders: paidOrders.filter((order) => order.status === 'paid').length,
        pendingVerificationOrders: paidOrders.filter((order) => order.status === 'pending_verification').length,
        refundedOrders: paidOrders.filter((order) => order.status === 'refunded').length,
      },
      accounts: {
        password: PASSWORD,
        admins: ADMIN_BLUEPRINTS.map(({ email, username }) => ({ username, email, role: 'admin' })),
        creators: userBlueprints.filter(([, , , role]) => role === 'creator').map(([, username, email, role]) => ({ username, email, role })),
        members: userBlueprints.filter(([, , , role]) => role === 'user').map(([, username, email, role]) => ({ username, email, role })),
      },
    }, null, 2));
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error('[ERROR]', error);
  process.exit(1);
});
