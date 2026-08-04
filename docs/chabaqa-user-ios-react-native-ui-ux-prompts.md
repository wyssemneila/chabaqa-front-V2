# Chabaqa User App — iOS React Native UI/UX Prompt Pack

## Purpose

This document is the source brief and prompt pack for rebuilding the **member/user-facing Chabaqa experience** as a React Native iOS app. It is based on an audit of the current Next.js frontend, especially its authentication, Explore, community member area, DMs, notifications, profiles, and settings.

It intentionally excludes creator dashboards, creator content-management tools, moderation, administration, analytics, payouts, and backend/API work.

The app must be a polished **UI-only prototype**:

- React Native + Expo + TypeScript.
- Local mock data only; no API calls, database, authentication provider, payment provider, sockets, upload service, or backend logic.
- Feature interactions must work locally: navigation, filtering, searching, sheets, tabs, likes, bookmarks, form validation, toggles, drafts, and optimistic mock mutations.
- Put all remote-data boundaries behind repository functions/services so real API integration can replace mock data later without redesigning screens.
- Support English first, with architecture ready for Arabic/RTL. Do not hard-code layout assumptions that break under RTL.

## What the existing web app contains

The present member experience has these product areas. The native version should keep the same information and intent while using iOS-native layout and interaction patterns.

| Area | Existing user features to retain in the mobile design |
| --- | --- |
| Authentication | Sign up, sign in, Google sign-in entry point, forgot/reset password, email verification, 6-digit two-factor verification, terms and privacy acknowledgement. |
| Explore | Browse communities, courses, challenges, products, 1:1 sessions, and events; search, categories, content-type filters, sort, featured items, ratings, creators, membership/access state, and pricing. |
| Community | Community switching, member feed, pinned posts, saved posts, create/edit/delete post, media/link/emoji attachments, mentions, reactions, comments, sharing, bookmarks, and community statistics. |
| Learning/content | Courses and course player, challenges and submissions, events, sessions, products, resources, reviews, learning path, progress, and achievements. |
| People and messaging | Member directory, role badges, profile entry points, start a DM, conversations list, thread search, attachments, reactions, pin/edit/delete message controls, read state, and temporary closed session chats. |
| Notifications | Notification bell/badge, notification inbox, unread state, mark-one/mark-all-read, delete, deep-link destination, and preferences. |
| Account | Own public profile, another member's profile, edit profile, social links, privacy, password and 2FA controls, notification preferences, data export placeholder, and account-deletion confirmation. |

### Web-to-native coverage matrix

This is the route-level translation for the user side of the existing frontend. A route group in parentheses is a Next.js implementation detail, not a user-visible URL.

| Existing web area | Native destination | Key UI retained |
| --- | --- | --- |
| `(auth)/signin` | Auth / Sign in | Email/password, password visibility, remember-me, Google entry point, error/success, 2FA branch. |
| `(auth)/signup` | Auth / Create account | Name/email/password confirmation, legal acknowledgement, validation. |
| `(auth)/forgot-password`, `reset-password` | Auth / Password recovery | Email request, reset form, validation and success state. |
| `(auth)/verify-email` | Auth / Verify email | Six-digit code, resend and change/back action. |
| `(onboarding)/onboarding` | Onboarding | Welcome, profile completion, interests and community suggestions. |
| `(landing)/explore`, `/search` | Explore tab / Search | Featured discovery, categories, types, search, filters, sorting, cards. |
| `(landing)/community/[slug]` | Explore / Community preview | Cover, community metadata, creator, ratings, public preview and reviews. |
| `(landing)/community/[slug]/checkout` | Join / checkout preview sheet | Plan/price/benefits/confirmation UI only. |
| `(community)/[creator]/[feature]/home` | Community / Feed | Continue learning, recommendations, feed, saved posts, composer and sidebar information. |
| `(community)/.../courses`, `courses/[courseId]` | Community / Courses and player | Catalogue, access state, curriculum, player, lesson progress, transcript/resources. |
| `(community)/.../challenges`, `challenges/[challengeId]` | Community / Challenges | Challenge catalogue, detail, task, resources, timeline, leaderboard and submissions. |
| `(community)/.../events`, `events/qr` | Community / Events and ticket | Event catalogue/detail, RSVP and mock QR ticket. |
| `(community)/.../sessions` | Community / Sessions | Session catalogue, availability, booking and temporary-message entry point. |
| `(community)/.../products`, `products/[productId]` | Community / Products | Product catalogue/detail, ownership and mock access purchase. |
| `(community)/.../resources/[resourceId]` | Community / Resource detail | Structured text/media/link/file resource, save/share/access state. |
| `(community)/.../members` | Community / Members | Searchable directory, role badges, profile navigation, DM action and leave-state UI. |
| `(community)/.../messages` | Messages tab / Thread | Inbox, search, unread, thread, attachments, reactions, editing, pinning and read state. |
| `(community)/.../progress`, `learning-path`, `achievements` | Community / Learning progress | Streak/progress, recommendations, goals, badges and completion states. |
| `(community)/.../reviews` | Community / Reviews | Ratings summary, review list and member review editor. |
| `(landing)/profile`, `profile/[slug]`, `profile/[slug]/edit` | Profile tab / Member profile / Edit profile | Cover/avatar, bio/details/socials, stats, edit and share. |
| `(landing)/settings` | Profile / Settings | Account, notification, privacy, security, data export and deletion groups. |
| `components/notifications/*` and community notification bell | Activity tab / Preferences | Notification inbox, badge, read/delete actions and granular preferences. |

### Existing component patterns translated for native

| Existing component family | Native replacement or equivalent |
| --- | --- |
| `CommunityHeader`, community switcher | Compact navigation header + community switcher bottom sheet. |
| `PostCard`, post-share dialog | `PostCard`, post composer sheet, comments screen, native share sheet/context menu. |
| `DMComponent`, messages page | Tab inbox + pushed conversation thread; no desktop overlay or multi-column pane. |
| `NotificationsBell`, `NotificationsInbox`, notification preferences | Activity tab badge, notification grouped list, settings preferences page. |
| `ProfileHeader`, `ProfileDetails`, social sidebar | Native profile header and grouped About/Social sections. |
| Course/challenge/event/product/session cards | One normalized content-card system with type-specific metadata and accent color. |
| Current web `ui/ios` primitives | Native RN equivalents: Pressable buttons, TextInput, Switch, SectionList, Modal/bottom sheet, segmented control and action sheet. |

## Scope boundaries

### In scope

- A signed-out experience and a signed-in member experience.
- Discovering and joining communities (the purchase/join flow is visual only).
- Content consumption and member participation.
- All user account, profile, DM, and notification surfaces.
- Complete loading, empty, error, locked, offline, and success states using mock data.

### Out of scope

- Creator dashboard and community creation.
- Admin, moderator, staff, financial, marketing, analytics, and support-console UIs.
- Real checkout, real uploads, push notifications, authentication, or APIs.
- A web layout copied into a phone frame. The app must be mobile-native.

## Product model and navigation

### Navigation map

```text
Launch
├── First run: Welcome / onboarding
│   ├── Sign up
│   └── Sign in
│       ├── Forgot password → reset password
│       ├── Email verification
│       └── Two-factor verification
└── Signed in: root tab shell
    ├── Explore
    │   ├── Search and filters
    │   ├── Community preview
    │   ├── Join / checkout preview
    │   └── Content detail: course, challenge, event, session, product
    ├── My communities
    │   └── Community stack
    │       ├── Feed and saved feed
    │       ├── Courses → course detail/player
    │       ├── Challenges → challenge detail/submission/leaderboard
    │       ├── Sessions, products, events and resources
    │       ├── Members → member profile → compose DM
    │       ├── Progress, learning path and achievements
    │       └── Community review list / write review
    ├── Messages
    │   └── Conversation → thread details
    ├── Notifications
    │   └── Notification preferences
    └── Profile
        ├── Edit profile
        ├── Settings
        ├── Privacy / security
        └── Account deletion confirmation
```

### Native navigation decision

Use a five-item iOS tab bar:

1. `Explore` — compass icon
2. `Communities` — person.3/folder-like community icon
3. `Messages` — bubble.left.and.bubble.right with unread badge
4. `Activity` — bell with unread badge
5. `Profile` — circular avatar

Every tab owns a native stack. Detail pages push horizontally, and contextual actions use a bottom sheet, iOS action sheet, popover, or full-screen modal—not desktop dropdowns. Preserve tab state when users switch between tabs.

## Visual direction: Chabaqa, expressed as iOS

The current brand’s principal purple is `#8E78FB`; its feature colors include cyan `#47C7EA`, pink `#F65887`, and orange `#FF9B28`. Use them as accents rather than making every screen a gradient card.

### Design tokens

| Token | Light value | Dark value | Usage |
| --- | --- | --- | --- |
| `accentPrimary` | `#7357E8` | `#A996FF` | Main CTA, selected tabs, links, focus. The darker light-mode purple meets contrast better than the web color. |
| `accentCyan` | `#1A9FC5` | `#65D5F2` | Courses, informational indicators. |
| `accentPink` | `#DB3B70` | `#FF86AA` | Sessions, social/celebratory state. |
| `accentOrange` | `#E87B12` | `#FFB45E` | Challenges, warning/progress. |
| `systemBackground` | `#F6F5FA` | `#12111A` | App canvas. |
| `groupedBackground` | `#FFFFFF` | `#1C1A2E` | Grouped card/list surface. |
| `labelPrimary` | `#1C1A2E` | `#F0EEFF` | Primary type. |
| `labelSecondary` | `#6E6982` | `#B8B2E0` | Supporting type. |
| `separator` | `#E6E1F2` | `#2E2A4A` | Hairline separators. |
| `success` | `#24A36B` | `#45D39A` | Completion/online state. |
| `danger` | iOS system red | iOS system red | Destructive controls only. |

### iOS style rules

- Use SF Pro, Dynamic Type, semantic colors, 44 × 44 pt minimum hit targets, safe-area insets, haptics on important confirmation actions, and VoiceOver labels/hints.
- Use 16 pt horizontal content gutters; 12–16 pt gaps; 12–16 pt corner radii for cards; large 20–24 pt radii only for feature hero cards and sheets.
- Prefer grouped lists, inset grouped settings rows, large iOS titles, native-style segmented controls, search bars, pull-to-refresh, swipe actions, and context menus.
- Keep shadows soft and rare. Use subtle separation, a 1 px separator, and hierarchy before adding a shadow.
- Use full-screen media previews; present short, contextual decisions from a bottom sheet.
- Show a 4 pt unread dot and a red numeric badge only where an exact count is helpful.
- Implement light and dark themes. Never encode a white background or black label directly in a component.

## App architecture prompt

Use this prompt before generating the app foundation:

```text
Build an iOS-first React Native app named Chabaqa using Expo and TypeScript. It is a UI-only member community app: no backend, no network requests, no real authentication, payments, uploads, analytics, or push notification implementation. Use local TypeScript mock repositories and an in-memory state store that simulate loading, empty, error, and successful states.

Use Expo Router or React Navigation with a root stack and a five-tab shell: Explore, Communities, Messages, Activity, Profile. Each tab has its own preserved stack. Use native iOS conventions: safe areas, large navigation titles, SF Symbols or a consistent icon package, iOS-style search, segmented controls, grouped lists, bottom sheets/action sheets, pull-to-refresh, swipe actions, haptics, Dynamic Type and VoiceOver-friendly labels. Support light/dark mode and prepare text/layout for English and Arabic RTL.

Create a small semantic design system with the Chabaqa palette: purple #7357E8, cyan #1A9FC5, pink #DB3B70, orange #E87B12, soft lavender backgrounds, and semantic success/danger colors. Do not make a web dashboard inside a mobile screen. Avoid gradients except for a restrained community cover/hero.

Organize code by feature: features/auth, explore, communities, feed, learning, messaging, notifications, profile, settings; shared/ui; shared/theme; mocks; services. Every mock service must expose an async interface that mirrors a future repository/API. Include no fetch, axios, websocket, or backend imports. Include a README that says exactly how to replace mocks later.
```

## Shared web/mobile authentication input contract

The current web forms are the source of truth for authentication inputs. The mobile app must use the same field meaning, requiredness, validation, input order, and request mapping. This prevents users from seeing two incompatible account-creation experiences.

### Sign in

| Display order | Shared field key | Required | Native iOS input behaviour | Submission mapping |
| --- | --- | --- | --- | --- |
| 1 | `email` | Yes | Email keyboard; no auto-capitalization, autocorrect, or spell-check; lower-case on submit. | `email` |
| 2 | `password` | Yes | Secure text entry; visibility toggle; no autocorrect or smart punctuation. | `password` |
| 3 | `rememberMe` | No, defaults to `false` | iOS switch or checkbox-style row labelled “Remember me”. | `remember_me` when a real transport is added. |

The mobile sign-in screen must retain the web flow’s Forgot password link, Google sign-in **entry point only**, 2FA branch, field-level error state, generic server-error state, and loading/disabled submit state. It must not add a username, phone, birth-date, or terms input to sign in.

### Sign up

| Display order | Shared UI key | Required | Web/mobile validation and behaviour | Future service payload |
| --- | --- | --- | --- | --- |
| 1 | `name` | Yes | 2–100 characters; letters, spaces, apostrophes, and hyphens. Use name keyboard/capitalization. | `name` |
| 2 | `email` | Yes | Valid email; 5–255 characters; normalize to lower case on submit. Disable autocorrect/capitalization. | `email` |
| 3 | `numtel` | No | Telephone keyboard; optional, but if provided must match the shared phone validation. | `numtel` |
| 4 | `dateNaissance` | No | Native date picker; user must be 13–120 years old. | Convert to ISO 8601 and send as `date_naissance`. |
| 5 | `password` | Yes | 8–128 characters; at least one uppercase, lowercase, number, and special character. Include visibility toggle and shared strength feedback. | `password` |
| 6 | `confirmPassword` | Yes in UI only | Must exactly match `password`; never send it in the request body. | Omit |
| 7 | `agreeToTerms` | Yes | Explicit unchecked consent control linking to Terms and Privacy. | UI gate only unless a future API explicitly adds a consent field. |

`username` is **not** an input in the current web registration form; do not add it to mobile sign up. Ask for a username later during the optional onboarding/profile-completion flow, or add it to both platforms together in a future product change.

### Related shared forms

| Flow | Shared inputs |
| --- | --- |
| Forgot password | `email` only, with the same email normalization/validation. |
| Reset password | Six-digit numeric `code`, `newPassword`, `confirmPassword`; same password rules and matching check. |
| Verify email | Six-digit numeric one-time code, autofill/paste support, resend cooldown. |
| Sign-in 2FA | Six-digit numeric `verificationCode`, attached to the email from the preceding sign-in attempt, resend option. |

### Synchronization rules

- Keep the canonical form names above in a shared `auth-contract` package/module. Each client may map only at its transport boundary, for example `dateNaissance` → `date_naissance` and `rememberMe` → `remember_me`.
- Reuse a platform-neutral validation specification. In this repository, mirror `frontend/lib/validation/auth.validation.ts`; do not independently invent mobile password, phone, age, or name rules.
- Keep the same field order. The native date picker replaces the web `date` input; a switch/checkbox row replaces the web checkbox without changing the underlying boolean.
- Mobile must never persist raw passwords or OTP codes in long-term local storage. “Remember me” is an intent to persist a future session, not permission to store password text.
- Apply copy changes to both platforms from shared translation keys where possible. Preserve the web’s meaningful error cases: invalid credentials, account not found, duplicate email, invalid registration details, rate limit, verification failed, and connection error.
- For the current UI-only React Native build, submit to local mock repositories that accept these exact request shapes and simulate the same outcomes.

### Mobile auth implementation prompt

```text
Update the Chabaqa React Native authentication forms to be input-compatible with the existing web forms. Treat this contract as canonical:

Sign in fields in order: email (required), password (required), rememberMe (optional boolean, default false). Sign up fields in order: name (required), email (required), numtel/phone (optional), dateNaissance/date of birth (optional), password (required), confirmPassword (required UI-only), agreeToTerms (required). Do not add username to sign up; username belongs to optional onboarding/profile completion.

Use the same validation: email is valid and 5–255 chars; name is 2–100 chars using letters/spaces/hyphens/apostrophes; optional phone is valid when supplied; birth date produces age 13–120; password is 8–128 chars with uppercase, lowercase, number, and special character; confirmation must match; terms consent must be true. Normalize email to lower case. Map only at the future API boundary: dateNaissance becomes date_naissance ISO date and rememberMe becomes remember_me; omit confirmPassword and agreeToTerms from the current web-equivalent signup payload.

Use native iOS input traits: email keyboard with no auto-capitalization/autocorrect, telephone keyboard, secure password fields with show/hide, native date picker, accessible consent row, six-cell numeric OTP with paste/autofill for verification/2FA/reset. Implement local mock submission only, inline errors, loading/disabled state, resend cooldown, and exact success/error paths. Do not use a real backend or authentication provider.
```

## Required mock entities

Generate typed mock data and async repositories around these entities. Use realistic Tunisian/North African and international names, English product text, credible dates, and believable counts. Do not use lorem ipsum.

```ts
type User = {
  id: string;
  name: string;
  username: string;
  email: string;
  avatarUrl: string;
  coverUrl?: string;
  bio: string;
  city?: string;
  country?: string;
  website?: string;
  instagram?: string;
  joinedAt: string;
  role: 'member' | 'owner' | 'admin' | 'moderator' | 'support';
  isOnline?: boolean;
  interests: string[];
};

type Community = {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverUrl: string;
  logoUrl: string;
  primaryColor: string;
  category: string;
  tags: string[];
  creator: User;
  memberCount: number;
  activeToday: number;
  rating: number;
  ratingCount: number;
  access: 'joined' | 'free' | 'paid' | 'request';
  price?: { amount: number; currency: 'TND' | 'USD'; cadence?: 'once' | 'month' | 'year' };
  verified: boolean;
};

type FeedPost = {
  id: string;
  communityId: string;
  author: User;
  title?: string;
  body: string;
  tags: string[];
  attachments: Array<{ id: string; type: 'image' | 'video' | 'link'; url: string; title?: string }>;
  createdAt: string;
  isPinned: boolean;
  isBookmarked: boolean;
  reactions: Array<{ emoji: string; count: number; reactedByMe: boolean }>;
  comments: Comment[];
};

type Conversation = {
  id: string;
  participant: User;
  lastMessage?: Message;
  unreadCount: number;
  isOpen: boolean;
  closeReason?: 'session_finished' | 'booking_cancelled' | 'booking_completed';
  pinnedMessageIds: string[];
};

type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  text?: string;
  sentAt: string;
  editedAt?: string;
  readAt?: string;
  isDeleted?: boolean;
  attachments: Array<{ id: string; kind: 'image' | 'video' | 'file'; name: string; url: string; size?: string }>;
  reactions: Array<{ emoji: string; userIds: string[] }>;
};

type AppNotification = {
  id: string;
  kind: 'like' | 'comment' | 'mention' | 'message' | 'course' | 'challenge' | 'event' | 'purchase';
  actor?: User;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  target: { route: string; params?: Record<string, string> };
};
```

Also provide mock entities for courses/chapters/progress, challenges/tasks/submissions/leaderboard, events/tickets, 1:1 sessions, products, resources, reviews, achievements, and the signed-in user’s settings. Seed enough data to make every state and screen look intentional.

## Shared component prompt

```text
Create a reusable Chabaqa iOS component library for React Native. Components must use semantic theme tokens, light/dark mode, Dynamic Type, accessibilityRole/accessibilityLabel, 44 pt minimum targets, and RTL-safe row direction/alignment. Do not depend on server data.

Include: AppScreen with safe area; LargeTitleHeader; CompactHeader; Avatar with online dot; VerifiedBadge; RoleBadge; CommunityLogo; CountBadge; ChabaqaButton (filled, tinted, plain, destructive); IconButton; SearchField; SegmentedControl; FilterChip; ContentTypePill; RatingRow; PriceLabel; EmptyState; ErrorState; Skeleton variants; LoadingOverlay; OfflineBanner; InlineNotice; SectionHeader; InsetGroup and SettingsRow; ToggleRow; DisclosureRow; BottomSheet; ActionSheet; ConfirmationSheet; Toast; PostCard; ComposerTrigger; ReactionBar; CommentRow; MediaGrid; AttachmentRow; ConversationRow; MessageBubble; DateSeparator; NotificationRow; ProgressRing; CourseCard; ChallengeCard; EventCard; ProductCard; MemberRow; ReviewCard; and PaywallPreview.

Interactions must be locally functional: pressed states, selected states, disabled states, sheet dismissal, toggles, filters, fake loading delay, optimistic likes/bookmarks/reactions/read state, and in-app toasts. Build Storybook-like demo data or a component gallery screen for visual QA.
```

## Screen prompts

### 1. Welcome and onboarding

```text
Design a warm, premium iOS welcome and onboarding flow for Chabaqa, a community platform where people learn, connect, buy content, attend events, and message fellow members. Use three concise onboarding pages with real-looking illustrations/abstract product shapes: Discover communities, Learn at your pace, and Grow with people. Show pagination dots, Skip, and Continue. The final screen has a purple primary button “Create account”, a plain secondary button “Sign in”, and a short terms/privacy acknowledgement.

After sign-up, show a four-step personalization flow: optional username; avatar and short bio; interests as selectable chips (business, design, technology, fitness, languages, creativity); and suggested communities. Keep account name collection in sign-up so this flow does not repeat it. Let the user skip nonessential fields. Include form error text, availability state for username, a success confirmation, and a subtle “You can change this later” message. Use a large title, generous whitespace, responsive keyboard avoidance, and local mock mutation only.
```

### 2. Authentication and recovery

```text
Create native iOS authentication screens for Chabaqa: sign in, create account, forgot password, reset password, verify email, and 2-factor verification. Use a large title navigation style, an optional small Chabaqa brand mark, grouped text fields with appropriate content types, password visibility control, inline validation, disabled/loading button states, and keyboard-safe layout.

Sign in: email, password, Remember me toggle, Forgot password link, purple “Sign in” button, divider, and “Continue with Google” UI-only button. Sign up must exactly match the existing web form: full name, email, optional phone number, optional date of birth, password, confirm password, then required terms/privacy consent. Do not add a username here; it belongs to optional onboarding. Email verification and 2FA each use a six-cell OTP input, resend countdown, change-email/back link, and clear error/success states. Simulate successful auth by routing into the signed-in tabs. Never call a backend or real Google provider.
```

### 3. Explore home

```text
Build the Explore tab for an iOS Chabaqa member app. Use a large title “Explore”, a native search bar, and a compact notification-free header because Activity has its own tab. Below it, show a horizontally scrolling featured carousel of verified communities/content, then a horizontal category chip row, then a segmented control for All / Communities / Courses / Challenges / Products / Sessions / Events. Add a Sort button that opens an iOS bottom sheet with Most popular, Newest, Top rated, Price low to high, and Price high to low.

The vertical feed contains diverse content cards. Every card shows a 16:9 cover, type pill, optional verified mark, title, concise description, creator avatar/name, rating/count if relevant, member count/duration/date as relevant, price/free label, and joined/access state. Make cards route to the appropriate detail screen. Support search, filters, sort, pull-to-refresh, skeleton loading, no-results empty state with Clear filters, and recoverable error state. Use mock repositories only.
```

### 4. Explore filters and search results

```text
Create an iOS search and filter experience for Chabaqa Explore. Tapping the search field opens a focused full-screen search screen with a Cancel button, recent searches, suggested topics, and type-ahead mock results. Add a filter sheet with content type, category, price (free/paid), rating, verified-only, and availability/date for events or sessions. Show applied filter count on the toolbar button. Use sticky “Show N results” and “Reset” controls in the sheet. Results must update locally, preserve scroll position when returning, and show a clear no-results state. The design should use iOS grouped controls and avoid desktop sidebars.
```

### 5. Community preview and join / checkout preview

```text
Create a public community preview screen for Chabaqa. Use a large immersive cover image with gradient scrim, community logo overlapping the cover, verified state, title, category/tags, creator identity, rating, members, and a short value proposition. The main CTA varies by mock access state: Join free, Request to join, or “Join for 29 TND/month”. Include a secondary share button.

Below, use a segmented control for About, Preview, and Reviews. About includes description, creator card, rules, and what is included. Preview includes sample posts, course lessons, events, and a locked-content treatment. Reviews includes rating breakdown, member reviews, and write-review entry only for mock joined users. Joining opens a native confirmation/checkout preview sheet: plan, price, benefits, mocked payment method row, legal copy, and confirm button. Confirmation changes local membership state, shows success haptic/toast, and routes into the community Feed. No real payment implementation.
```

### 6. My communities

```text
Design the Communities tab for a signed-in Chabaqa user. Use a large “My communities” title, search field, and two sections: Continue learning and Your communities. The Continue learning section is a horizontal carousel of course/challenge progress cards with progress bars and a Continue CTA. Your communities is an inset list or two-column adaptive card grid showing logo, name, category, active member count, unread activity indicator, and next event. Include a compact “Explore more communities” action.

Use local state to support pinned/reordered communities through a context menu. Include first-time empty state with “Explore communities”, skeleton loading, and a friendly error state. A selected community opens the community stack.
```

### 7. Community shell and feed

```text
Build the main signed-in Community experience for Chabaqa. At the top use a compact navigation bar with a tappable community logo/name that opens a community switcher sheet, a messages icon with unread badge, and an overflow menu. In the switcher show joined communities, active/current state, a search field, and an Explore communities action.

The Feed screen begins with an optional “Continue where you left off” card and up to four next-best-action cards. Add a composer trigger that contains the current avatar and prompt “Share an update, ask a question…”. Feed controls include a segmented control for For you / Latest / Saved; optionally add a small pinned-post section. Use PostCard components with pull-to-refresh, infinite-scroll mock pagination, skeletons, and an empty Saved state.

Add a community overflow sheet with About, Members, Courses, Challenges, Events, Products, Sessions, Progress, Reviews, Settings/report actions as appropriate. Make it a member experience only; do not include creator or moderator tools.
```

### 8. Post composer, post card, comments, and sharing

```text
Create the Chabaqa community post interaction set as native iOS UI. The composer opens as a modal sheet with a close button, author avatar, multiline text area, optional title, topic/tag chips, mention autocomplete from mock members, attachment tray (photo, video, link), emoji picker trigger, audience label “Community members”, and a disabled/enabled Publish button. Keep attachment handling local: selecting a mock item shows a preview; never upload.

Create a PostCard with author avatar/name/role/verified state, time, pinned label, overflow menu, optional title/body, media grid or link preview, reaction summary, and actions React, Comment, Share, Save. Long press the reaction action to open an emoji strip. Let local state update counts/bookmark/reactions. The overflow menu contains Edit/Delete for the author and Report/Hide for others. Use a destructive confirmation sheet before delete.

Tapping Comment opens a full-screen discussion view: original post at top, ordered comments/replies, mentionable input docked above the keyboard, send button, date separators where useful, empty/error/loading states, and mocked create/edit/delete comment actions. Share opens the native share sheet if available or a local share-preview sheet with Copy link and Send in Chabaqa options.
```

### 9. Community members and member profile

```text
Create a Community Members screen for Chabaqa. Use a compact community-colored summary header showing member, owner, admin, moderator, and support counts. Below it place an iOS search field and role filter chips. Members appear as performant list rows with avatar, online dot, name, username, role badge, optional short bio/location, and a trailing Message button. Give each row a context menu with View profile, Message, and Report.

Create a member profile screen that works for both the current user and another member. It has a cover image, circular avatar, name, verified/role badge, username, bio, location, website/social links, joined date, mutual communities, interests, and their recent visible posts. For another member show Message and share buttons. For the owner show Edit profile. Keep private fields hidden from public/member profiles. Include loading, unavailable, and blocked-user states using mocks.
```

### 10. Messages inbox

```text
Design the Messages tab of Chabaqa as an iOS conversation inbox. Use the large title “Messages”, a compose icon, search bar, and segmented control All / Unread. The list has avatar with online dot, participant name, last-message preview, timestamp, unread badge, attachment indicator, and a pin icon. Support swipe actions: Mark read/unread, Pin, and Delete; include matching context-menu actions.

Show a useful empty state with an illustration and “Meet people in your communities” action that routes to Members. Show a different filtered-empty state for Unread. A compose sheet includes searchable joined-community members and starts a local conversation. Do not use a desktop three-column layout.
```

### 11. Conversation thread

```text
Build a detailed iOS direct-message thread for Chabaqa. The navigation title shows recipient avatar/name and an online state; tapping it opens a profile/thread-details screen. Render date separators, incoming/outgoing message bubbles, inline image/file/video attachment cards, read receipt on the last outgoing message, edited label, reactions, and delivery/typing mock states. Keep the composer fixed above the keyboard with attachment, camera placeholder, text field, and send button.

Long-press a message to show a native context menu with emoji reactions, Reply, Copy, Edit/Delete for own messages, Pin/Unpin, and Report for other messages. Implement local optimistic updates. The thread-details screen includes Search in conversation, Pinned messages, Shared files, notification mute toggle, View profile, and block/report actions. For closed temporary session chats, replace the composer with a clear neutral explanation and preserve read-only history.
```

### 12. Notifications and preferences

```text
Create the Activity tab for Chabaqa notifications. Use large title “Activity”, an unread count, a Mark all as read text action, and an optional segmented control All / Unread. Group rows by Today, This week, and Earlier. Each row has an icon or actor avatar, short rich-text message, time, unread dot/background tint, and an accessible tap target. Notification categories include reactions/comments/mentions, DM, course progress, challenge, event reminder, and purchase/community update. Tapping routes through its mocked target; swipe left reveals Mark read and Delete.

Add a notification preferences screen using inset grouped iOS settings. Include master Push and Email toggles, then granular Community activity, Messages, Event reminders, Course/challenge updates, Marketing, and Quiet hours. Changes should save only to local state with a small confirmation toast. Include a Push permission educational state rather than invoking device permissions.
```

### 13. Courses and course player

```text
Create member-facing course browsing and a course player for Chabaqa. The course list has an optional featured course hero, Continue learning section, search/filter controls, and course cards showing cover, title, educator/community, level, lesson count, duration, progress, access status, and rating. A course detail shows hero cover, progress, description, educator card, curriculum grouped into modules, resources/reviews tabs, and a primary Continue/Start button. Locked lessons must clearly show lock icon, preview copy, and an access CTA.

The player is a full-screen or pushed viewing screen with a 16:9 mock video area, play/pause/scrubber/speed/captions controls, lesson title, previous/next lesson, completion action, downloadable resource list, notes tab, transcript tab, and course outline sheet. Use local watch-progress state and mark lessons completed. Do not implement video streaming or downloads.
```

### 14. Challenges, submissions, and achievements

```text
Create native iOS Chabaqa challenge screens. The challenge list uses segmented controls Active / Upcoming / Completed and cards with image, title, duration, participant count, progress, remaining days, and status. Challenge detail has a bold hero, join/continue CTA, task-of-the-day, progress ring, timeline, resource list, participant avatars, rules, and tabs Overview / Leaderboard / Submissions.

The submission flow is a modal sheet with title, description, optional mock attachment preview, visibility choice, and Submit button; include validation and submitted confirmation. Leaderboard rows show rank, avatar, name, score, movement indicator, and the signed-in user pinned/visually located. The achievements screen uses a profile summary, earned badges, locked badges, streak, completion stats, and a celebratory but restrained completion state. All data/actions are local mocks.
```

### 15. Events, tickets, and sessions

```text
Create Events and 1:1 Sessions member experiences for Chabaqa. Events use a calendar/list toggle, date chips, search, and event cards with cover, time, location/online state, host, RSVP state, capacity, and price/free label. Event detail includes a cover, title, host/community, date/time converted to local time, address or online label, description, agenda, guests, map placeholder, Add to calendar UI-only control, RSVP/Cancel RSVP button, and share. After RSVP, show a ticket screen with a mocked QR code, attendee name, event details, and an offline-looking saved-ticket state.

For 1:1 sessions, show availability cards, expert profile, duration, price, and a booking flow with date selection, time slots, notes, confirmation, and cancellation confirmation. The booking result shows a session card and provides a message thread entry point. Everything is mock-only and should never call calendars, payments, or conferencing APIs.
```

### 16. Products, resources, reviews, and access states

```text
Build native member UI for products, resources, and reviews in a Chabaqa community. Product list cards show image, type, creator, price, rating, and ownership/access state. Product detail includes gallery, description, included items, creator card, reviews, and Buy/Access CTA. Buying is a local checkout-preview sheet only; confirmation changes local ownership state.

Resource detail supports richly structured content: title, type, author, updated date, blocks of formatted text, images, embedded-video placeholder, link cards, downloadable-file placeholder, table of contents, save/bookmark, and share. Include locked and not-found states.

Reviews screen includes rating summary, distribution bars, sort chips, review cards, and an authenticated member write/edit review modal with star selector and text validation. Make all reviews mock data and update the local rating summary after submit.
```

### 17. Progress, learning path, and saved content

```text
Create an iOS progress area for a Chabaqa member. The overview shows current streak, weekly learning activity, completed lessons/challenges, learning hours, and a Continue learning section. Use native-feeling cards, progress rings, and accessible chart alternatives; do not overuse graphs. Learning path lets the user add goals/interests and displays a recommended sequence of courses, challenges, events, and resources, with a reason for each recommendation and an Add to my path action.

Add Saved content as a reusable screen accessible from the community feed/profile: filters for Posts, Courses, Products, and Resources; saved cards; remove-from-saved swipe/context action; loading/empty/error states. All mutations must be local.
```

### 18. Profile editing and account settings

```text
Create the signed-in Chabaqa Profile and Settings experience. The Profile tab uses a large profile header with cover photo, avatar, display name, username, edit button, share menu, bio, interests, social links, community stats, achievements preview, and saved-content entry point. The owner sees their account data; other people see the public member profile screen instead.

Edit profile is a form with avatar/cover mock pickers, name, username, bio character count, city, country, website, Instagram, and interests. Show unsaved-change protection, validation, save loading state, and success toast. Do not use a real image picker/upload service; use a local asset selector.

Settings uses native inset grouped sections: Account (email, password, data export placeholder), Notifications, Privacy (profile visibility, show email, show phone, who can message), Appearance (system/light/dark), Language, Security (two-factor toggle, devices placeholder), and Danger zone. Password change has current/new/confirm fields and strength/help text. Account deletion uses a destructive confirmation flow requiring the user to type DELETE. No backend calls; changes persist only in the app’s local mock state.
```

## State and interaction requirements

Every screen must consciously define its states. Do not leave a blank area while mocked data “loads.”

| State | Required treatment |
| --- | --- |
| Initial loading | Skeleton that resembles final content, not a centered spinner only. |
| Pull-to-refresh | Native refresh control and local re-seeded/reloaded data. |
| Empty | Specific explanation, relevant icon/illustration, one clear action. |
| Error | Plain-language explanation, Retry action, and preserved existing content if possible. |
| Offline | Non-blocking top banner; cached mock content remains viewable. |
| Locked/paid | Explain benefit and show a visual-only access CTA; never misrepresent access as available. |
| Form validation | Inline field message, error color and accessible announcement; retain entered values. |
| Optimistic action | Update immediately for likes, saves, reads, reactions, RSVPs, and toggles; provide Undo/toast when useful. |
| Destructive action | Use native confirmation sheet and clear irreversible language. |
| Permission-adjacent | Explain why push, photo, camera, or calendar would be needed; do not request real OS permission in this UI-only build. |

## Accessibility and localization acceptance criteria

- All controls have a text or explicit VoiceOver label. Icon-only buttons also have a hint where the effect is not obvious.
- Touch targets are at least 44 × 44 pt, including reaction and overflow controls.
- The app works at large Dynamic Type sizes without clipping a card title, message bubble, settings label, or button label.
- Color never conveys unread, selected, completed, locked, or destructive state by itself; use text, icon, or shape too.
- Respect Reduce Motion: avoid essential meaning in animation; make celebratory animation optional/subtle.
- Every screen is usable in dark mode.
- Test English LTR and Arabic RTL. Reverse visual direction and leading/trailing placement with logical properties; do not reverse media playback or numeric/time formatting.

## Mock integration contract

Use this pattern throughout the generated UI so real services can replace data later:

```ts
export interface CommunityRepository {
  listJoined(): Promise<Community[]>;
  listExplore(filters: ExploreFilters): Promise<Paginated<ExploreItem>>;
  getById(id: string): Promise<Community>;
  join(id: string): Promise<Community>;
}

// Current implementation: mocks/communityRepository.ts
// Future implementation: api/communityRepository.ts
// Screens import only the interface-backed repository hook.
```

Rules:

- Simulate 300–900 ms delays only in development/demo mode.
- Offer a debug-only state switcher that can force loading, empty, error, locked, and offline states for QA.
- Keep mock image URLs/assets in one central file. Every image needs an accessible label/fallback.
- Make mutations deterministic and reversible when feasible. Persist local demo state with AsyncStorage only if desired; it must be safe to clear.
- Do not include API URLs, tokens, secret files, request interceptors, OAuth credentials, Stripe keys, or socket setup.

## Final implementation prompt

Use this prompt after the foundation and screen prompts if one agent is expected to build the whole UI:

```text
Implement the complete member-facing Chabaqa React Native iOS UI described in this brief. Use Expo and TypeScript. Build all navigation, shared components, mocked repositories, mock data, and local interactions needed to demonstrate the product end to end. Include auth/onboarding, Explore/search/filtering, community preview/join flow, My communities, community feed/posts/comments, members/member profile, DMs, notifications/preferences, courses/player, challenges/submissions/achievements, events/tickets, sessions, products/resources/reviews, progress/learning path, profile edit, and account settings.

Do not implement creator/admin interfaces or backend/API functionality. Do not issue network requests. Keep each feature’s data access behind typed async repositories backed by local mocks so future APIs can replace them. Prioritize iOS-native patterns and polished states over feature breadth: safe areas, tab and stack navigation, large titles, grouped lists, search, bottom sheets, pull-to-refresh, context menus, swipe actions, Dynamic Type, VoiceOver, dark mode, and RTL readiness.

Use Chabaqa’s purple/cyan/pink/orange brand palette as restrained semantic accents. Deliver a working UI demo with a README, a clear folder structure, type-safe models, an optional debug state switcher, and no placeholder lorem ipsum. Verify every screen has loading, empty, error, and meaningful mock-content states.
```

## Audit references in the current frontend

This brief was derived primarily from the following source areas so future implementation work can trace requirements back to the existing product:

- `frontend/app/(auth)` — sign-in, sign-up, recovery, verification and 2FA interfaces.
- `frontend/app/(landing)/explore` and `frontend/lib/explore-*` — explore item types, categories, filters, prices, ratings, access and sorting.
- `frontend/app/(community)/components` — community header/switcher, notifications bell, post card, share UI and DM entry points.
- `frontend/app/(community)/[creator]/[feature]/(loggedUser)` — member home/feed, courses, challenges, events, products, sessions, members, messages, resources, progress, achievements and reviews.
- `frontend/components/notifications` and `frontend/components/profile` — notification inbox/preferences and profile surfaces.
- `frontend/app/(landing)/settings` — profile, notification, privacy, security, data export and deletion controls.
- `frontend/app/globals.css` — Chabaqa visual tokens: primary purple `#8E78FB`, cyan `#47C7EA`, pink `#F65887`, orange `#FF9B28`, dark theme tokens, RTL and reduced-motion support.
