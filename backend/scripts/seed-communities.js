#!/usr/bin/env node

const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
require('dotenv').config({ path: path.join(__dirname, '../.env.local-db'), override: true, quiet: true });

function resolveDbName(uri) {
  if (process.env.DB_NAME) return process.env.DB_NAME;

  try {
    const url = new URL(uri);
    const pathName = (url.pathname || '').replace(/^\/+/, '');
    if (!pathName) return 'chabaqa_local';
    return pathName.split('/')[0];
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

function makeInviteCode(seed) {
  const cleaned = slugify(seed).replace(/-/g, '').toUpperCase();
  return `${cleaned.slice(0, 8)}${String(cleaned.length).padStart(4, '0')}`;
}

function makeTypedAsset(kind, slug) {
  return `typed-${kind}-${slug}`;
}

const communityBlueprints = [
  {
    name: 'AI Founders Circle Tunisia',
    category: 'Business',
    country: 'Tunisie',
    status: 'private',
    currency: 'USD',
    priceType: 'monthly',
    price: 24,
    recurringInterval: 'month',
    isRecurring: true,
    feeAmount: 24,
    featured: true,
    verified: true,
    rating: 4.8,
    ratingCount: 34,
    stats: { totalRevenue: 4200, monthlyGrowth: 18, engagementRate: 82, retentionRate: 91 },
    membersCount: 1,
    tags: ['AI', 'Startups', 'Fundraising', 'B2B SaaS'],
    socialLinks: { linkedin: 'https://linkedin.com/company/ai-founders-circle-tn', website: 'https://aifounderscircle.tn' },
    shortDescription: 'A private peer group for Tunisian founders building AI-first startups and raising with clarity.',
    longDescription: 'AI Founders Circle Tunisia brings together ambitious founders who are validating products, building AI workflows, and preparing for repeatable growth. Members get structured feedback, founder-only strategy calls, and implementation playbooks for pricing, hiring, and fundraising.',
    features: ['Monthly founder roundtable', 'AI GTM teardown sessions', 'Investor prep templates', 'Private deal flow discussions'],
    benefits: ['Faster decision-making', 'Direct founder feedback', 'Reusable operating templates', 'High-signal network'],
    trialFeatures: ['Access to one live session', 'Community discussion previews'],
    limits: { maxMembers: 120, maxCourses: 12, maxPosts: 400, storageLimit: '25GB' },
    paymentOptions: { allowInstallments: false, earlyBirdDiscount: 10, memberDiscount: 5 },
    freeTrialDays: 7,
  },
  {
    name: 'Brand Builders Lab Maghreb',
    category: 'Marketing',
    country: 'Tunisie',
    status: 'public',
    currency: 'EUR',
    priceType: 'one-time',
    price: 79,
    isRecurring: false,
    feeAmount: 79,
    featured: true,
    verified: false,
    rating: 4.6,
    ratingCount: 27,
    stats: { totalRevenue: 3100, monthlyGrowth: 12, engagementRate: 76, retentionRate: 84 },
    membersCount: 1,
    tags: ['Brand Strategy', 'Positioning', 'Content Systems', 'Creative Direction'],
    socialLinks: { instagram: 'https://instagram.com/brandbuilderslabmaghreb', behance: 'https://behance.net/brandbuilderslabmaghreb' },
    shortDescription: 'A hands-on branding community for freelancers, consultants, and in-house marketers across the Maghreb.',
    longDescription: 'Brand Builders Lab Maghreb helps members sharpen positioning, build visual systems, and produce stronger campaign creative. The community mixes critique sessions, templates, and examples from regional businesses that need clearer brand differentiation.',
    features: ['Brand audit templates', 'Monthly live critique', 'Messaging workshop replays', 'Creative brief library'],
    benefits: ['Sharper positioning', 'Faster campaign approvals', 'Reusable client assets', 'Higher perceived value'],
    trialFeatures: [],
    limits: { maxMembers: 500, maxCourses: 20, maxPosts: 900, storageLimit: '15GB' },
    paymentOptions: { allowInstallments: true, installmentCount: 3, earlyBirdDiscount: 15, groupDiscount: 12 },
    freeTrialDays: 0,
  },
  {
    name: 'Data Science Sprint Club',
    category: 'Technology',
    country: 'Tunisie',
    status: 'public',
    currency: 'TND',
    priceType: 'free',
    price: 0,
    isRecurring: false,
    feeAmount: 0,
    featured: false,
    verified: true,
    rating: 4.7,
    ratingCount: 41,
    stats: { totalRevenue: 0, monthlyGrowth: 25, engagementRate: 88, retentionRate: 86 },
    membersCount: 1,
    tags: ['Data Science', 'Python', 'ML', 'Portfolio Projects'],
    socialLinks: { linkedin: 'https://linkedin.com/company/data-science-sprint-club', github: 'https://github.com/data-science-sprint-club' },
    shortDescription: 'A free builder community for analysts and aspiring data scientists shipping real portfolio projects.',
    longDescription: 'Data Science Sprint Club is designed for people who learn fastest by doing. Members work through short practical sprints, peer review notebooks, and share reusable datasets, dashboards, and model retrospectives.',
    features: ['Weekly project sprint', 'Notebook reviews', 'Dataset vault', 'Peer accountability threads'],
    benefits: ['Consistent portfolio progress', 'Faster feedback loops', 'Real-world practice', 'Supportive accountability'],
    trialFeatures: [],
    limits: { maxMembers: 2000, maxCourses: 40, maxPosts: 2500, storageLimit: '30GB' },
    paymentOptions: { allowInstallments: false },
    freeTrialDays: 0,
  },
  {
    name: 'Mobile Makers Pro',
    category: 'Technology',
    country: 'Tunisie',
    status: 'private',
    currency: 'USD',
    priceType: 'yearly',
    price: 199,
    recurringInterval: 'year',
    isRecurring: true,
    feeAmount: 199,
    featured: false,
    verified: true,
    rating: 4.9,
    ratingCount: 19,
    stats: { totalRevenue: 5100, monthlyGrowth: 9, engagementRate: 79, retentionRate: 94 },
    membersCount: 1,
    tags: ['React Native', 'Flutter', 'Mobile Product', 'Subscriptions'],
    socialLinks: { github: 'https://github.com/mobile-makers-pro', twitter: 'https://twitter.com/mobilemakerspro' },
    shortDescription: 'An advanced mobile product community for creators building subscription-based iOS and Android apps.',
    longDescription: 'Mobile Makers Pro focuses on shipping polished mobile products with strong onboarding, monetization, and release discipline. Members get architecture walkthroughs, launch checklists, and technical sessions centered on app growth.',
    features: ['Quarterly roadmap clinic', 'App launch checklist', 'Mobile architecture office hours', 'Monetization teardown library'],
    benefits: ['Cleaner mobile architecture', 'Better release confidence', 'Stronger monetization decisions', 'Closer founder support'],
    trialFeatures: ['Access to one replay'],
    limits: { maxMembers: 90, maxCourses: 18, maxPosts: 300, storageLimit: '40GB' },
    paymentOptions: { allowInstallments: true, installmentCount: 4, memberDiscount: 8 },
    freeTrialDays: 5,
  },
  {
    name: 'Growth Operators Network',
    category: 'Business',
    country: 'Tunisie',
    status: 'public',
    currency: 'EUR',
    priceType: 'monthly',
    price: 49,
    recurringInterval: 'month',
    isRecurring: true,
    feeAmount: 49,
    featured: true,
    verified: false,
    rating: 4.5,
    ratingCount: 22,
    stats: { totalRevenue: 2800, monthlyGrowth: 14, engagementRate: 73, retentionRate: 80 },
    membersCount: 1,
    tags: ['Growth', 'Operations', 'RevOps', 'Dashboards'],
    socialLinks: { instagram: 'https://instagram.com/growthoperatorsnetwork', linkedin: 'https://linkedin.com/company/growthoperatorsnetwork' },
    shortDescription: 'A systems-first community for operators building reliable growth engines and revenue dashboards.',
    longDescription: 'Growth Operators Network helps founders and operators document funnel assumptions, instrument metrics, and improve weekly execution. The focus is less on hacks and more on repeatable operating cadence.',
    features: ['Weekly KPI review', 'Ops scorecard templates', 'Retention playbooks', 'Live funnel debug sessions'],
    benefits: ['Cleaner reporting', 'More accountability', 'Stronger growth habits', 'Cross-functional clarity'],
    trialFeatures: ['Template sampler'],
    limits: { maxMembers: 300, maxCourses: 15, maxPosts: 1200, storageLimit: '20GB' },
    paymentOptions: { allowInstallments: false, earlyBirdDiscount: 20, groupDiscount: 10 },
    freeTrialDays: 10,
  },
  {
    name: 'Cloud DevOps Mastermind',
    category: 'Technology',
    country: 'Tunisie',
    status: 'private',
    currency: 'USD',
    priceType: 'one-time',
    price: 149,
    isRecurring: false,
    feeAmount: 149,
    featured: false,
    verified: true,
    rating: 4.8,
    ratingCount: 16,
    stats: { totalRevenue: 2400, monthlyGrowth: 11, engagementRate: 81, retentionRate: 89 },
    membersCount: 1,
    tags: ['DevOps', 'Cloud', 'Kubernetes', 'CI/CD'],
    socialLinks: { github: 'https://github.com/cloud-devops-mastermind', linkedin: 'https://linkedin.com/company/cloud-devops-mastermind' },
    shortDescription: 'A serious implementation space for engineers standardizing CI/CD, observability, and cloud delivery.',
    longDescription: 'Cloud DevOps Mastermind is for engineers who want less theory and more operational reliability. Members share deployment patterns, incident lessons, and practical infrastructure templates across AWS, Azure, and GCP workflows.',
    features: ['Infra review sessions', 'Runbook templates', 'Incident debrief library', 'Platform office hours'],
    benefits: ['More reliable deployments', 'Better cloud hygiene', 'Reusable infra patterns', 'Stronger operational judgment'],
    trialFeatures: [],
    limits: { maxMembers: 150, maxCourses: 25, maxPosts: 700, storageLimit: '50GB' },
    paymentOptions: { allowInstallments: true, installmentCount: 2, earlyBirdDiscount: 10 },
    freeTrialDays: 0,
  },
  {
    name: 'Content Systems Studio',
    category: 'Creative Arts',
    country: 'Tunisie',
    status: 'public',
    currency: 'TND',
    priceType: 'monthly',
    price: 35,
    recurringInterval: 'month',
    isRecurring: true,
    feeAmount: 35,
    featured: false,
    verified: false,
    rating: 4.4,
    ratingCount: 18,
    stats: { totalRevenue: 1600, monthlyGrowth: 17, engagementRate: 77, retentionRate: 78 },
    membersCount: 1,
    tags: ['Content Strategy', 'Writing', 'Editorial Systems', 'Freelancing'],
    socialLinks: { instagram: 'https://instagram.com/contentsystemsstudio', linkedin: 'https://linkedin.com/company/contentsystemsstudio' },
    shortDescription: 'A practical writing and content strategy community for creators building repeatable editorial systems.',
    longDescription: 'Content Systems Studio helps members turn inconsistent publishing into a calm, repeatable system. The community covers topic selection, editorial workflows, repurposing, and content offers that support real business goals.',
    features: ['Editorial calendar templates', 'Weekly content office hours', 'Feedback on hooks and angles', 'Repurposing workflows'],
    benefits: ['Better publishing consistency', 'More useful content output', 'Cleaner editorial process', 'Stronger positioning'],
    trialFeatures: ['Weekly prompt pack'],
    limits: { maxMembers: 450, maxCourses: 10, maxPosts: 1300, storageLimit: '12GB' },
    paymentOptions: { allowInstallments: false, groupDiscount: 15 },
    freeTrialDays: 14,
  },
  {
    name: 'Accessibility UX Guild',
    category: 'Design',
    country: 'Tunisie',
    status: 'private',
    currency: 'EUR',
    priceType: 'yearly',
    price: 129,
    recurringInterval: 'year',
    isRecurring: true,
    feeAmount: 129,
    featured: true,
    verified: true,
    rating: 5,
    ratingCount: 12,
    stats: { totalRevenue: 2900, monthlyGrowth: 8, engagementRate: 85, retentionRate: 96 },
    membersCount: 1,
    tags: ['Accessibility', 'UX Research', 'Design Systems', 'Inclusive Design'],
    socialLinks: { linkedin: 'https://linkedin.com/company/accessibility-ux-guild', twitter: 'https://twitter.com/accessibilityuxguild' },
    shortDescription: 'A focused guild for designers and researchers building accessible digital experiences from day one.',
    longDescription: 'Accessibility UX Guild exists for teams that want accessibility integrated into discovery, design systems, and product delivery rather than treated as a late-stage checklist. Members get critique, standards guidance, and implementation examples.',
    features: ['Accessible design reviews', 'Pattern library examples', 'Research synthesis sessions', 'Compliance prep notes'],
    benefits: ['Higher-quality UX decisions', 'Reduced accessibility risk', 'More inclusive design practice', 'Shared professional standards'],
    trialFeatures: ['One workshop replay'],
    limits: { maxMembers: 80, maxCourses: 14, maxPosts: 350, storageLimit: '18GB' },
    paymentOptions: { allowInstallments: true, installmentCount: 2, memberDiscount: 12 },
    freeTrialDays: 7,
  },
  {
    name: 'Product Leaders Roundtable',
    category: 'Business',
    country: 'Tunisie',
    status: 'public',
    currency: 'USD',
    priceType: 'monthly',
    price: 59,
    recurringInterval: 'month',
    isRecurring: true,
    feeAmount: 59,
    featured: false,
    verified: true,
    rating: 4.7,
    ratingCount: 21,
    stats: { totalRevenue: 3400, monthlyGrowth: 13, engagementRate: 74, retentionRate: 87 },
    membersCount: 1,
    tags: ['Product Strategy', 'Roadmaps', 'Discovery', 'B2B SaaS'],
    socialLinks: { linkedin: 'https://linkedin.com/company/product-leaders-roundtable', twitter: 'https://twitter.com/productleadersrt' },
    shortDescription: 'A peer-led community for product managers and founders making high-stakes roadmap and discovery decisions.',
    longDescription: 'Product Leaders Roundtable helps experienced operators pressure-test strategy, discovery bets, and roadmap communication. The community emphasizes strong judgment, clear trade-offs, and product narratives that hold up across teams.',
    features: ['Roadmap review circles', 'Discovery brief templates', 'Quarterly planning workshops', 'Stakeholder communication examples'],
    benefits: ['Stronger prioritization', 'Better roadmap storytelling', 'Higher confidence decisions', 'Peer-level perspective'],
    trialFeatures: ['Planning template pack'],
    limits: { maxMembers: 220, maxCourses: 16, maxPosts: 800, storageLimit: '16GB' },
    paymentOptions: { allowInstallments: false, earlyBirdDiscount: 5, memberDiscount: 10 },
    freeTrialDays: 3,
  },
  {
    name: 'Creator Wellness Collective',
    category: 'Personal Development',
    country: 'Tunisie',
    status: 'public',
    currency: 'TND',
    priceType: 'one-time',
    price: 45,
    isRecurring: false,
    feeAmount: 45,
    featured: false,
    verified: false,
    rating: 4.3,
    ratingCount: 14,
    stats: { totalRevenue: 900, monthlyGrowth: 20, engagementRate: 69, retentionRate: 75 },
    membersCount: 1,
    tags: ['Wellness', 'Creator Habits', 'Burnout Prevention', 'Accountability'],
    socialLinks: { instagram: 'https://instagram.com/creatorwellnesscollective', tiktok: 'https://tiktok.com/@creatorwellnesscollective' },
    shortDescription: 'A grounded community helping creators build sustainable habits, energy, and accountability without burnout.',
    longDescription: 'Creator Wellness Collective is built for people whose ambition is strong but whose routines need more stability. Members work on sustainable planning, recovery habits, and practical creator workflows that support long-term consistency.',
    features: ['Weekly planning reset', 'Focus sprint rooms', 'Habit tracker templates', 'Burnout prevention workshops'],
    benefits: ['More sustainable output', 'Healthier work cadence', 'Better accountability', 'Less reactive stress'],
    trialFeatures: [],
    limits: { maxMembers: 600, maxCourses: 8, maxPosts: 1000, storageLimit: '8GB' },
    paymentOptions: { allowInstallments: false, groupDiscount: 20 },
    freeTrialDays: 0,
  },
];

async function main() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('Missing MONGO_URI env var');
  }

  const client = new MongoClient(mongoUri, { ignoreUndefined: true });
  const baseUrl = (process.env.SERVER_URL || 'https://api.chabaqa.io').replace(/\/+$/, '');

  try {
    await client.connect();
    const db = client.db(resolveDbName(mongoUri));
    const users = db.collection('users');
    const communities = db.collection('communities');

    const creatorUsers = await users
      .find({ role: 'creator', accountStatus: 'active', isSuspended: { $ne: true } })
      .sort({ createdAt: 1 })
      .limit(communityBlueprints.length)
      .toArray();

    if (creatorUsers.length < communityBlueprints.length) {
      throw new Error(`Need at least ${communityBlueprints.length} creator users, found ${creatorUsers.length}`);
    }

    const inserted = [];

    for (let index = 0; index < communityBlueprints.length; index += 1) {
      const blueprint = communityBlueprints[index];
      const creator = creatorUsers[index];
      const slug = slugify(blueprint.name);
      const existing = await communities.findOne({ slug });

      if (existing) {
        console.log(`[skip] ${blueprint.name} already exists (${slug})`);
        continue;
      }

      const communityId = new ObjectId();
      const inviteCode = blueprint.status === 'private' ? makeInviteCode(`${slug}-${index}`) : undefined;
      const now = new Date();

      const community = {
        _id: communityId,
        name: blueprint.name,
        slug,
        logo: makeTypedAsset('logo', slug),
        photo_de_couverture: makeTypedAsset('cover', slug),
        short_description: blueprint.shortDescription,
        country: blueprint.country,
        currency: blueprint.currency,
        long_description: [
          {
            type: 'text',
            title: 'Overview',
            content: blueprint.longDescription,
            order: 1,
          },
          {
            type: 'text',
            title: 'Ideal Member',
            content: `Built for members interested in ${blueprint.tags.slice(0, 3).join(', ')} with a preference for structured community learning and peer accountability.`,
            order: 2,
          },
        ],
        createur: creator._id,
        creatorBanner: makeTypedAsset('creator-banner', slug),
        creatorAvatar: creator.profile_picture || creator.photo_profil || makeTypedAsset('creator-avatar', slugify(creator.username || creator.name)),
        category: blueprint.category,
        priceType: blueprint.priceType,
        image: makeTypedAsset('image', slug),
        tags: blueprint.tags,
        featured: blueprint.featured,
        type: 'community',
        settings: {
          primaryColor: ['#0f172a', '#1d4ed8', '#0f766e', '#7c3aed', '#b45309'][index % 5],
          secondaryColor: ['#e2e8f0', '#dbeafe', '#ccfbf1', '#ede9fe', '#fef3c7'][index % 5],
          welcomeMessage: `Welcome to ${blueprint.name}. Introduce yourself, share your current goal, and start with the featured resources.`,
          features: blueprint.features,
          benefits: blueprint.benefits,
          template: index % 2 === 0 ? 'modern' : 'minimal',
          fontFamily: 'Inter',
          borderRadius: 10 + (index % 4) * 2,
          backgroundStyle: index % 2 === 0 ? 'gradient' : 'solid',
          heroLayout: index % 3 === 0 ? 'split' : 'centered',
          headerStyle: index % 2 === 0 ? 'default' : 'compact',
          contentWidth: index % 2 === 0 ? 'normal' : 'wide',
          showStats: true,
          showHero: true,
          showFeatures: true,
          showBenefits: true,
          showTestimonials: index % 2 === 0,
          showPosts: true,
          showFAQ: true,
          enableAnimations: true,
          enableParallax: false,
          logo: makeTypedAsset('settings-logo', slug),
          heroBackground: makeTypedAsset('settings-hero', slug),
          gallery: [],
          videoUrl: '',
          socialLinks: blueprint.socialLinks,
          customSections: [
            {
              id: 1,
              type: 'text',
              title: 'How the Community Works',
              content: `Members join ${blueprint.name} to get structured resources, practical discussions, and a clearer path to progress in ${blueprint.category.toLowerCase()}.`,
              visible: true,
            },
          ],
          metaTitle: `${blueprint.name} | Chabaqa`,
          metaDescription: blueprint.shortDescription,
          customDomain: '',
          headerScripts: '',
        },
        stats: blueprint.stats,
        members: [creator._id],
        admins: [creator._id],
        moderateurs: [],
        rank: index + 1,
        fees_of_join: blueprint.feeAmount,
        pricing: {
          price: blueprint.price,
          currency: blueprint.currency,
          priceType: blueprint.priceType,
          isRecurring: blueprint.isRecurring,
          recurringInterval: blueprint.recurringInterval,
          features: blueprint.features,
          limits: blueprint.limits,
          paymentOptions: blueprint.paymentOptions,
          freeTrialDays: blueprint.freeTrialDays,
          trialFeatures: blueprint.trialFeatures,
        },
        isActive: true,
        isPrivate: blueprint.status === 'private',
        isVerified: blueprint.verified,
        membersCount: 1,
        inviteCode,
        inviteLink: inviteCode ? `${baseUrl}/community/join/${inviteCode}` : undefined,
        averageRating: blueprint.rating,
        ratingCount: blueprint.ratingCount,
        cours: [],
        longDescription: blueprint.longDescription,
        description: blueprint.shortDescription,
        coverImage: makeTypedAsset('cover-image', slug),
        rating: blueprint.rating,
        price: blueprint.price,
        verified: blueprint.verified,
        creator: creator.name,
        createdDate: now.toISOString(),
        updatedDate: now.toISOString(),
        approvalStatus: 'approved',
        approvedAt: now,
        isSuspended: false,
        createdAt: now,
        updatedAt: now,
      };

      await communities.insertOne(community);
      await users.updateOne(
        { _id: creator._id },
        {
          $addToSet: {
            createdCommunities: communityId,
            joinedCommunities: communityId,
            adminCommunities: communityId,
          },
        },
      );

      inserted.push({
        name: blueprint.name,
        slug,
        creator: creator.username || creator.email,
        priceType: blueprint.priceType,
        price: blueprint.price,
        currency: blueprint.currency,
      });
    }

    console.log(JSON.stringify({ insertedCount: inserted.length, inserted }, null, 2));
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error('[ERROR]', error);
  process.exit(1);
});
