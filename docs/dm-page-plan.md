# Chabaqa DM Page Plan (Instagram-Style)

## 1) Current DM System Snapshot (Frontend + API)

### Frontend (existing)
- Popup UI: `chabaqa-frontend/app/(community)/components/dm-dropdown.tsx`
  - Portal dropdown panel, mobile full-screen, desktop floating box.
  - Fetches inbox via `api.dm.listInbox()`.
  - Fetches messages via `api.dm.listMessages(conversationId)`.
  - Sends messages via `api.dm.sendMessage(conversationId, { text })`.
  - Uploads attachments via `api.dm.uploadAttachment(conversationId, file)`.
  - Marks read via `api.dm.markRead(conversationId)`.
  - Uses polling: inbox every 15s, messages every 5s.
  - Optimistic send with temp message IDs.
  - Handles session-temp DM closed states.
  - Uses online presence via socket context (only for status dot).
- DM entry point in header: `chabaqa-frontend/app/(community)/components/community-header.tsx` renders `<DMComponent />`.
- DM triggers:
  - Members page: `chabaqa-frontend/app/(community)/[creator]/[feature]/(loggedUser)/members/page.tsx` dispatches `open-dm` event with `{ communityId, targetUserId }`.
  - Booked sessions: `chabaqa-frontend/app/(community)/[creator]/[feature]/(loggedUser)/sessions/components/BookedSessions.tsx` dispatches `open-dm` event with `{ conversationId }`.
- Socket: `chabaqa-frontend/lib/socket-context.tsx` connects to `/dm` namespace, tracks online users.

### Frontend API Client
- `chabaqa-frontend/lib/api/dm.api.ts`
  - `POST /dm/community/start`
  - `POST /dm/peer/start`
  - `POST /dm/session/start`
  - `POST /dm/help/start`
  - `GET /dm/inbox`
  - `GET /dm/:conversationId/messages`
  - `POST /dm/:conversationId/messages`
  - `POST /dm/:conversationId/attachments`
  - `PATCH /dm/:conversationId/read`
  - `GET /dm/help/queue`
  - `PATCH /dm/help/:conversationId/assign`
  - `GET /dm/:conversationId/admin`

### Backend
- Controller: `chabaqa-backend/src/dm/dm.controller.ts`
- Service: `chabaqa-backend/src/dm/dm.service.ts`
- Schemas: `chabaqa-backend/src/schema/conversation.schema.ts`, `chabaqa-backend/src/schema/message.schema.ts`
- Socket gateway: `chabaqa-backend/src/dm/dm.gateway.ts`
  - Events: `dm:message:new`, `dm:message:read`, `user:status`
  - Rooms: `user:{id}` and `conv:{conversationId}`

## 2) Goal
Move DM from dropdown popup into a full page layout inspired by Instagram DM:
- Left sidebar: conversation list + search
- Center panel: chat thread + composer
- Right panel (optional): user/community info or shared media
- Mobile: list view -> chat view (stacked navigation)

## 3) Proposed Route + Navigation

### Route
Create a dedicated page within the community logged-in area:
- Recommended: `chabaqa-frontend/app/(community)/[creator]/[feature]/(loggedUser)/messages/page.tsx`
  - Keeps DM inside community context and route structure.
  - URL example: `/{creator}/{community}/messages`.

### Navigation Changes
- Replace popup entry with page navigation:
  - Update `chabaqa-frontend/app/(community)/components/community-header.tsx` to show a Messages button that links to `/messages`.
- Replace `open-dm` event dispatch with router push:
  - Members page: push to `/messages?communityId=...&targetUserId=...`
  - Booked sessions: push to `/messages?conversationId=...`

## 4) Layout & UX Plan (Instagram-style)

### Desktop Grid
- 3-column layout:
  - Left (fixed width ~320-360px): conversation list
  - Center (flex): message thread
  - Right (optional ~280-320px): participant details / shared media
- Sticky header inside center panel with avatar, name, online status, action icons.
- Bottom composer fixed within center panel.

### Tablet
- 2-column layout:
  - Left list and center chat.
  - Right panel collapses into a drawer/modal.

### Mobile
- Full screen list.
- Selecting a conversation navigates to `/messages?conversationId=...` and shows chat view.
- Back button returns to list.

### Motion & States
- Subtle fade/slide for conversation list loading.
- Read receipts on last sent message.
- Skeletons for list and message area.
- Empty state centered (message icon + CTA).

## 5) Chabaqa Visual Style (Colors + Typography + Spacing)

### Brand Colors (from Tailwind config)
- Primary: `#8e78fb` (`chabaqa.primary`)
- Secondary gradients: `chabaqa.secondary1`, `chabaqa.secondary2` (used in existing banners)

### Suggested UI Palette for DM Page
- Background: `#f8f8fb` (soft gray)
- Surface: `#ffffff`
- Borders: `#e8e9f1`
- Text primary: `#1f2430`
- Text muted: `#6b7280`
- Accent (buttons, highlights): `#8e78fb`
- Outgoing bubble: `#1f2430` (dark neutral)
- Incoming bubble: `#f1f2f8` (light neutral)
- Online: `#2dd4bf`

### Typography
- Header title: 16-18px, semibold
- Conversation name: 14-15px, medium
- Message text: 14px, normal
- Timestamps: 10-11px, muted

### Spacing
- List items: 12-14px vertical padding
- Message bubbles: 10-12px vertical, 14-16px horizontal
- Gutter: 20-24px between columns

## 6) Data & Fetching Plan

### Core Data
- Conversations: `api.dm.listInbox()`
- Messages: `api.dm.listMessages(conversationId)`
- Send: `api.dm.sendMessage()` + optimistic UI
- Attachments: `api.dm.uploadAttachment()`
- Read: `api.dm.markRead()`

### Realtime Enhancements
- Use socket events to replace aggressive polling:
  - On select conversation: `socket.emit('dm:join', { conversationId })`
  - On `dm:message:new`: append if conversation matches, refresh list for lastMessage/unread
  - On `dm:message:read`: update read receipts locally
- Fallback polling every 30s for inbox and 10s for open conversation if socket not connected.

### Query Params
- `conversationId`: open a specific thread.
- `communityId` + `targetUserId`: start peer conversation, then open it.

## 7) Component Breakdown

### Page Shell
- `messages/page.tsx`
  - Fetches conversations
  - Manages selected conversation state
  - Reads query params to open or start a conversation

### UI Components
- `DMLayout` (grid layout)
- `ConversationList`
  - Search input
  - Conversation rows
  - Unread badge
- `ChatThread`
  - Header, message list, date separators
  - Bubble styles for mine vs theirs
  - Attachment preview
- `ChatComposer`
  - Input, attachment upload, send
- `ParticipantPanel`
  - Avatar, role, community info, shared media
  

## 8) Implementation Steps

1. Create new route `app/(community)/[creator]/[feature]/(loggedUser)/messages/page.tsx`.
2. Move shared UI logic from `dm-dropdown.tsx` into reusable components.
3. Wire query-param handling to open/start conversation.
4. Replace popup entry in `community-header.tsx` with link/button to `/messages`.
5. Replace `open-dm` event usage in:
   - `members/page.tsx`
   - `BookedSessions.tsx`
6. Add socket handling for real-time updates in the page.
7. Apply Chabaqa palette, spacing, and Instagram-style layout.
8. QA on mobile + desktop.

## 9) Risk & Edge Cases
- Session temp DMs: keep close reason banner and disable composer when closed.
- Admin help conversations: show admin card + system label.
- Attachments: ensure URLs resolve and previews open.
- Empty inbox: show onboarding state.

## 10) Optional Enhancements
- "Shared Media" tab in right panel
- Typing indicators via socket
- Lazy-load older messages (pagination)

