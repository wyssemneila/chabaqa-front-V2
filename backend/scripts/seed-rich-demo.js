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
const DOC_URL = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

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

function futureDate(days, hour = 10) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
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
  ['Sarra Kefi', 'sarra-kefi', 'sarra.member@chabaqa.demo', 'user', 'Tunis', 'Marketing specialist learning community building.'],
  ['Omar Jaziri', 'omar-jaziri', 'omar.member@chabaqa.demo', 'user', 'Sfax', 'Frontend developer building portfolio projects.'],
  ['Nour Dridi', 'nour-dridi', 'nour.member@chabaqa.demo', 'user', 'Nabeul', 'Designer interested in productized services.'],
  ['Karim Mansour', 'karim-mansour', 'karim.member@chabaqa.demo', 'user', 'Monastir', 'Founder testing paid education offers.'],
  ['Lina Gharbi', 'lina-gharbi', 'lina.member@chabaqa.demo', 'user', 'Tunis', 'Student practicing analytics and content systems.'],
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
  },
  {
    name: 'Motion School Lab',
    category: 'Creative Arts',
    creator: 'youssef-haddad',
    priceType: 'one-time',
    price: 97,
    tags: ['Motion Design', 'After Effects', 'Animation', 'Portfolio'],
    description: 'Hands-on motion design practice with courses, critiques, challenges, and reusable production templates.',
  },
  {
    name: 'Data Operators Guild',
    category: 'Technology',
    creator: 'meriem-ben-salah',
    priceType: 'free',
    price: 0,
    tags: ['Data', 'Dashboards', 'Automation', 'Analytics'],
    description: 'A builder community for analysts and operators shipping dashboards, automations, and repeatable reporting systems.',
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
      description: `Focused module for ${sectionTitle.toLowerCase()}.`,
      courseId,
      ordre: sectionIndex + 1,
      createdAt: new Date(),
      chapitres: chapters.map((chapterTitle, chapterIndex) => {
        const order = sectionIndex * 10 + chapterIndex + 1;
        return {
          id: `${courseId}-chapter-${order}`,
          titre: chapterTitle,
          contenu: `In this lesson, students follow a practical workflow for ${chapterTitle.toLowerCase()} with examples, checkpoints, and implementation notes.`,
          videoUrl: VIDEO_URL,
          duree: 4 + chapterIndex + sectionIndex,
          sectionId,
          ordre: chapterIndex + 1,
          isPreview: order === 1,
          prix: order > 1 && blueprint.price > 0 ? 19 : 0,
          isPaidChapter: order > 1 && blueprint.price > 0,
          notes: 'Seeded lesson with working remote MP4 demo video. Progress starts at zero.',
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
    description: `A complete practical course for ${blueprint.category.toLowerCase()} with video lessons, worksheets, paid/free chapter states, and a clean zero-progress enrollment baseline.`,
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
      'Progress tracking from zero',
    ]),
    isPublished: true,
    sections,
    inscriptions: [],
    category: blueprint.category,
    niveau: blueprint.level,
    duree: `${sections.reduce((sum, section) => sum + section.chapitres.reduce((s, c) => s + c.duree, 0), 0)} min`,
    learningObjectives: ['Ship a practical project', 'Follow a repeatable workflow', 'Understand common mistakes', 'Build a reusable asset'],
    requirements: ['Basic computer skills', 'A willingness to practice', 'Access to the community workspace'],
    notes: `Seeded by ${SEED_KEY}. Course progression intentionally starts at 0 for every enrollment.`,
    ressources: [
      { id: `${courseId}-resource-1`, titre: 'Course workbook', type: 'pdf', url: DOC_URL, description: 'Full course workbook.', ordre: 1 },
      { id: `${courseId}-resource-2`, titre: 'Example video', type: 'video', url: VIDEO_URL, description: 'Working MP4 demo asset.', ordre: 2 },
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
      db.collection('communities').deleteMany({ slug: { $in: communityBlueprints.map((community) => slugify(community.name)) } }),
      db.collection('cours').deleteMany({ id: /^demo-course-/ }),
      db.collection('courseenrollments').deleteMany({ id: /^demo-enrollment-/ }),
      db.collection('contentprogresses').deleteMany({ seedKey: SEED_KEY }),
      db.collection('challenges').deleteMany({ id: /^demo-challenge-/ }),
      db.collection('events').deleteMany({ id: /^demo-event-/ }),
      db.collection('sessions').deleteMany({ id: /^demo-session-/ }),
      db.collection('products').deleteMany({ id: /^demo-product-/ }),
      db.collection('posts').deleteMany({ id: /^demo-post-/ }),
      db.collection('resources').deleteMany({ seedKey: SEED_KEY }),
      db.collection('orders').deleteMany({ seedKey: SEED_KEY }),
    ]);

    const now = new Date();
    const usersByUsername = new Map();
    for (const [name, username, email, role, ville, bio] of userBlueprints) {
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
        numtel: `+216 2${Math.floor(1000000 + Math.random() * 8999999)}`,
        date_naissance: new Date('1996-01-15T00:00:00.000Z'),
        sexe: username.endsWith('a') || username.includes('amina') || username.includes('sarra') || username.includes('nour') || username.includes('lina') ? 'female' : 'male',
        pays: 'Tunisie',
        ville,
        code_postal: '1000',
        adresse: `${ville} Creative District`,
        photo_profil: asset('avatar', username, userBlueprints.findIndex((row) => row[1] === username)),
        profile_picture: asset('profile', username, userBlueprints.findIndex((row) => row[1] === username)),
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

    const communitiesBySlug = new Map();
    for (let index = 0; index < communityBlueprints.length; index += 1) {
      const blueprint = communityBlueprints[index];
      const slug = slugify(blueprint.name);
      const creator = usersByUsername.get(blueprint.creator);
      const members = Array.from(usersByUsername.values()).map((user) => user._id);
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
          { type: 'image', title: 'Workspace', content: asset('community-long', slug, index + 2), order: 2 },
          { type: 'video', title: 'Welcome Video', content: VIDEO_URL, order: 3 },
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
          primaryColor: ['#155e75', '#7c2d12', '#166534'][index],
          secondaryColor: ['#cffafe', '#ffedd5', '#dcfce7'][index],
          welcomeMessage: `Welcome to ${blueprint.name}. Start with the pinned post, then pick a course.`,
          features: ['Courses', 'Events', 'Challenges', 'Sessions', 'Products', 'Resources'],
          benefits: ['Clear practice path', 'Peer support', 'Creator feedback', 'Reusable assets'],
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
          socialLinks: { instagram: `https://instagram.com/${slug}`, linkedin: `https://linkedin.com/company/${slug}` },
          customSections: [
            { id: 1, type: 'text', title: 'Start Here', content: 'Enroll in a course, join a challenge, book a session, or download a resource.', visible: true },
          ],
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
    for (const user of memberUsers) {
      for (const course of courses) {
        const enrollment = {
          _id: oid(`enrollment:${user.username}:${course.id}`),
          id: `demo-enrollment-${user.username}-${course.id}`,
          userId: user._id,
          courseId: course._id,
          progression: [],
          purchasedChapterIds: [],
          enrolledAt: now,
          isActive: true,
          seedKey: SEED_KEY,
          createdAt: now,
          updatedAt: now,
        };
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
        participants: memberUsers.map((user) => ({
          id: `demo-participant-${id}-${user.username}`,
          userId: user._id,
          joinedAt: now,
          isActive: true,
          progress: 0,
          totalPoints: 0,
          completedTasks: [],
          lastActivityAt: now,
        })),
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
        notes: 'Seeded challenge with all participant progress at zero.',
        resources: [
          { id: `${id}-resource-1`, title: 'Sprint guide', type: 'pdf', url: DOC_URL, description: 'Challenge workbook.', order: 1 },
          { id: `${id}-resource-2`, title: 'Kickoff replay', type: 'video', url: VIDEO_URL, description: 'Working MP4 demo.', order: 2 },
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
    for (const challenge of challengeDocs) await upsertBy(db, 'challenges', { id: challenge.id }, challenge);

    const productDocs = Array.from(communitiesBySlug.values()).map((community, index) => {
      const id = `demo-product-${slugify(community.name)}-toolkit`;
      return {
        _id: oid(`product:${id}`),
        id,
        title: `${community.name} Toolkit`,
        slug: slugify(`${community.name} Toolkit`),
        description: 'A rich digital product with images, files, variants, license terms, and pricing.',
        price: [37, 57, 0][index],
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
          { id: `${id}-starter`, name: 'Starter', price: [37, 57, 0][index], description: 'Core templates and guide.', inventory: 0, attributes: { access: 'digital' } },
          { id: `${id}-pro`, name: 'Pro', price: [79, 99, 0][index], description: 'Templates plus bonus workshop.', inventory: 0, attributes: { access: 'digital-plus-workshop' } },
        ],
        files: [
          { id: `${id}-file-1`, name: 'Toolkit PDF', url: DOC_URL, type: 'PDF', size: '120 KB', description: 'Seed PDF file.', order: 1, downloadCount: 4, isActive: true, uploadedAt: now },
          { id: `${id}-file-2`, name: 'Demo video', url: VIDEO_URL, type: 'MP4', size: '2 MB', description: 'Seed MP4 file.', order: 2, downloadCount: 2, isActive: true, uploadedAt: now },
        ],
        licenseTerms: 'Personal and educational use. Do not redistribute as a standalone product.',
        features: ['Templates', 'Checklists', 'Demo files', 'Usage guide'],
        pricing: priceConfig([37, 57, 0][index], 'TND', [37, 57, 0][index] > 0 ? 'one-time' : 'free', ['Lifetime access', 'Updates included']),
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
          { id: `${id}-speaker-1`, name: 'Amina Trabelsi', title: 'Creator Educator', bio: 'Helps creators design paid learning experiences.', photo: asset('speaker', id, index) },
        ],
        sessions: [
          { id: `${id}-session-1`, title: 'Framework', description: 'The core operating model.', startTime: '17:00', endTime: '18:00', speaker: 'Amina Trabelsi', isActive: true, attendance: 0 },
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
      return {
        _id: oid(`session:${id}`),
        id,
        title: `${community.name} 1:1 Strategy Clinic`,
        description: 'Book a focused one-to-one session with the creator for review, planning, and next steps.',
        thumbnail: asset('session', id, index),
        duration: [45, 60, 30][index],
        price: [80, 120, 0][index],
        currency: 'TND',
        pricing: { ...priceConfig([80, 120, 0][index], 'TND', [80, 120, 0][index] > 0 ? 'one-time' : 'free', ['Private call', 'Action notes', 'Recording']), packages: [{ name: 'Three-session pack', sessionsCount: 3, price: [200, 300, 0][index], discount: 15, features: ['Priority booking'] }] },
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
        resources: [{ id: `${id}-resource-1`, title: 'Pre-call worksheet', type: 'pdf', url: DOC_URL, description: 'Prepare before the session.', order: 1 }],
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
          videos: postIndex === 2 ? [VIDEO_URL] : [],
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
            thumbnailUrl: asset('resource-video', slug, resourceIndex),
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

    for (const user of memberUsers) {
      for (const [type, contentId] of allContent) {
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
          isCompleted: false,
          watchTime: 0,
          rating: 0,
          lastAccessedAt: now,
          bookmarks: [],
          viewCount: 0,
          likeCount: 0,
          shareCount: 0,
          downloadCount: 0,
          metadata: type === 'course' ? { progressPercent: 0, completedChapters: 0, totalChapters: courses.find((c) => c.id === contentId)?.sections.reduce((sum, s) => sum + s.chapitres.length, 0) || 0 } : { progressPercent: 0 },
          seedKey: SEED_KEY,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    const paidOrders = [];
    for (const product of productDocs.filter((p) => p.price > 0)) {
      paidOrders.push({
        _id: oid(`order:${memberUsers[0].username}:product:${product.id}`),
        buyerId: memberUsers[0]._id,
        creatorId: product.creatorId,
        communityId: new ObjectId(product.communityId),
        contentType: 'product',
        contentId: product.id,
        amountDT: product.price,
        platformPercent: 10,
        platformFixedDT: 1,
        platformFeeDT: Math.round((product.price * 0.1 + 1) * 100) / 100,
        creatorNetDT: Math.round((product.price - (product.price * 0.1 + 1)) * 100) / 100,
        paymentId: `demo-paid-product-${product.id}`,
        paymentMethod: 'offline',
        status: 'paid',
        metadata: { seedKey: SEED_KEY, note: 'Demo paid product order' },
        seedKey: SEED_KEY,
        createdAt: now,
        updatedAt: now,
      });
    }
    for (const order of paidOrders) await upsertBy(db, 'orders', { paymentId: order.paymentId }, order);

    console.log(JSON.stringify({
      ok: true,
      seedKey: SEED_KEY,
      passwordForSeedUsers: PASSWORD,
      counts: {
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
        zeroProgressRows: memberUsers.length * allContent.length,
        paidOrders: paidOrders.length,
      },
      logins: userBlueprints.map(([, username, email, role]) => ({ username, email, role })),
    }, null, 2));
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error('[ERROR]', error);
  process.exit(1);
});
