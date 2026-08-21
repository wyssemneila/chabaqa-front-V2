# Plan 01: Chabaqa AI Staff + AI Cofounder (Object Creation)

**Status:** Draft  
**Priority:** P0 (Wave 1)  
**Competitive parity:** Circle AI Agents, Nas.io AI Cofounder, Kajabi AI Creator Hub  
**Related code:** `backend/src/domains/shared/ai/`, `frontend/app/(creator)/creator/ai/`

---

## 1. Objectives

1. **Package** existing AI (tutor, support, insights, create-with-me) as a unified **“Chabaqa AI”** product surface.
2. Ship **configurable AI Staff** (agents) per community with avatar, tone, knowledge scope, and channel visibility.
3. Extend **AI Cofounder** to create **draft domain objects** (not JSON previews only) and optional **publish-after-review** flows.
4. Align usage limits with creator **`PlanTier`** (`starter` | `growth` | `pro`), not community `priceType`.

---

## 2. Current state (codebase audit)

| Component | Path | State |
|-----------|------|--------|
| AI tutor | `ai-tutor.service.ts`, `ai.controller.ts` | ✅ Production |
| Create with AI | `ai-create.service.ts`, `POST /ai/create-with-me` | ✅ Returns draft JSON; frontend copy/save partial |
| AI settings | `community.schema.ts` → `AiSettings`, `ai-settings.controller.ts` | ✅ 3 booleans only |
| AI hub UI | `creator/ai/page.tsx`, `creator/ai/create/page.tsx` | ✅ Basic |
| Support AI | `live-support-ai.service.ts` | ✅ `supportAgentEnabled` not wired to gate |
| Creator insights | `creator-insights.service.ts` | ✅ Growth+ in UI |
| Usage limits | `ai-usage.service.ts` | ⚠️ Uses community pricing tier, not `PlanTier` |
| Plan enforcement on AI endpoints | — | ❌ Missing |

**Gap vs. competitors:** No agent registry, no knowledge index, no multi-agent UI, no “Build my community” flow, no launch plan object, cofounder doesn’t call existing `create` services.

---

## 3. Target product experience

### 3.1 Information architecture

```
/creator/ai                          → Chabaqa AI Home (overview, usage, quick actions)
/creator/ai/staff                    → AI Staff roster (list agents)
/creator/ai/staff/new               → Agent wizard
/creator/ai/staff/[agentId]         → Agent config + analytics
/creator/ai/cofounder               → Cofounder workspace (tabs)
  ├─ Build community
  ├─ Create offer
  ├─ Launch plan
  ├─ Fix funnel (analytics-linked)
  └─ Grow community
/creator/ai/create                   → (existing) redirect or embed in cofounder
/creator/ai/usage                   → Usage & limits by plan
```

### 3.2 AI Staff roles (v1)

| Agent type | Member surfaces | Knowledge sources | Escalation |
|------------|-----------------|-------------------|------------|
| **Community Concierge** | Community sidebar, `/home` help | Rules, welcome, catalog index | → Support queue |
| **Course Tutor** | Course player (existing widget) | Chapter content | — |
| **Challenge Coach** | Challenge detail | Tasks, rules, FAQ | → Creator |
| **Support Agent** | Live support widget | KB articles, policies | → Human admin |
| **Sales Assistant** | Public community page, checkout | Offers, pricing, FAQs | — |

### 3.3 Cofounder flows (v1)

| Flow | Input | Output objects |
|------|-------|----------------|
| Build community | Niche, audience, promise, price | Draft `Community` + landing copy + 3 posts |
| Create offer | Type + idea (existing create-with-me) | Draft `Cours` / `Challenge` / etc. via **existing create DTOs** |
| Launch plan | 7/14/30 days | `AiLaunchPlan` doc + email campaign drafts |
| Fix funnel | Selected content + analytics snapshot | Insights + suggested copy + optional campaign draft |
| Grow | Community id | Inactive member list + reactivation campaign draft |

---

## 4. Design specification (frontend-design skill)

### 4.1 Aesthetic direction: **“Studio control room”**

- **Tone:** Refined utilitarian — creators feel they operate a small team of specialists, not a generic chatbot.
- **Layout:** Left rail = agent roster (avatars); center = conversation/workspace; right = context panel (knowledge sources, usage meter, actions).
- **Typography:** Keep platform body font; use **distinctive display** for agent names only (e.g. existing community heading font or `fontFamily` from customize).
- **Color:** Neutral stone background (`bg-stone-50` / dark `stone-950`); accent = community `primaryColor` when community selected; AI actions use a single consistent accent (teal-600 or amber-600 — pick one globally for AI, not purple).
- **Motion:** Staggered card reveal on AI home load; step wizard slide for cofounder; no bouncing loaders.
- **Trust:** Persistent badge `AI · Review before publish` on all generated drafts.

### 4.2 Key components (new)

| Component | Location |
|-----------|----------|
| `AiShellLayout` | Wraps all `/creator/ai/*` |
| `AgentCard` | Roster grid |
| `AgentWizard` | 4 steps: role → personality → knowledge → surfaces |
| `CofounderWorkspace` | Tabbed shell |
| `DraftReviewPanel` | Side-by-side AI draft vs. editable form |
| `AiUsageMeter` | Progress bar + reset date |
| `MemberAiBadge` | Pill on tutor/support messages |

### 4.3 Member-facing

- Floating **Help** entry with agent avatar (if Concierge enabled).
- Course tutor: retain `ai-tutor-widget.tsx`; add citation chips + “Ask Concierge” link when stuck.

---

## 5. Data models (MongoDB)

### 5.1 `AiAgent` schema

**File:** `backend/src/infrastructure/database/schemas/ai/ai-agent.schema.ts`

```typescript
// Fields (conceptual)
communityId: ObjectId
creatorId: ObjectId
type: 'concierge' | 'tutor' | 'challenge_coach' | 'support' | 'sales'
name: string
avatarUrl?: string
bio?: string
tone: 'friendly' | 'professional' | 'direct' | 'coach'
languages: string[]           // e.g. ['ar', 'fr', 'en']
systemPromptOverride?: string // max 2000 chars, optional
knowledgeSourceIds: ObjectId[] // refs AiKnowledgeDocument
enabledSurfaces: ('community' | 'course' | 'challenge' | 'checkout' | 'support')[]
escalation: {
  enabled: boolean
  target: 'support_queue' | 'creator_dm' | 'staff_role'
  staffRole?: 'admin' | 'support'
}
modelSettings?: { temperature?: number; maxTokens?: number }
status: 'active' | 'paused'
stats: { conversations: number; escalations: number; lastActiveAt?: Date }
createdAt, updatedAt
```

**Indexes:** `{ communityId: 1, type: 1 }`, `{ communityId: 1, status: 1 }`

### 5.2 `AiKnowledgeDocument` schema

**File:** `backend/src/infrastructure/database/schemas/ai/ai-knowledge-document.schema.ts`

```typescript
communityId: ObjectId
sourceType: 'community_page' | 'course' | 'chapter' | 'post' | 'resource' | 'faq' | 'policy' | 'product' | 'event'
sourceId: string
title: string
extractedText: string        // max ~50k chars per doc; chunk in v2
visibility: 'member' | 'public' | 'staff'
embedding?: number[]         // optional v2 vector search
contentHash: string          // invalidate on source update
updatedAt
```

### 5.3 `AiConversation` (agent chats, distinct from tutor)

```typescript
agentId, communityId, userId
messages: [{ role, content, citations?, createdAt }]
status: 'open' | 'escalated' | 'closed'
escalatedTicketId?: ObjectId
```

### 5.4 `AiLaunchPlan` schema

```typescript
communityId, creatorId
durationDays: 7 | 14 | 30
tasks: [{ day, title, description, actionType, linkedDraftId? }]
emailDraftIds?: ObjectId[]
status: 'draft' | 'active' | 'completed'
```

### 5.5 `AiActionLog` schema (audit)

Per [ai-competitive-research.md](../ai-competitive-research.md): actor, actionType, target, model, promptVersion, approvedBy.

### 5.6 Extend `AiSettings` on community

```typescript
// Add to community.schema.ts AiSettings
agentsEnabled: boolean
defaultConciergeAgentId?: ObjectId
cofounderEnabled: boolean
```

---

## 6. Backend implementation

### 6.1 New module structure

```
backend/src/domains/shared/ai/
  agents/
    ai-agent.controller.ts
    ai-agent.service.ts
    ai-agent-chat.service.ts
    ai-knowledge-indexer.service.ts
    dto/
  cofounder/
    ai-cofounder.controller.ts
    ai-cofounder.service.ts          // orchestrates create + community build
    ai-launch-plan.service.ts
  ai-publish.service.ts              // maps drafts → existing domain services
```

Register in `ai.module.ts`; export services for live-support integration.

### 6.2 API contract

#### AI Staff

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/communities/:id/ai/agents` | Creator staff | List agents |
| POST | `/communities/:id/ai/agents` | Creator staff | Create agent |
| PATCH | `/communities/:id/ai/agents/:agentId` | Creator staff | Update |
| DELETE | `/communities/:id/ai/agents/:agentId` | Creator staff | Soft delete |
| POST | `/communities/:id/ai/agents/:agentId/chat` | Member | Send message (RAG) |
| GET | `/communities/:id/ai/agents/:agentId/conversations` | Creator | Inbox |
| POST | `/communities/:id/ai/knowledge/reindex` | Creator | Trigger index rebuild |
| GET | `/communities/:id/ai/knowledge/status` | Creator | Index job status |

#### Cofounder

| Method | Path | Description |
|--------|------|-------------|
| POST | `/ai/cofounder/build-community` | Draft community package |
| POST | `/ai/cofounder/launch-plan` | Launch plan object |
| POST | `/ai/cofounder/fix-funnel` | Uses analytics service input |
| POST | `/ai/cofounder/grow` | Inactive members + campaign draft |
| POST | `/ai/cofounder/publish-draft` | Body: `{ draftType, draftPayload, confirm: true }` |

#### Extend existing

| Path | Change |
|------|--------|
| `POST /ai/create-with-me` | Add `communityId`, `saveAsDraft: boolean`; call `ai-publish.service` when true |
| `GET/PATCH /communities/:id/ai/settings` | Include agents/cofounder flags |
| All AI POST routes | `@UseGuards` + `PolicyService.assertAiQuota(creatorId, action)` |

### 6.3 `AiKnowledgeIndexerService`

**Triggers:**
- On agent save (async job)
- Nightly cron per active community
- Webhook from course/post publish (event emitter)

**Pipeline:**
1. Load permitted sources for agent type.
2. Strip HTML, truncate, compute `contentHash`.
3. Upsert `AiKnowledgeDocument`.
4. (v2) Chunk + embed via OpenRouter embedding model or external.

**RAG query (`AiAgentChatService`):**
1. Load last N messages.
2. Retrieve top-K docs by keyword (v1) or vector (v2) filtered by `communityId` + visibility.
3. Build system prompt from agent config + retrieved snippets.
4. Call OpenAI client (reuse `ai-create.service` client config).
5. Return answer + `citations: [{ sourceType, sourceId, excerpt }]`.
6. Log to `AiActionLog`.

### 6.4 `AiPublishService` (object creation)

Map validated AI JSON → existing services:

| Draft type | Target service | Existing entry |
|------------|----------------|----------------|
| course | `CoursService.create` | `domains/learning/course/` |
| challenge | `ChallengeService.create` | `domains/learning/challenge/` |
| event | `EventsService` | `domains/commerce/event/` |
| product | `ProductService` | `domains/commerce/product/` |
| session | `SessionService` | `domains/learning/session/` |
| community | `CommunitiesService.create` | `domains/community/communities/` |
| post | `PostService` | `domains/content/post/` |
| email_campaign | `EmailCampaignService` | `communication/email-campaign` |

**Rules:**
- Always create as `status: draft` / `published: false` where schema supports.
- Never charge or publish without `confirm: true` in request.
- Validate with **strict Zod/class-validator schemas** per type (reuse create DTOs).

### 6.5 Plan gating (`PolicyService` extension)

Add to `plan.schema.ts` / `plan-config.ts`:

```typescript
aiAgentsMax: number;           // starter: 1, growth: 3, pro: 10
aiCofounderRunsPerMonth: number;
aiKnowledgeReindexPerMonth: number;
aiStaffChatTurnsPerMonth: number; // community aggregate
```

Implement `assertAiQuota(creatorId, 'agent_create' | 'cofounder_run' | 'staff_chat')`.

Fix `ai-usage.service.ts` to read creator subscription tier from `Subscription` model, not community `priceType`.

### 6.6 Environment variables

```bash
AI_AGENT_MODEL=google/gemini-2.5-flash-lite
AI_AGENT_MAX_CONTEXT_DOCS=8
AI_KNOWLEDGE_MAX_CHARS_PER_DOC=12000
AI_COFOUNDER_PUBLISH_ENABLED=true
AI_STAFF_ESCALATION_WEBHOOK=   # optional
```

---

## 7. Frontend implementation

### 7.1 API client

**File:** `frontend/lib/api/ai-agents.api.ts`

```typescript
export const aiAgentsApi = {
  list(communityId), create, update, remove,
  chat(communityId, agentId, message),
  reindexKnowledge(communityId),
  getUsage(communityId),
}
export const aiCofounderApi = {
  buildCommunity(payload),
  createLaunchPlan(payload),
  fixFunnel(payload),
  growCommunity(communityId),
  publishDraft(payload),
}
```

Register in `frontend/lib/api/index.ts`.

### 7.2 Pages & routes

| Route | File | Notes |
|-------|------|-------|
| `/creator/ai` | Refactor `ai/page.tsx` | Dashboard cards → Staff, Cofounder, Tutor, Usage |
| `/creator/ai/staff` | New | Agent roster |
| `/creator/ai/staff/new` | New | Wizard |
| `/creator/ai/staff/[id]` | New | Edit + test chat |
| `/creator/ai/cofounder` | New | Tab workspace |
| `/creator/ai/create` | Keep | Link from cofounder “Create offer” tab |

### 7.3 Community member UI

| Surface | File |
|---------|------|
| Concierge widget | `components/ai/concierge-widget.tsx` |
| Challenge coach | Extend challenge detail page |
| Sales assistant | `community/[slug]/page.tsx` embed |

### 7.4 Sidebar

Update `dashboard-sidebar.tsx`:

```text
Chabaqa AI
  ├─ Overview
  ├─ AI Staff
  ├─ Cofounder
  ├─ Create with AI
  └─ Usage & limits
```

---

## 8. Phased delivery

### Phase 1 (2 weeks) — Package & gate
- [ ] Refactor `/creator/ai` home with usage meter
- [ ] Wire `PolicyService` AI quotas to tutor + create-with-me
- [ ] Fix usage tier mapping to `PlanTier`
- [ ] Rename strings: “Chabaqa AI”, “AI Cofounder”
- [ ] `AiActionLog` schema + log create-with-me calls

### Phase 2 (3 weeks) — Cofounder publish
- [ ] `AiPublishService` for course, challenge, product, event, session
- [ ] `publish-draft` endpoint with confirmation modal
- [ ] Cofounder UI: draft review + “Save as draft” / “Open in editor”
- [ ] `build-community` returns structured draft (no auto-publish)

### Phase 3 (3 weeks) — AI Staff v1
- [ ] `AiAgent` CRUD + wizard UI
- [ ] Knowledge indexer v1 (keyword retrieval)
- [ ] Concierge chat endpoint + widget
- [ ] Wire `supportAgentEnabled` to live-support prompt selection

### Phase 4 (2 weeks) — Launch plan & grow
- [ ] `AiLaunchPlan` schema + UI
- [ ] `grow` flow → email campaign draft via existing email service
- [ ] `fix-funnel` integrates `creatorAnalytics.getFunnel` + insights

### Phase 5 (2 weeks) — Challenge coach + sales agent
- [ ] Challenge coach on challenge pages
- [ ] Sales assistant on public checkout
- [ ] Agent analytics tab (conversations, escalation rate)

---

## 9. Testing

| Layer | Tests |
|-------|-------|
| Unit | `ai-publish.service.spec.ts` — DTO mapping, reject invalid drafts |
| Unit | `ai-agent-chat.service.spec.ts` — RAG citation shape |
| E2E | Playwright: cofounder create course → appears in drafts list |
| E2E | Member asks concierge → receives citation |
| Load | Rate limit: 429 after quota exceeded |

**Postman:** `docs/postman/ai-staff.postman_collection.json`

---

## 10. Acceptance criteria

- [ ] Creator on Growth+ can create ≥3 agent types and test chat in preview.
- [ ] Cofounder generates course draft and saves to DB as unpublished course visible in `/creator/courses`.
- [ ] All AI generations show “Review before publish”; publish requires explicit confirm.
- [ ] Usage dashboard shows remaining cofounder runs and staff chats per plan.
- [ ] Member concierge only accesses knowledge for their community; no cross-tenant leak (integration test).
- [ ] Tutor remains functional when `courseTutorEnabled` true; independent of concierge agent.

---

## 11. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| AI publishes broken content | Draft-only default; validate against create DTOs |
| RAG hallucination on payments | Block agent from stating prices except retrieved snippets |
| Cost explosion | Hard quotas per plan; cache knowledge index |
| Scope creep (workflows) | Defer to Plan 12 / separate workflow epic |

---

## 12. File checklist (implementation)

**Backend create:**
- `schemas/ai/ai-agent.schema.ts`
- `schemas/ai/ai-knowledge-document.schema.ts`
- `schemas/ai/ai-conversation.schema.ts`
- `schemas/ai/ai-launch-plan.schema.ts`
- `schemas/ai/ai-action-log.schema.ts`
- `agents/*.ts`, `cofounder/*.ts`, `ai-publish.service.ts`

**Backend modify:**
- `community.schema.ts` (AiSettings)
- `plan.schema.ts`, `seed-plans.ts`, `policy.service.ts`
- `ai-usage.service.ts`
- `ai.module.ts`
- `live-support-ai.service.ts` (agent config injection)

**Frontend create:**
- `app/(creator)/creator/ai/staff/**`
- `app/(creator)/creator/ai/cofounder/**`
- `components/ai/**`
- `lib/api/ai-agents.api.ts`

**Frontend modify:**
- `creator/ai/page.tsx`, `dashboard-sidebar.tsx`
- `lib/plans/plan-config.ts`
- `messages/en.json` (+ fr, ar)
