# Plan 06: Certificates of Completion (Issuance Pipeline)

**Status:** Draft  
**Priority:** P0 (Wave 1)  
**Competitive parity:** Circle/Kajabi certificates  
**Current UI:** `settings-tab.tsx` toggle **not wired**; challenge has `premiumFeatures.certificate` boolean only

---

## 1. Objectives

1. Issue **verifiable PDF certificates** when learners complete courses (and optionally challenges).
2. Creator configures template, enable flag, minimum requirements (completion + quiz pass).
3. Public **verification URL** (`/certificate/verify/[code]`).
4. Connect existing UI toggle to backend.

---

## 2. Current state audit

| Location | Finding |
|----------|---------|
| `settings-tab.tsx` | Switch `defaultChecked` — no state/API |
| `course.schema.ts` | No certificate fields |
| `challenge.schema.ts` | `premiumFeatures.certificate: boolean` — metadata only |
| PDF generation | ❌ None |
| Completion trigger | `content-tracking` / progression `isCompleted` |

---

## 3. Target UX

### 3.1 Creator settings (course manage → Settings)

- Toggle: **Issue certificate on completion**
- Fields: template title, signer name, signature image upload, minimum quiz pass (if Plan 05)
- Preview certificate button

### 3.2 Learner

- Course complete screen: **Download certificate** button
- Profile: **My certificates** list
- Share link to verification page

### 3.3 Design: **“Official document”**

- Certificate preview: cream paper texture, subtle border ornament (CSS, not clip-art seals).
- Typography: elegant display for name; monospace for certificate ID.
- Download button feels substantial (full-width, debossed shadow).

---

## 4. Data models

### Extend `Cours` schema

```typescript
certificateSettings: {
  enabled: boolean
  templateTitle: string          // default "Certificate of Completion"
  issuerName: string
  issuerTitle?: string
  signatureMediaAssetId?: ObjectId
  requireAllQuizzesPassed: boolean
  customFooterText?: string
}
```

### `IssuedCertificate`

```typescript
certificateCode: string          // unique, URL-safe, e.g. CHQ-2026-XXXX
userId: ObjectId
communityId: ObjectId
contentType: 'course' | 'challenge'
contentId: ObjectId
contentTitle: string
recipientName: string
issuedAt: Date
revokedAt?: Date
pdfStorageKey: string            // S3/local storage path
metadata: {
  completionPercent: number
  courseVersion?: string
}
```

**Index:** `{ certificateCode: 1 }` unique

---

## 5. Backend

### 5.1 Module

```
backend/src/domains/learning/certificate/
  certificate.controller.ts
  certificate.service.ts
  certificate-pdf.service.ts      # puppeteer or pdfkit
  certificate-verification.controller.ts  # public
```

### 5.2 APIs

| Method | Path | Auth |
|--------|------|------|
| PATCH | `/cours/:courseId/certificate-settings` | Creator |
| GET | `/cours/:courseId/certificate-settings` | Creator |
| POST | `/cours/:courseId/certificate/issue` | System/cron or learner trigger |
| GET | `/users/me/certificates` | Learner |
| GET | `/certificates/:code/download` | Learner (owner) or public verify |
| GET | `/public/certificates/verify/:code` | Public metadata only |

### 5.3 Issuance pipeline

**Trigger:** On `course completion` event (when progression marks 100%):

```typescript
// certificate.service.ts
async tryIssue(userId, courseId) {
  const course = await loadCourse(courseId);
  if (!course.certificateSettings?.enabled) return;
  if (await this.exists(userId, courseId)) return;
  if (course.certificateSettings.requireAllQuizzesPassed) {
    await quizAttemptService.assertAllPassed(userId, courseId);
  }
  const pdf = await pdfService.render({ ... });
  const code = generateCode();
  await storage.upload(pdf);
  await IssuedCertificate.create({ ... });
  await notificationService.send('certificate_issued', userId);
}
```

### 5.4 PDF generation

**Option A (recommended):** Puppeteer HTML template → PDF  
**Option B:** PDFKit programmatic layout

Template variables: `recipientName`, `courseTitle`, `completionDate`, `issuerName`, `certificateCode`, `qrCodeUrl`

Store template: `backend/src/domains/learning/certificate/templates/certificate.html`

QR encodes: `https://chabaqa.io/certificate/verify/{code}`

### 5.5 Challenge certificates

Reuse same `IssuedCertificate` with `contentType: challenge` when challenge completed + `premiumFeatures.certificate`.

---

## 6. Frontend

### 6.1 Wire settings tab

`settings-tab.tsx`:
- Load `certificateSettings` from API
- `PATCH` on save
- Preview modal

### 6.2 Learner pages

| Route | File |
|-------|------|
| `/profile/certificates` | New list page |
| `/certificate/verify/[code]` | Public landing verify |

### 6.3 Course completion

Modify course player completion modal → fetch `GET /users/me/certificates?courseId=` or issue status.

### 6.4 API

`frontend/lib/api/certificates.api.ts`

---

## 7. Storage & security

- PDFs private; download via signed URL or session auth
- Verification endpoint exposes: name, course title, date, valid/revoked — **no** email/phone
- Revoke endpoint for creator (academic dishonesty)

---

## 8. Phases

| Phase | Deliverable |
|-------|-------------|
| 1 | Schema + settings API + wire UI toggle |
| 2 | PDF generation + manual issue on completion |
| 3 | Learner download + profile list |
| 4 | Public verification page |
| 5 | Challenge certificates + QR |

---

## 9. Acceptance criteria

- [ ] Creator enables certificate; learner completing course receives PDF within 30s
- [ ] Verification URL shows valid certificate for code
- [ ] Disabled toggle → no certificate issued
- [ ] Duplicate completion does not issue twice
- [ ] Settings persist across page reload

---

## 10. Dependencies

- **Soft dependency:** Plan 05 if `requireAllQuizzesPassed` used
- **Uses:** `media.service.ts` for signature image, storage service, progression events

---

## 11. Environment

```bash
CERTIFICATE_PDF_STORAGE_PATH=/data/certificates
CERTIFICATE_BASE_VERIFY_URL=https://chabaqa.io/certificate/verify
PUPPETEER_EXECUTABLE_PATH=          # Docker image must include chromium
```

---

## 12. Files

**Create:** `domains/learning/certificate/*`, `schemas/learning/issued-certificate.schema.ts`  
**Modify:** `course.schema.ts`, `settings-tab.tsx`, progression completion hook, `challenge.service.ts`
