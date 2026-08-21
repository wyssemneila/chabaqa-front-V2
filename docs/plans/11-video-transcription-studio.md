# Plan 11: Video Transcription & Content Repurposing Studio

**Status:** Draft  
**Priority:** P2 (Wave 3)  
**Competitive parity:** Circle transcriptions + content co-pilot, Kajabi Creator Studio  
**Foundation:** `video.controller.ts`, `video-playback.service.ts`, HLS pipeline, `media-asset.schema.ts`, AI module

---

## 1. Objectives

1. **Auto-transcribe** course/session videos (AR/FR/EN).
2. **Searchable** transcripts in course player (jump to timestamp).
3. **Content studio:** generate chapter summary, social clips copy, email excerpt, community post draft.
4. Feed **AI Staff** knowledge index (Plan 01).

---

## 2. Current state

| Item | State |
|------|--------|
| HLS playback | ✅ `video-playback.service.ts`, session tokens |
| Transcode script | ✅ `backend/scripts/convert-to-hls.js` (manual ops) |
| Transcripts | ❌ |
| AI chapter context | ✅ Text from course content, not video audio |
| Media upload | ✅ `media.controller.ts` |

---

## 3. Target UX

### 3.1 Creator studio

Route: `/creator/studio` or per-course `/creator/courses/[id]/studio`

**Layout:**
- Left: video list (chapters with duration, transcript status)
- Center: video preview + transcript editor (timestamped lines)
- Right: AI actions panel (Summary, Clips, Post, Email, Quiz)

### 3.2 Learner player

- **CC** button → captions from transcript
- Click transcript line → seek video
- Search within course transcripts

### 3.3 Design: **“Post-production suite”**

- Timeline metaphor: transcript rows aligned to faint waveform placeholder
- AI actions as **film strip** cards (horizontal scroll)
- Dark workspace, high contrast text — distinct from light creator dashboard

---

## 4. Data models

### `VideoTranscript`

```typescript
mediaAssetId?: ObjectId
courseId?: ObjectId
chapterId?: string
communityId: ObjectId
language: string
status: 'pending' | 'processing' | 'completed' | 'failed'
provider: 'whisper' | 'assemblyai' | 'openrouter'
segments: TranscriptSegment[]
fullText: string                 // denormalized for search
durationSeconds: number
errorMessage?: string
createdAt, updatedAt
```

### `TranscriptSegment`

```typescript
startMs: number
endMs: number
text: string
speaker?: string                 // v2 diarization
```

### `ContentRepurposeJob`

```typescript
transcriptId: ObjectId
outputType: 'summary' | 'social_posts' | 'email' | 'community_post' | 'quiz' | 'clips'
status: 'pending' | 'completed' | 'failed'
resultPayload: Record<string, any>
aiModel?: string
```

### `VideoClipSuggestion` (v2)

```typescript
transcriptId: ObjectId
startMs, endMs
title, hook
exportStatus?: 'none' | 'rendered'
```

---

## 5. Backend

### 5.1 Module

```
backend/src/domains/content/transcription/
  transcription.controller.ts
  transcription.service.ts
  transcription-provider.interface.ts
  whisper.provider.ts
  repurpose.service.ts
  transcription.cron.ts
```

### 5.2 Transcription pipeline

**Trigger:**
- On chapter video upload complete (`media.service` event)
- Manual `POST /transcripts/request`

**Steps:**
1. Resolve audio source (MP4 from storage or extract from HLS)
2. Submit to Whisper API (OpenAI) or self-hosted faster-whisper
3. Store `VideoTranscript` with segments
4. Index in `AiKnowledgeDocument` (Plan 01)
5. Notify creator

**Env:**
```bash
TRANSCRIPTION_PROVIDER=whisper
OPENAI_API_KEY=                    # if whisper
TRANSCRIPTION_MAX_MINUTES=180        # plan limit
```

### 5.3 APIs

| Method | Path |
|--------|------|
| POST | `/media/:id/transcribe` |
| GET | `/cours/:courseId/transcripts` |
| GET | `/chapters/:chapterId/transcript` |
| PATCH | `/transcripts/:id` | Creator edit line |
| POST | `/transcripts/:id/repurpose` | body: `{ type }` |
| GET | `/repurpose-jobs/:id` |

### 5.4 Repurpose service

Uses same OpenRouter client as AI create:

| Type | Output |
|------|--------|
| summary | Markdown chapter summary |
| social_posts | 3 posts with hooks |
| email | Newsletter draft |
| community_post | Feed post draft |
| quiz | Export to Plan 05 quiz draft |

### 5.5 Player integration

Extend `GET /video/playback-session` response:

```json
{
  "transcriptUrl": "/api/transcripts/:id/vtt",
  ...
}
```

Generate **WebVTT** on the fly from segments.

---

## 6. Frontend

### 6.1 Studio pages

`frontend/app/(creator)/creator/studio/**`

Components:
- `TranscriptEditor.tsx` — inline edit, sync highlight on video timeupdate
- `RepurposePanel.tsx` — action buttons + result preview
- `TranscriptStatusBadge.tsx`

### 6.2 Player

Modify `enhanced-video-player.tsx`:
- Load VTT track
- Transcript sidebar drawer
- `onSeek(segment.startMs)`

### 6.3 API

`frontend/lib/api/transcription.api.ts`

---

## 7. HLS automation (related)

Extend upload pipeline:

```
Upload MP4 → queue job → convert-to-hls.js → mark ready → queue transcribe
```

Use BullMQ job `VideoProcessingJob` unifying transcode + transcript.

---

## 8. Plan gating

```typescript
transcriptionMinutesPerMonth: number   // Growth: 60, Pro: 500
repurposeJobsPerMonth: number
```

---

## 9. Phases

| Phase | Deliverable |
|-------|-------------|
| 1 | Whisper transcription + VTT in player |
| 2 | Creator transcript editor |
| 3 | Repurpose: summary + community post |
| 4 | Studio UI + search across transcripts |
| 5 | Clip suggestions + auto HLS queue |

---

## 10. Acceptance criteria

- [ ] Upload chapter video → transcript ready <2x video duration
- [ ] Learner enables captions; text syncs within 500ms
- [ ] Creator generates summary from transcript in AI panel
- [ ] Edited transcript persists and updates VTT
- [ ] Plan quota blocks transcription when exceeded

---

## 11. Cost control

- Max audio length per plan
- Reject transcription for videos >N minutes on Starter
- Cache transcripts; re-transcribe only on explicit request after edit video

---

## 12. Files

**Create:** `domains/content/transcription/*`, schemas  
**Modify:** `media.service.ts`, `video-playback.service.ts`, `enhanced-video-player.tsx`, course manage (transcript tab), `ai-knowledge-indexer` (Plan 01)
