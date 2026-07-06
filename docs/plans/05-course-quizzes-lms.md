# Plan 05: Course Quizzes & Graded Assessments (Formal LMS)

**Status:** Draft  
**Priority:** P1 (Wave 2)  
**Competitive parity:** Circle course quizzes  
**Distinct from:** AI tutor `mode: quiz` in `ai-tutor.service.ts` (ephemeral, not graded)

---

## 1. Objectives

1. Creators attach **quizzes** to courses (course-level or chapter-level).
2. Learners take quizzes with **passing score**, **attempt limits**, **timed** optional.
3. Quiz results affect **progression** (unlock next chapter / certificate eligibility).
4. Separate AI-generated practice quizzes (tutor) from **authoritative graded** quizzes.

---

## 2. Current state

| Item | Path | State |
|------|------|--------|
| AI tutor quiz | `ai-tutor.service.ts`, `QuizTutorResponse` | ✅ Not persisted as grade |
| Course schema | `course.schema.ts` | ❌ No quiz entities |
| Progression | `progression.controller.ts` | ✅ Chapter completion |
| Chapter unlock | Sequential in course player | ✅ |

---

## 3. Target UX

### 3.1 Creator

- Course manage → new tab **“Quizzes”**
- Create quiz: title, description, passingScore (e.g. 70%), maxAttempts, timeLimitMinutes
- Question builder: MCQ (single/multi), true/false, short text (v2)
- Attach to: entire course | specific chapter | after chapter N
- Option: **required for completion**

### 3.2 Learner

- Quiz card in course sidebar or post-chapter gate
- Take quiz UI: one question per screen or scrollable
- Submit → score + review incorrect answers
- Retry if attempts remain

### 3.3 Design: **“Exam booklet”**

- Clean serif headings for quiz title (distinct from course UI sans-serif).
- Progress dots for questions; correct/incorrect review with green/red left border (accessible patterns + icons).
- No gamified confetti on fail; subtle encouragement copy.

---

## 4. Data models

### `CourseQuiz`

**File:** `schemas/learning/course-quiz.schema.ts`

```typescript
courseId: ObjectId
communityId: ObjectId
title: string
description?: string
attachTo: {
  type: 'course' | 'chapter'
  chapterId?: string
}
position: 'before_chapter' | 'after_chapter' | 'end_of_course'
passingScorePercent: number      // 0-100
maxAttempts: number              // default 3, 0 = unlimited
timeLimitMinutes?: number
shuffleQuestions: boolean
shuffleOptions: boolean
showCorrectAnswers: boolean      // after submit
requiredForCompletion: boolean
status: 'draft' | 'published'
questions: QuizQuestion[]
createdBy: ObjectId
```

### `QuizQuestion`

```typescript
id: string
type: 'single_choice' | 'multiple_choice' | 'true_false'
prompt: string
options: { id: string; text: string }[]
correctOptionIds: string[]       // server-only field, strip on client fetch
explanation?: string
points: number
```

### `QuizAttempt`

```typescript
quizId: ObjectId
userId: ObjectId
courseId: ObjectId
attemptNumber: number
answers: { questionId: string; selectedOptionIds: string[] }[]
scorePercent: number
passed: boolean
startedAt: Date
submittedAt?: Date
timeSpentSeconds?: number
```

**Indexes:** `{ quizId: 1, userId: 1, attemptNumber: -1 }`

---

## 5. Backend

### 5.1 Module

```
backend/src/domains/learning/quiz/
  course-quiz.controller.ts
  course-quiz.service.ts
  quiz-attempt.service.ts
  quiz-grading.service.ts
```

### 5.2 APIs

**Creator:**

| Method | Path |
|--------|------|
| GET | `/cours/:courseId/quizzes` |
| POST | `/cours/:courseId/quizzes` |
| PATCH | `/cours/:courseId/quizzes/:quizId` |
| DELETE | `/cours/:courseId/quizzes/:quizId` |
| POST | `/cours/:courseId/quizzes/:quizId/publish` |

**Learner:**

| Method | Path |
|--------|------|
| GET | `/cours/:courseId/quizzes/:quizId` | Questions **without** correct answers |
| POST | `/cours/:courseId/quizzes/:quizId/attempts` | Start attempt |
| PATCH | `/attempts/:attemptId/submit` | Grade + return results |

### 5.3 Grading (`QuizGradingService`)

- MCQ: compare `selectedOptionIds` to `correctOptionIds`
- Weighted score: sum(points earned) / sum(points possible)
- `passed = scorePercent >= passingScorePercent`

### 5.4 Progression integration

Modify course progression service:

```typescript
// Before marking chapter complete or course complete:
await quizAttemptService.assertRequirementsMet(userId, courseId, chapterId);
```

If `requiredForCompletion` quiz not passed → block completion API with `403` + message.

### 5.5 AI import (optional bridge)

Endpoint: `POST /cours/:courseId/quizzes/generate-from-chapter`
- Uses AI tutor quiz generator internally
- Creator reviews → saves as formal `CourseQuiz`

---

## 6. Frontend

### 6.1 Creator

`frontend/app/(creator)/creator/courses/[courseId]/manage/`
- New tab `quizzes-tab.tsx`
- `QuizBuilder.tsx`, `QuestionEditor.tsx`

### 6.2 Learner

`frontend/app/(community)/.../courses/[courseId]/`
- `quiz/[quizId]/page.tsx` — take quiz
- `quiz/[quizId]/results/page.tsx`
- Gate in `enhanced-video-player` or course layout when chapter requires quiz

### 6.3 API

`frontend/lib/api/course-quizzes.api.ts`

---

## 7. Security

- Never expose `correctOptionIds` in GET quiz for learners
- Grade only server-side on submit
- Rate-limit attempt creation
- Idempotent submit (one active attempt per user)

---

## 8. Phases

| Phase | Deliverable |
|-------|-------------|
| 1 | Schema + CRUD + MCQ single choice |
| 2 | Learner take + submit + results |
| 3 | Progression gating |
| 4 | Multi-select, timer, attempt limits |
| 5 | AI import from chapter |

---

## 9. Acceptance criteria

- [ ] Creator adds 5-question quiz after chapter 2; learner must pass to unlock chapter 3
- [ ] Failed attempt shows explanations when enabled
- [ ] Attempt 4 blocked when maxAttempts=3
- [ ] Quiz attempts appear in creator analytics
- [ ] AI tutor quiz still works independently

---

## 10. Analytics

Track via `content-tracking.service.ts`:

```typescript
action: 'quiz_start' | 'quiz_submit' | 'quiz_pass' | 'quiz_fail'
contentType: 'quiz'
contentId: quizId
```

Feed creator funnel charts (extend analytics service).

---

## 11. Files

**Create:** `domains/learning/quiz/*`, schemas  
**Modify:** `course.schema.ts` (optional quizIds ref), progression service, course manage tabs, course player layout
