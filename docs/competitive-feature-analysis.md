# Chabaqa Competitive Feature Analysis

**Last updated:** 2026-05-18  
**Scope:** Full user + creator feature inventory for Chabaqa vs. Circle, Nas.io (Nas.com), Skool, Mighty Networks, Kajabi, Disco, Whop, Patreon, and Bettermode  
**Companion doc:** [AI-focused competitive research](./ai-competitive-research.md)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Chabaqa Platform Overview](#2-chabaqa-platform-overview)
3. [Chabaqa User Features (Members)](#3-chabaqa-user-features-members)
4. [Chabaqa Creator Features](#4-chabaqa-creator-features)
5. [Chabaqa Platform Admin Features](#5-chabaqa-platform-admin-features)
6. [Competitor Profiles](#6-competitor-profiles)
7. [Master Feature Comparison Matrix](#7-master-feature-comparison-matrix)
8. [Gap Analysis: What Competitors Have That Chabaqa Lacks](#8-gap-analysis-what-competitors-have-that-chabaqa-lacks)
9. [Chabaqa Unique Strengths](#9-chabaqa-unique-strengths)
10. [Prioritized Enhancement Roadmap](#10-prioritized-enhancement-roadmap)
11. [Pricing Comparison Snapshot](#11-pricing-comparison-snapshot)
12. [Sources & Research Notes](#12-sources--research-notes)

---

## 1. Executive Summary

**Chabaqa** is an all-in-one creator community platform targeting creators in Tunisia and MENA. It combines paid communities, courses, challenges, digital products, events, 1:1 sessions, affiliates, gamification, and Stripe payments under one roof.

### Positioning vs. competitors

| Competitor | Primary strength | Chabaqa’s relative position |
|------------|------------------|----------------------------|
| **Circle** | Mature community OS, AI agents, workflows, live rooms, branded apps | Strong on learning + commerce depth; weaker on live streaming, native apps, workflow automation |
| **Nas.io** | AI cofounder, Magic Ads, WhatsApp monetization, fastest launch | Strong post-launch learning/ops; weaker on AI business builder and paid ads automation |
| **Skool** | Gamification, simplicity, discovery, massive live streams | Comparable gamification foundation; weaker on native live streaming and marketplace discovery |
| **Mighty Networks** | Branded apps, community methodology, automations | Comparable content types; weaker on native branded mobile apps |
| **Kajabi** | Funnels, branded app, marketing suite | Comparable multi-offer model; weaker on funnels and native branded app |
| **Disco** | Cohort LMS, AI program generation | Strong overlap; Chabaqa adds products/events/sessions + local payments |
| **Whop** | Marketplace discovery, low fees | Chabaqa has richer community; no built-in marketplace |
| **Patreon** | Membership + shop for creators | Chabaqa is deeper on structured learning; Patreon is simpler membership-first |
| **Bettermode** | Enterprise support KB, moderation AI | Chabaqa is more creator-commerce native |

### Top 15 gaps to close (highest impact)

1. **Native live streaming / live rooms** (Circle, Skool, Mighty)
2. **Branded iOS/Android apps** (Circle Plus, Kajabi, Mighty Pro, Nas.io)
3. **Visual workflow automation builder** (Circle Business, Mighty, Disco)
4. **AI packaged as “staff” / cofounder with object creation** (Circle, Nas.io, Kajabi)
5. **WhatsApp deep integration & broadcast** (Nas.io — Chabaqa has pages/limits but not parity)
6. **AI Magic Ads / paid acquisition** (Nas.io)
7. **Built-in funnel builder** (Kajabi, Nas.io storefront)
8. **Course quizzes & graded assessments** (Circle — Chabaqa has AI quiz in tutor, not formal LMS quizzes)
9. **Certificates of completion (issued)** (UI exists; verify full issuance pipeline)
10. **Member activity scores in directory** (Circle)
11. **Platform marketplace / discovery** (Skool Discover, Whop Discover, Circle Discover)
12. **BNPL / payment installments at checkout** (Circle)
13. **Headless Member API / SSO** (Circle Business+)
14. **Video transcription & content repurposing studio** (Circle, Kajabi)
15. **Integrations hub** (Zapier, Slack, CRM — Chabaqa page marked “Soon”)

### Top 10 Chabaqa differentiators to protect and market

1. **Multi-offer commerce in one community** (membership + course + challenge + event + product + session)
2. **Paid challenges with daily tasks, submissions, leaderboards, rewards**
3. **Stripe checkout stack** with TND pricing support
4. **Chapter-level AI tutor** with summary, quiz, simplify modes
5. **Internal points wallet** for in-platform purchases
6. **Per-community staff RBAC** (owner, admin, moderator, support)
7. **Creator analytics with AI insights** (content performance recommendations)
8. **Affiliate programs** at creator level
9. **Event QR ticketing & check-in**
10. **SaaS plan gating** aligned to local pricing (Starter/Growth/Pro in TND)

---

## 2. Chabaqa Platform Overview

| Attribute | Detail |
|-----------|--------|
| **Product name** | Chabaqa |
| **Category** | Creator community + learning + commerce platform |
| **Primary market** | Tunisia / MENA (TND, Flouci, Konnect) |
| **Member roles** | User, Creator (platform), Community Member, Staff (Admin/Moderator/Support) |
| **Content types** | Community, Course, Challenge, Post, Product, Event, 1:1 Session, Resource |
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind, next-intl |
| **Backend** | NestJS 11, MongoDB, Socket.io, Redis |
| **Creator SaaS** | Starter (39 TND/mo), Growth (99 TND/mo), Pro (159 TND/mo) |

---

## 3. Chabaqa User Features (Members)

### 3.1 Discovery & onboarding

| Feature | Description | Status |
|---------|-------------|--------|
| Explore marketplace | Browse communities, courses, challenges, products, events, sessions | ✅ Live |
| Public community pages | Landing, pricing, long description, checkout | ✅ Live |
| Invite links | Join private communities via invite code | ✅ Live |
| Auth | Email/password, Google OAuth, email OTP verification, password reset | ✅ Live |
| Public profiles | Username handles, profile pages, social links | ✅ Live |
| Blogs | Platform marketing blog | ✅ Live |
| Challenge promo pages | Public challenge promotion | ✅ Live |
| Account settings | User preferences and account management | ✅ Live |

### 3.2 Community membership & access

| Feature | Description | Status |
|---------|-------------|--------|
| Join free communities | No payment required | ✅ Live |
| Paid join | One-time, monthly, yearly membership | ✅ Live |
| Trials & installments | Community pricing supports trials, installment plans | ✅ Live |
| Discounts | Early bird, group, member discounts on join | ✅ Live |
| Checkout | Multi-provider payment flow | ✅ Live |
| Payment success handling | Post-purchase confirmation | ✅ Live |

### 3.3 Community hub (inside `/[creator]/[feature]/...`)

| Area | Features | Status |
|------|----------|--------|
| **Feed** | Posts (text, images, video, links), comments, reactions, bookmarks, mentions | ✅ Live |
| **Courses** | Catalog, enrollment, chapter player, progress, sequential unlock, notes, resources, reviews | ✅ Live |
| **AI course tutor** | Chapter Q&A, summary, quiz, simplify; conversation history | ✅ Live |
| **Challenges** | Join/leave, daily tasks, submissions, leaderboards, rewards, sequential progression | ✅ Live |
| **Products** | Digital downloads, variants, purchase verification | ✅ Live |
| **Events** | Registration, tickets, QR check-in | ✅ Live |
| **1:1 sessions** | Book slots, Google Meet integration | ✅ Live |
| **Members** | Directory, search, roles visible | ✅ Live |
| **Messages** | Community channels, peer DMs, session/help conversations | ✅ Live |
| **Reviews** | Community and content reviews/ratings | ✅ Live |
| **Progress** | Cross-content progress overview | ✅ Live |
| **Learning path** | AI goal-based recommendations | ✅ Live (feature-flagged) |
| **Achievements** | Badges, points, streaks, XP | ✅ Built (nav sometimes commented out) |
| **Resources** | Articles, videos, guides, podcasts, ebooks | ✅ Live |
| **Notifications** | In-app + web push, preferences, mute | ✅ Live |
| **Live support** | AI-assisted support widget with human escalation | ✅ Live |
| **Affiliate portal** | Partner earnings dashboard | ✅ Live (if affiliate) |
| **Wallet / points** | Internal balance, top-up, in-platform purchases | ✅ Live |

### 3.4 Payments (member-side)

| Provider | Use case |
|----------|----------|
| Flouci | Primary TND payments (Tunisia) |
| Stripe | Card/international |
| Konnect | Regional payments |
| Manual | Proof upload + creator approval |
| Wallet points | In-platform currency (1 DT = 1 point) |

### 3.5 Elevated member roles (community staff)

Members promoted to staff get dedicated workspaces:

| Role | Capabilities |
|------|--------------|
| **Admin** | Settings, staff, members, invitations, content, moderation, marketing, affiliates, analytics, finance, support |
| **Moderator** | Moderation queue, pinned posts, member directory |
| **Support** | Member lookup, support queue |

---

## 4. Chabaqa Creator Features

### 4.1 Dashboard & analytics

| Feature | Description | Status |
|---------|-------------|--------|
| Overview dashboard | Metrics, setup checklist, attention queue, revenue snapshot, quick create | ✅ Live |
| Analytics | Funnels, retention, revenue, geography, exports, course/challenge drill-down | ✅ Live |
| AI creator insights | AI-generated performance summaries, issues, fixes, experiments (Growth/Pro) | ✅ Live |

### 4.2 Community management

| Feature | Description | Status |
|---------|-------------|--------|
| Create communities | Multi-step wizard, branding, pricing, privacy | ✅ Live |
| Customize community | Colors, hero, templates, custom domain, SEO, gallery, social links | ✅ Live |
| Team & roles | Invite staff, assign admin/moderator/support | ✅ Live |
| Invite generation | Private invite links | ✅ Live |
| Community stats & settings | Engagement and configuration | ✅ Live |

### 4.3 Content creation

| Content type | Creator capabilities | Status |
|--------------|---------------------|--------|
| **Courses** | Sections/chapters, video upload/HLS, resources, publish, sequential progression, paid chapters, AI tutor config, certificate settings (UI) | ✅ Live |
| **Posts** | Feed management | ✅ Live |
| **Products** | Digital files, variants, inventory | ✅ Live |
| **Challenges** | Multi-day tasks, submissions, rewards, publish, analytics | ✅ Live |
| **Events** | Tickets, speakers, agenda, QR check-in | ✅ Live |
| **Sessions** | Availability, slots, bookings, Google Calendar/Meet | ✅ Live |

### 4.4 Monetization

| Feature | Description | Status |
|---------|-------------|--------|
| Payouts | Balance, bank RIB, payout requests | ✅ Live |
| Subscriptions | Member subscription management | ✅ Live |
| Promo codes | Percent/amount off, scoped by content | ✅ Live |
| Affiliates | Programs, partners, links, stats | ✅ Live |
| Platform SaaS billing | Subscribe to Starter/Growth/Pro | ✅ Live |
| Transaction fees | Per-plan % + fixed DT fee | ✅ Live |

### 4.5 Marketing & growth

| Feature | Description | Status |
|---------|-------------|--------|
| Email campaigns | Campaigns, welcome templates, inactivity automation, audience preview | ✅ Live |
| Affiliates marketing | Program management | ✅ Live |
| Contacts / WhatsApp / Messages | Marketing contact tools (pages exist) | ⚠️ Partial |
| Notifications inbox | Creator notification center | ✅ Live |

### 4.6 AI (creator-facing)

| Feature | Description | Status |
|---------|-------------|--------|
| Chabaqa AI hub | Toggle course tutor, support agent, learning paths; usage limits | ✅ Live |
| AI tutor insights | Per-course tutor analytics | ✅ Live |
| Create with AI | AI-assisted content creation entry | ✅ Live |
| AI creator insights | Growth advisor on analytics | ✅ Live |

### 4.7 Not yet / coming soon

| Feature | Status |
|---------|--------|
| Integrations hub | 🔜 Marked “Soon” in sidebar |
| Live streaming (native) | ❌ Marketing copy only; not in route/controller inventory |
| White-label API | ❌ Not evidenced |
| Branded mobile app builder | ❌ Not evidenced |

### 4.8 Creator plan limits (SaaS tiers)

| Limit / feature | Starter | Growth | Pro |
|-----------------|---------|--------|-----|
| Members max | 100 | 500 | Unlimited |
| Admins max | 1 | 2 | 3 |
| Courses activation | 3 | 999 | Unlimited |
| Storage | 5 GB | 50 GB | 300 GB |
| Email recipients/mo | 0 | 1,000 | 15,000 |
| WhatsApp messages/mo | 0 | 250 | 1,000 |
| Session bookings/mo | 0 | 300 | 1,000 |
| Analytics lookback | 30 days | 180 days | 365 days |
| Challenges, sessions, events | ❌ | ✅ | ✅ |
| Gamification | ❌ | ✅ | ✅ |
| Remove branding | ❌ | ❌ | ✅ |
| Verified / featured badge | ❌ | Verified | Both |

---

## 5. Chabaqa Platform Admin Features

Separate from creator product — for Chabaqa operators:

- User management
- Community oversight
- Content moderation
- Financial operations
- Analytics
- Security
- Communication
- Live support (platform-wide)
- Data export

RBAC via `AdminCapabilities` (granular module access).

---

## 6. Competitor Profiles

### 6.1 Circle.so

**Positioning:** “The complete community platform” — community, courses, events, payments, email, AI in one system.

**Pricing (2026):**
- Professional: **$89/mo** — core community, courses, events, live streams, live rooms, gamification, custom domain
- Business: **$199/mo** — workflows, APIs, content co-pilot, transcriptions, activity scores, remove branding
- Circle Plus: **Custom** — AI agents, AI workflows, SSO, branded apps, dedicated CSM

**User features:**
- Personalized feed, posts, comments
- Searchable member directory with rich profiles
- Courses (drag-and-drop, multimedia, mobile apps)
- Events with RSVP (including access-group restrictions — April 2026)
- Live streams and live rooms
- Weekly community digest
- Gamification
- Mobile web + native apps (Plus: branded with IAP)

**Creator features:**
- Website builder and landing pages
- Branded checkout, free trials, BNPL/installments
- Paid memberships, one-time purchases, affiliates
- Email Hub add-on ($99/mo): broadcasts, automation, CRM, segmentation
- Workflows: 100+ triggers/actions (Business+)
- Reporting & analytics; advanced on Plus
- Migration services (courses, email, payments)
- Content co-pilot, automated transcriptions
- AI Agents (onboarding, support, coaching)
- AI Workflows (moderation, routing, engagement)
- AI activity scores in member directory
- AI inbox for conversation review
- AI Copilot for community management chat
- Circle MCP (April 2026): connect external AI tools to community data
- Circle Discover: marketplace/discovery

**Transaction fees:** 2% (Pro) down to 0.5% (Plus)

---

### 6.2 Nas.io / Nas.com

**Positioning:** “Start selling from a single photo” — AI-first solopreneur business platform (storefront + ads + community).

**Pricing (approx.):**
- Basic: Free
- Pro: ~$29/mo
- Platinum: ~$99/mo
- Zero Link: 0% payment fees positioning
- 350,000+ entrepreneurs claimed

**User features:**
- Community feed
- Events and challenges (free or paid)
- Course access
- Customer dashboard (multi-group view for WhatsApp)
- iOS & Android apps

**Creator features:**
- **AI Cofounder:** idea → product, pricing, strategy, launch
- **Magic Ads:** Facebook/Instagram campaigns in ~3 clicks, auto targeting
- **Magic Content:** studio photos, ads, social content from one prompt
- **Magic Reach:** messaging/broadcast (WhatsApp emphasis)
- **Storefront:** AI-built offer, page, checkout from photo/description
- Digital products, courses, coaching, challenges, memberships, events
- **WhatsApp monetization:** manage multiple groups, overcome 2k member limit, centralized dashboard
- Multi-channel bridges: Discord, Telegram, Slack, Facebook Groups, LinkedIn, Line
- Lead forms and website builder
- Advanced analytics
- Global payments

**Weaknesses vs. Chabaqa:** Less depth in structured learning (chapter tutor, sequential courses), staff RBAC, challenge progression mechanics, local Tunisia payment rails.

---

### 6.3 Skool

**Positioning:** Simple, gamified community for coaches — “Facebook Groups meets learning.”

**Pricing:** $9–$99/mo + 2.9–10% transaction fees

**User features:**
- Single-feed community with categories
- Points & levels (likes → points → level badges)
- Leaderboards (7-day, 30-day, all-time)
- Course unlock by level
- Native video hosting (2025)
- Live streaming up to **10,000** attendees
- Live replay one-click publish, transcripts
- Classroom (courses)
- Calendar events
- Skool Discover (built-in marketplace)

**Creator features (2025–2026 roadmap/rollout):**
- Subscription tiers (free, paid, premium) — rolling out
- Skool Webinars with broadcast mode
- Advanced analytics: MRR, churn, conversions, source tracking
- Zapier integrations
- Moderator tools on live calls (mute all, pin speaker, noise cancellation)

**Weaknesses vs. Chabaqa:** No white-label, limited customization, separate communities per tier, no formal quizzes, weaker multi-product commerce in one hub.

---

### 6.4 Mighty Networks

**Positioning:** Community-led business with methodology (“Community Design”) and branded apps.

**Pricing:** Multiple tiers; Mighty Pro for custom branded apps (~$360/mo+ cited in comparisons)

**User features:**
- Activity feed, chat, polls, questions
- AI Question Generator for discussion prompts
- Scheduled daily/weekly questions
- Livestreams HD up to 1080p, guest on screen
- Courses, events, challenges, mini-courses
- Customizable Spaces (explorer, chat, LMS, pages, events, hashtags)
- Native iOS/Android (60% more activity vs. web cited)
- 135+ currencies

**Creator features:**
- **AI Cohost:** community strategy and setup guidance
- **Automations:** welcome, milestones, re-engagement; triggers on lesson complete, badge, RSVP
- Paid memberships (~$48/mo average cited)
- Branded app (Mighty Pro)
- Member matching / “People Magic” (AI-assisted)

**Weaknesses vs. Chabaqa:** Less transactional commerce variety (products, QR events, wallet), less MENA payment localization.

---

### 6.5 Kajabi

**Positioning:** All-in-one OS for knowledge entrepreneurs — courses, funnels, email, community, coaching.

**Pricing:** Higher tier ($100–$400+/mo range in market comparisons)

**User features:**
- Structured community spaces, threaded discussions, pins
- Activity feed, polls, DMs
- Kajabi Mobile App: courses, community, coaching, podcasts
- Branded App add-on (~$199/mo): custom logo, IAP
- Lesson completion celebrations, resume button
- Deep links from email to content

**Creator features:**
- **AI Creator Hub:** outlines, lessons, sales copy, emails, social
- **Creator Studio:** video repurposing, clips
- Funnels: opt-in → offer → checkout → email sequence
- Products bundle community + courses
- Coaching sessions in app
- Podcast hosting
- Email marketing built-in
- “Cofounder” AI direction (2026 updates)

**Weaknesses vs. Chabaqa:** Less community-native depth, expensive for MENA solopreneurs, weaker challenge/session/event QR workflows.

---

### 6.6 Disco.co

**Positioning:** AI-native social learning platform — cohorts, programs, communities.

**User features:**
- Cohort-based and self-paced programs
- Discussion forums, group chat, peer review, group projects
- Leaderboards, badges, member spotlights, directory
- Events and challenges
- Personalized learning journeys (AI)

**Creator features:**
- LMS with cohorts: live, blended, async
- Automated enrollments, reminders, assignments, waitlists
- Engagement nudges (falling-behind thresholds)
- AI program generation, quiz generation, video enhancement
- Unified analytics across cohorts/courses/communities
- Integrations: Stripe, Slack, Zoom, Zapier, API/webhooks
- Bulk member enrollment

**Weaknesses vs. Chabaqa:** Less broad creator commerce (digital products store, affiliates, multi-payment local rails).

---

### 6.7 Whop

**Positioning:** Digital commerce + community — marketplace-first.

**User features:**
- Community access tied to purchases
- Chat and content access

**Creator features:**
- **Whop Discover** marketplace
- Flexible payment models, low barrier (free + 2.7% fees cited)
- Digital products, courses, coaching
- Affiliate tools
- Zapier only (no native workflow builder)

**Weaknesses vs. Chabaqa:** Weaker community depth, learning structure, and staff RBAC.

---

### 6.8 Patreon

**Positioning:** Membership + shop for creators and fans.

**User features:**
- Membership tiers (monthly/annual)
- Community chats, polls, comments
- Shop one-time purchases ($3–$5,000)
- DMs, native video/livestreaming
- Free trials, gifting, discounts (subscription billing)

**Creator features:**
- Per-tier content access
- Shop for digital products
- 10% platform fee (new creators post Aug 2025)
- Exportable email lists

**Weaknesses vs. Chabaqa:** No courses/challenges/events infrastructure; not an all-in-one learning community OS.

---

### 6.9 Bettermode

**Positioning:** Enterprise / customer community platform.

**User features:**
- Branded portals, spaces, discussions
- AI-powered search and knowledge discovery

**Creator/Admin features:**
- AI moderation and support deflection
- Customization and integrations
- Analytics and automation
- SSO and enterprise security patterns

**Weaknesses vs. Chabaqa:** Not optimized for creator monetization of courses/challenges/sessions.

---

## 7. Master Feature Comparison Matrix

Legend: ✅ Strong/native | ⚠️ Partial/basic | ❌ Missing/not evidenced | 🔜 Announced/placeholder

### 7.1 Community & social

| Feature | Chabaqa | Circle | Nas.io | Skool | Mighty | Kajabi | Disco |
|---------|---------|--------|--------|-------|--------|--------|-------|
| Discussion feed | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Threaded comments | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ |
| Reactions / likes | ✅ | ✅ | ⚠️ | ✅ (→ points) | ✅ | ✅ | ✅ |
| DMs | ✅ | ✅ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ |
| Member directory | ✅ | ✅ | ⚠️ | ✅ | ✅ | ⚠️ | ✅ |
| Polls | ⚠️ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ⚠️ |
| Pinned posts | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ |
| Spaces / channels | ⚠️ | ✅ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ |
| @mentions | ✅ | ✅ | ⚠️ | ⚠️ | ✅ | ⚠️ | ⚠️ |
| Bookmarks | ✅ | ⚠️ | ❌ | ⚠️ | ⚠️ | ⚠️ | ⚠️ |
| Weekly digest email | ⚠️ | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ⚠️ |

### 7.2 Learning & content

| Feature | Chabaqa | Circle | Nas.io | Skool | Mighty | Kajabi | Disco |
|---------|---------|--------|--------|-------|--------|--------|-------|
| Courses | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Sequential unlock | ✅ | ✅ | ⚠️ | ⚠️ | ✅ | ✅ | ✅ |
| Video HLS / protected | ✅ | ✅ | ⚠️ | ✅ | ✅ | ✅ | ✅ |
| Formal quizzes (LMS) | ❌ | ✅ | ⚠️ | ❌ | ⚠️ | ✅ | ✅ |
| AI chapter tutor | ✅ | ⚠️ | ⚠️ | ❌ | ⚠️ | ⚠️ | ⚠️ |
| AI quiz generation | ✅ (tutor) | ⚠️ | ⚠️ | ❌ | ⚠️ | ✅ | ✅ |
| Certificates | ⚠️ UI | ⚠️ | ❌ | ❌ | ⚠️ | ✅ | ✅ |
| Cohorts | ⚠️ | ✅ | ⚠️ | ⚠️ | ✅ | ⚠️ | ✅ |
| Challenges | ✅ | ⚠️ | ✅ | ⚠️ | ✅ | ❌ | ✅ |
| Resources library | ✅ | ⚠️ | ⚠️ | ❌ | ⚠️ | ✅ | ✅ |
| Learning path AI | ✅ | ❌ | ❌ | ❌ | ⚠️ | ⚠️ | ✅ |
| Peer review | ❌ | ⚠️ | ❌ | ❌ | ⚠️ | ❌ | ✅ |
| Course notes | ✅ | ⚠️ | ❌ | ❌ | ⚠️ | ⚠️ | ⚠️ |

### 7.3 Live & events

| Feature | Chabaqa | Circle | Nas.io | Skool | Mighty | Kajabi |
|---------|---------|--------|--------|-------|--------|--------|
| Events / RSVP | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| QR ticketing / check-in | ✅ | ⚠️ | ⚠️ | ❌ | ⚠️ | ⚠️ |
| Native live streaming | ❌ | ✅ | ⚠️ | ✅ | ✅ | ⚠️ |
| Live rooms (always-on) | ❌ | ✅ | ❌ | ❌ | ⚠️ | ❌ |
| Large live audience (1k+) | ❌ | ⚠️ | ❌ | ✅ | ⚠️ | ⚠️ |
| 1:1 session booking | ✅ | ⚠️ | ✅ | ❌ | ⚠️ | ✅ |
| Google Meet integration | ✅ | ⚠️ | ❌ | ❌ | ⚠️ | ⚠️ |

### 7.4 Commerce & monetization

| Feature | Chabaqa | Circle | Nas.io | Skool | Mighty | Kajabi |
|---------|---------|--------|--------|-------|--------|--------|
| Paid membership | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| One-time purchases | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ |
| Multiple offers in one hub | ✅ | ✅ | ⚠️ | ❌ | ✅ | ✅ |
| Digital products / downloads | ✅ | ⚠️ | ✅ | ⚠️ | ⚠️ | ✅ |
| Product variants | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | ⚠️ |
| Affiliates | ✅ | ✅ | ⚠️ | ❌ | ⚠️ | ⚠️ |
| Promo codes | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | ✅ |
| Installments / BNPL | ✅ | ✅ | ⚠️ | ❌ | ⚠️ | ⚠️ |
| Free trials | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | ✅ |
| Creator payouts | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Manual/offline payments | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Local payment (Flouci/Konnect) | ✅ | ❌ | ⚠️ | ❌ | ❌ | ❌ |
| Internal wallet / points | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Marketplace discovery | ❌ | ✅ | ⚠️ | ✅ | ❌ | ❌ |
| Funnel builder | ❌ | ⚠️ | ✅ | ❌ | ❌ | ✅ |

### 7.5 Marketing & automation

| Feature | Chabaqa | Circle | Nas.io | Skool | Mighty | Kajabi |
|---------|---------|--------|--------|-------|--------|--------|
| Email campaigns | ✅ | ✅ (add-on) | ⚠️ | ⚠️ digest | ⚠️ | ✅ |
| Email automation | ✅ | ✅ | ⚠️ | ❌ | ✅ | ✅ |
| WhatsApp integration | ⚠️ | ❌ | ✅ | ❌ | ❌ | ❌ |
| AI paid ads (Magic Ads) | ❌ | ❌ | ✅ | ❌ | ❌ | ⚠️ |
| Workflow builder | ❌ | ✅ | ⚠️ | ❌ | ✅ | ⚠️ |
| Zapier | ❌ | ⚠️ | ⚠️ | ✅ | ⚠️ | ✅ |
| Inactivity campaigns | ✅ | ✅ | ⚠️ | ⚠️ | ✅ | ✅ |
| Custom domain | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| SEO / meta customization | ✅ | ✅ | ⚠️ | ❌ | ⚠️ | ✅ |

### 7.6 AI capabilities

| Feature | Chabaqa | Circle | Nas.io | Mighty | Kajabi | Disco |
|---------|---------|--------|--------|--------|--------|-------|
| AI support bot | ✅ | ✅ | ⚠️ | ❌ | ⚠️ | ⚠️ |
| AI course tutor | ✅ | ⚠️ | ❌ | ❌ | ⚠️ | ⚠️ |
| AI creator insights | ✅ | ✅ | ⚠️ | ❌ | ⚠️ | ⚠️ |
| AI learning path | ✅ | ❌ | ❌ | ❌ | ⚠️ | ✅ |
| AI agents (configurable) | ⚠️ | ✅ | ⚠️ | ❌ | ⚠️ | ❌ |
| AI workflows | ❌ | ✅ | ⚠️ | ❌ | ⚠️ | ⚠️ |
| AI cofounder / create products | ⚠️ | ⚠️ | ✅ | ❌ | ✅ | ✅ |
| AI activity scores | ❌ | ✅ | ❌ | ⚠️ | ⚠️ | ⚠️ |
| AI content repurposing | ❌ | ✅ | ✅ | ⚠️ | ❌ | ✅ |
| AI Magic Ads | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |

*For full AI gap analysis and roadmap, see [ai-competitive-research.md](./ai-competitive-research.md).*

### 7.7 Platform & enterprise

| Feature | Chabaqa | Circle | Nas.io | Mighty | Kajabi |
|---------|---------|--------|--------|--------|--------|
| Branded mobile app | ❌ | ✅ Plus | ✅ | ✅ Pro | ✅ add-on |
| Native member app | ❌ | ✅ | ✅ | ✅ | ✅ |
| SSO | ❌ | ✅ Plus | ❌ | ⚠️ | ⚠️ |
| Headless / Admin API | ❌ | ✅ Business | ❌ | ⚠️ | ✅ |
| Staff RBAC per community | ✅ | ⚠️ | ❌ | ⚠️ | ⚠️ |
| Multi-community per creator | ✅ | ✅ | ⚠️ | ❌ | ✅ |
| i18n / multilingual | ✅ | ⚠️ | ⚠️ | ❌ | ⚠️ |
| Web push notifications | ✅ | ✅ | ⚠️ | ⚠️ | ✅ |
| Platform admin console | ✅ | N/A | N/A | N/A | N/A |
| Live streaming | ❌ | ✅ | ❌ | ✅ | ⚠️ |
| Gamification (badges/points) | ✅ | ✅ | ⚠️ | ✅ | ⚠️ |
| Remove platform branding | ✅ Pro | ✅ Business | ⚠️ | ⚠️ | ✅ |

---

## 8. Gap Analysis: What Competitors Have That Chabaqa Lacks

Organized by priority tier and competitor origin.

### 8.1 Critical gaps (table stakes for scaling creators)

#### A. Live video & real-time community

| Missing capability | Who has it | Business impact |
|--------------------|------------|-----------------|
| Native live streaming in community | Circle, Skool (10k), Mighty | Weekly rituals, launches, Q&A — core retention driver |
| Live rooms (persistent audio/video spaces) | Circle | Always-on community feel |
| Live replay auto-publish + transcript | Skool, Circle | Content repurposing without manual upload |
| Webinar mode (stage, broadcast, co-hosts) | Skool (rolling out) | Large-scale teaching and launches |

**Chabaqa today:** Live streaming appears in marketing (`frontend/lib/data.ts`) but is **not implemented** in the app route/API inventory. Events exist with QR tickets; sessions use Google Meet.

**Recommended direction:** Phase 1 — embed Zoom/Meet for live events; Phase 2 — native WebRTC live rooms; Phase 3 — replay → course chapter pipeline.

---

#### B. Mobile apps

| Missing capability | Who has it | Business impact |
|--------------------|------------|-----------------|
| Branded iOS/Android apps | Circle Plus, Mighty Pro, Kajabi (+$199/mo), Nas.io | 60%+ engagement lift (Mighty cited); push retention |
| In-app purchases | Circle Plus, Kajabi Branded App | Frictionless mobile conversion |

**Chabaqa today:** Responsive web + PWA potential; no App Store listing evidenced.

---

#### C. Workflow automation

| Missing capability | Who has it | Business impact |
|--------------------|------------|-----------------|
| Visual workflow builder (triggers → conditions → actions) | Circle Business, Mighty Automations, Disco | Scale creator ops without manual intervention |
| 100+ trigger types (subscription, course progress, inactivity) | Circle | Lifecycle marketing at scale |
| AI conditions in workflows (sentiment, intent, churn risk) | Circle Plus | Smart automation vs. dumb rules |

**Chabaqa today:** Email inactivity automation exists; no general workflow engine. Socket events and rich analytics could power this — see [ai-competitive-research.md](./ai-competitive-research.md) Pillar 5.

**High-value workflow templates for Chabaqa:**
1. New member → welcome DM + recommended first course
2. Stalled at 40% course → nudge + AI tutor suggestion
3. Challenge day missed → reminder + leaderboard update
4. Checkout abandoned → email + promo
5. Support message → AI triage → human queue
6. Course completed → upsell session/event/product

---

#### D. Discovery & growth marketplace

| Missing capability | Who has it | Business impact |
|--------------------|------------|-----------------|
| Platform marketplace (Discover) | Circle Discover, Skool Discover, Whop Discover | New creator customer acquisition |
| SEO-optimized public directory | Skool, Circle | Organic growth |

**Chabaqa today:** `/explore` exists as internal marketplace — not the same as network-effects discovery on Skool/Whop.

---

### 8.2 High-impact gaps (competitive parity within 6–12 months)

#### E. AI business layer (packaging & creation)

| Missing capability | Who has it | Notes |
|--------------------|------------|-------|
| AI Cofounder (idea → live product) | Nas.io, Kajabi (emerging) | Generate draft course/challenge/storefront in-platform |
| Magic Ads (Meta campaigns) | Nas.io | 3-click ads with auto targeting |
| Magic Content (daily social assets) | Nas.io | Product-aware content generation |
| AI Agents as named staff | Circle | Concierge, coach, support with avatar/tone |
| AI Workflows | Circle Plus | Operational automation |
| AI Activity Scores in directory | Circle | Engagement/churn scoring per member |
| AI Copilot for admins | Circle | Chat to manage community |
| Circle MCP (external AI access) | Circle (April 2026) | ChatGPT/Claude connected to community data |

**Chabaqa today:** Strong **execution** AI (tutor, insights, support, learning path) but weak **packaging** and **creation** AI. See existing roadmap in [ai-competitive-research.md](./ai-competitive-research.md).

---

#### F. WhatsApp & messaging dominance (MENA-relevant)

| Missing capability | Who has it | Notes |
|--------------------|------------|-------|
| WhatsApp group monetization | Nas.io | Multi-group dashboard, overcome 2k cap |
| Magic Reach broadcast | Nas.io | Controlled member messaging |
| Multi-platform bridge (Telegram, Discord, Slack) | Nas.io | Meet members where they are |

**Chabaqa today:** WhatsApp message quotas on Growth/Pro plans; marketing pages exist — **not** Nas-level integration. **Opportunity:** Chabaqa can win MENA by doing WhatsApp **better than Circle** (who largely ignores it) while matching Nas on reach.

---

#### G. Learning LMS depth

| Missing capability | Who has it | Notes |
|--------------------|------------|-------|
| Formal course quizzes (graded, locked) | Circle, Kajabi, Disco | Distinct from AI tutor quiz |
| Assignments with rubrics | Disco, Kajabi | Cohort programs |
| Peer review | Disco | Social learning |
| SCORM / compliance | Enterprise LMS | B2B training |
| Drip content by date (not just sequential) | Kajabi, Circle | Cohort schedules |
| Cohort waitlists | Disco | Scarcity and launches |

**Chabaqa today:** Sequential unlock, paid chapters, AI quiz in tutor — **no** formal assessment engine.

---

#### H. Marketing & funnels

| Missing capability | Who has it | Notes |
|--------------------|------------|-------|
| Full funnel builder (opt-in → offer → checkout → emails) | Kajabi, Nas storefront | Conversion system |
| BNPL at checkout | Circle | Higher ticket conversion |
| Built-in CRM with behavioral segments | Circle Email Hub | Segment by course progress, posts |
| Podcast hosting | Kajabi | Content hub extension |

**Chabaqa today:** Email campaigns + promo codes + analytics — no visual funnel builder.

---

#### I. Video & content studio

| Missing capability | Who has it | Notes |
|--------------------|------------|-------|
| Auto transcription | Circle Business | Searchable video |
| AI content co-pilot | Circle | Draft posts, ideas |
| Clip generation / Creator Studio | Kajabi | Short-form from long video |
| Chapter search inside video | Circle | Timestamp Q&A (Chabaqa opportunity for tutor) |

---

#### J. Integrations & extensibility

| Missing capability | Who has it | Notes |
|--------------------|------------|-------|
| Zapier / Make | Skool, Disco, Kajabi | No-code integrations |
| Slack integration | Disco | Cohort engagement |
| Headless Member API | Circle Business | Custom frontends |
| SSO (SAML/OIDC) | Circle Plus | Enterprise communities |
| Webhooks for all events | Disco | Custom ops |

**Chabaqa today:** `/creator/integrations` marked **Soon**.

---

### 8.3 Medium gaps (differentiation or segment-specific)

| Gap | Competitors | Segment |
|-----|-------------|---------|
| Skool-style points→levels→unlock course | Skool | Gamification-heavy coaches |
| AI Question Generator for community | Mighty | Engagement prompts |
| Member matching / accountability partners | Mighty, Disco | Networking communities |
| Patreon-style “shop” tab for one-offs | Patreon | Simple creator monetization |
| Custom profile fields | Circle Business | B2B communities |
| Sandbox/staging community | Circle Plus | Enterprise creators |
| Concierge onboarding / migration team | Circle, Kajabi | High-touch onboarding |
| Lower transaction fees at scale | Circle Plus (0.5%) | High-volume creators |
| Community polls in feed | Kajabi, Mighty | Quick engagement |
| Dark mode (mobile) | Kajabi (upcoming) | UX polish |

---

### 8.4 Gaps that are marketing-only on Chabaqa (verify before promising)

| Claimed in marketing | Codebase evidence |
|---------------------|-------------------|
| Live streaming | ❌ Not in routes/APIs |
| White-label API | ❌ Not evidenced |
| Some learning path / achievements nav | ⚠️ Pages exist, nav sometimes disabled |

---

## 9. Chabaqa Unique Strengths

Features where Chabaqa is **ahead or uniquely differentiated** vs. Circle/Nas/Skool:

### 9.1 Commerce & payments (especially MENA)

1. **Stripe checkout** across platform and content purchases.
2. 3. **Internal wallet / points economy** — retention and micro-transactions.
4. **Single community hub for 6+ monetization types:** membership, course, challenge, event, product, session.
5. **Affiliate programs** with creator-level management (not just platform referral).

### 9.2 Learning & engagement

6. **Paid challenges** with daily tasks, submissions, leaderboards, rewards — deeper than Circle/Nas “challenge” listings.
7. **Chapter-level AI tutor** with modes: chat, summary, quiz, simplify — more specific than Circle’s generic agents for education.
8. **Sequential course + challenge progression** with analytics drill-down.
9. **Event QR tickets + verification endpoint** — operational events, not just RSVP.
10. **Cross-content progress dashboard** for members.

### 9.3 Operations

11. **Per-community staff RBAC** (admin, moderator, support) with granular permissions — stronger than Skool; clearer than Nas.
12. **Community staff dashboards** (admin/moderator/support workspaces).
13. **Creator AI insights tied to revenue/content types** — course, challenge, session, event, product, post.
14. **Platform-level admin** for marketplace operator (competitors don’t offer this — you operate the network).

### 9.4 Pricing & market fit

15. **TND-native SaaS pricing** (39/99/159 TND) — accessible vs. $89–199 USD Circle tiers.
16. **Plan enforcement** with explicit limits (members, storage, WhatsApp, sessions) — transparent for creators.

---

## 10. Prioritized Enhancement Roadmap

### Phase 0 — Honesty & quick wins (0–4 weeks)

- [ ] Align marketing site with actual features (remove or gate “live streaming” until built)
- [ ] Re-enable achievements/learning path in community nav where ready
- [ ] Ship integrations page MVP (Zapier webhook export minimum)
- [ ] Package existing AI under **“Chabaqa AI”** brand in creator dashboard
- [ ] Issue certificates end-to-end if UI already promises it

### Phase 1 — Retention core (1–3 months)

- [ ] Live events via Zoom/Meet native embed + calendar reminders
- [ ] Formal course quizzes (non-AI) with pass threshold and completion rules
- [ ] Member activity score (simple version) in directory
- [ ] Workflow templates (5 prebuilt) using existing email/DM/push
- [ ] WhatsApp broadcast integration (Growth/Pro differentiator for MENA)

### Phase 2 — Competitive parity (3–6 months)

- [ ] AI Create With Me: draft course/challenge/event/product from prompt
- [ ] AI Community Concierge (Circle Agents parity)
- [ ] Visual workflow builder v1
- [ ] Explore/marketplace SEO + featured creators (Chabaqa Discover)
- [ ] Video transcription + chapter summaries auto-generated
- [ ] Zapier + public webhooks

### Phase 3 — Scale & moat (6–12 months)

- [ ] Native live streaming or live rooms
- [ ] Branded mobile app program (Pro/Enterprise tier)
- [ ] AI activity scores + churn predictions + recommended actions
- [ ] Funnel builder (opt-in → checkout → email sequence)
- [ ] Headless API + SSO for B2B
- [ ] Nas-competitive Magic Ads OR partnership integration

### Phase 4 — Category leadership

- [ ] AI Challenge Coach (unique — few competitors)
- [ ] AI Monetization Map across all offer types
- [ ] AI Weekly Creator Brief
- [ ] Arabic/French/English AI localization for MENA campaigns
- [ ] BNPL/installments at checkout (if not fully productized)

---

## 11. Pricing Comparison Snapshot

| Platform | Entry paid tier | Mid tier | Top tier | Transaction fees | Currency focus |
|----------|-----------------|----------|----------|------------------|----------------|
| **Chabaqa** | 39 TND/mo Starter | 99 TND Growth | 159 TND Pro | 7.9% → 2.9% | TND / MENA |
| **Circle** | $89/mo Pro | $199/mo Business | Custom Plus | ~2% → 0.5% | USD |
| **Nas.io** | Free | ~$29 Pro | ~$99 Platinum | Varies; Zero Link 0% | Global |
| **Skool** | $9/mo | — | $99/mo | 2.9–10% | USD |
| **Mighty** | ~$49/mo cited | — | Pro ~$360+ | Payment processing | USD |
| **Kajabi** | ~$149/mo cited | — | ~$399/mo | Processing | USD |
| **Disco** | Custom | — | — | Stripe | USD |
| **Whop** | Free | — | — | ~2.7% | USD |
| **Patreon** | Free to start | — | — | 10% platform (new) | USD |

**Chabaqa pricing advantage:** Lower absolute cost for Tunisian creators; local payment methods.  
**Chabaqa pricing risk:** Higher % transaction fee on Starter (7.9%) vs. Circle at scale — mitigate with Pro tier and volume incentives.

---

## 12. Sources & Research Notes

### Official competitor pages (checked 2026-05-18)

| Platform | URLs |
|----------|------|
| Circle | https://circle.so/platform · https://circle.so/pricing · https://circle.so/ai · https://circle.so/workflows · https://circle.so/product-updates |
| Nas.io / Nas.com | https://nas.com/ · https://nas.com/pricing · https://nas.com/features/magic-ads · https://help.nas.com/ |
| Skool | https://help.skool.com/ · https://skoolprep.com/skool-new-features-2025 |
| Mighty Networks | https://www.mightynetworks.com/ · https://www.mightynetworks.com/features/automations · https://www.mightynetworks.com/ai |
| Kajabi | https://kajabi.com/product/communities · https://help.kajabi.com/ (mobile/branded app) |
| Disco | https://www.disco.co/all-features · https://www.disco.co/features/lms-with-cohorts |
| Whop | Community comparison articles (2025) |
| Patreon | https://www.patreon.com/new-creator-plans · https://support.patreon.com/ |

### Comparison & review sources

- Skool vs Circle: https://www.group.app/blog/skool-vs-circle/
- Nas.io review 2026: https://www.carriemelissajones.com/blog/nasio-review-walkthrough-2026
- CreatorStack Nas.io: https://www.creatorstackclub.com/software/nas-io
- White-label community features: https://thrico.com/blog/top-features-of-modern-white-label-community-platform/

### Chabaqa codebase references

- Routes: `frontend/app/` (149 `page.tsx` files)
- Plans: `frontend/lib/plans/plan-config.ts`
- Permissions: `backend/src/shared/permissions/community-roles.constants.ts`
- APIs: `frontend/lib/api/index.ts`
- Marketing data: `frontend/lib/data.ts`
- AI: `backend/src/domains/shared/ai/`, [ai-competitive-research.md](./ai-competitive-research.md)

### Research limitations

- Competitor AI pages change frequently; Nas.io rebranded toward **Nas.com** with storefront/ads positioning.
- Some features are plan-gated or beta — matrix uses publicly documented capabilities.
- Chabaqa “partial” (⚠️) means UI or schema exists but may lack full end-to-end flow — validate in QA before sales promises.

---

## Appendix A: Feature checklist for product planning

Use this checklist when grooming backlog items. Mark: `C` = Chabaqa has, `G` = gap, `P` = partial.

```
COMMUNITY
[C] Feed posts & comments          [G] Live rooms                    [G] Platform Discover marketplace
[C] Reactions & bookmarks          [G] Native livestream 10k+        [P] Polls
[C] DMs & community channels       [G] Webinar mode
[C] Member directory               [G] Custom profile fields
[C] Staff RBAC

LEARNING
[C] Courses HLS                    [G] Formal graded quizzes         [P] Certificates
[C] AI tutor (chat/summary/quiz)   [G] Peer review                   [C] Challenges
[C] Sequential unlock              [G] SCORM                         [C] Learning path AI
[C] Resources library              [G] Cohort waitlists              [C] Progress dashboard

COMMERCE
[C] 6 offer types in one hub       [G] BNPL checkout                 [C] Affiliates
[C] Stripe checkout                [G] Funnel builder                [C] Promo codes
[C] Payouts                        [G] 0% fee positioning (Nas)      [C] Wallet points
[C] Payouts                        [G] Whop-style marketplace

MARKETING
[C] Email campaigns                [G] Magic Ads                     [P] WhatsApp
[C] Inactivity automation          [G] Magic Content daily           [C] Custom domain/SEO
                                   [G] CRM behavioral segments

AI
[C] Course tutor                   [G] AI Agents packaged            [C] Creator insights
[C] Support AI                     [G] AI Workflows                  [P] Create with AI
[C] Learning path AI               [G] Activity scores               [G] MCP external access
                                   [G] Video repurposing studio

PLATFORM
[C] i18n                           [G] Branded mobile apps           [C] Platform admin
[C] Web push                       [G] SSO                           [G] Headless API
[C] Multi-community                [G] Zapier native                 [P] Integrations hub
```

---

## Appendix B: Suggested positioning statement

> **Chabaqa is the paid learning community platform built for creators in MENA** — combine memberships, courses, challenges, events, products, and coaching in one place, with local payments, AI that teaches your members, and operations tools that turn engagement into revenue. Unlike Circle, we speak your payment language. Unlike Nas.io, we keep members learning after launch.

---

*Document maintained by product/engineering. For AI-specific strategy, workflows, and agent specs, continue in [ai-competitive-research.md](./ai-competitive-research.md).*
