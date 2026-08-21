import type {
  AiTutorIntent,
  AiTutorMode,
  TutorQuizQuestion,
  TutorSource,
} from '@/domains/shared/ai/ai-tutor.types';

const toNonEmptyString = (value: unknown): string | null => {
  const text = typeof value === 'string' ? value.trim() : '';
  return text.length > 0 ? text : null;
};

const toStringArray = (value: unknown, maxItems = 20): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry) => entry.length > 0)
    .slice(0, maxItems);
};

const normalizeOptions = (value: unknown, maxItems = 6): string[] => {
  if (Array.isArray(value)) {
    const fromArray = value
      .map((entry) => {
        if (typeof entry === 'string') return entry.trim();
        if (entry && typeof entry === 'object') {
          const obj = entry as Record<string, unknown>;
          return String(
            obj.text ?? obj.label ?? obj.value ?? obj.option ?? obj.content ?? '',
          ).trim();
        }
        return '';
      })
      .filter((entry) => entry.length > 0);
    if (fromArray.length >= 2) return fromArray.slice(0, maxItems);
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const fromObject = Object.values(value as Record<string, unknown>)
      .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
      .filter((entry) => entry.length > 0);
    if (fromObject.length >= 2) return fromObject.slice(0, maxItems);
  }

  return [];
};

const normalizeCorrectIndex = (
  value: unknown,
  optionCount: number,
): number | null => {
  if (optionCount < 2) return null;

  const asNumber = (n: number) => {
    if (!Number.isFinite(n)) return null;
    const int = Math.trunc(n);
    if (int >= 0 && int < optionCount) return int;
    if (int >= 1 && int <= optionCount) return int - 1;
    return null;
  };

  if (typeof value === 'number') {
    return asNumber(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    const numeric = asNumber(Number(trimmed));
    if (numeric !== null) return numeric;
    if (/^[A-Da-d]$/.test(trimmed)) {
      return trimmed.toUpperCase().charCodeAt(0) - 65;
    }
  }

  return null;
};

const toIntent = (value: unknown): AiTutorIntent => {
  const raw = typeof value === 'string' ? value.trim().toLowerCase() : '';
  const allowed: AiTutorIntent[] = [
    'question',
    'summary',
    'quiz',
    'simplify',
    'clarification',
    'other',
  ];
  return allowed.includes(raw as AiTutorIntent) ? (raw as AiTutorIntent) : 'question';
};

const parseSources = (
  value: unknown,
  allowedIds: Set<string>,
  maxSources: number,
): TutorSource[] => {
  if (!Array.isArray(value)) return [];
  const sources: TutorSource[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue;
    const id = toNonEmptyString((entry as any).id);
    const label = toNonEmptyString((entry as any).label);
    const excerpt = toNonEmptyString((entry as any).excerpt);
    if (!id || !label || !excerpt) continue;
    if (allowedIds.size > 0 && !allowedIds.has(id)) continue;
    sources.push({
      id,
      label: label.slice(0, 120),
      excerpt: excerpt.slice(0, 600),
    });
    if (sources.length >= maxSources) break;
  }
  return sources;
};

export const validateChatResponse = (
  payload: unknown,
  allowedSourceIds: Set<string>,
  maxSources: number,
): { ok: true; value: { answer: string; sources: TutorSource[]; intent: AiTutorIntent } } | { ok: false; error: string } => {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, error: 'Response is not an object' };
  }
  const obj = payload as Record<string, unknown>;
  const answer = toNonEmptyString(obj.answer);
  if (!answer) return { ok: false, error: 'Missing "answer"' };
  return {
    ok: true,
    value: {
      answer: answer.slice(0, 8000),
      sources: parseSources(obj.sources, allowedSourceIds, maxSources),
      intent: toIntent(obj.intent),
    },
  };
};

export const validateSummaryResponse = (
  payload: unknown,
  allowedSourceIds: Set<string>,
  maxSources: number,
): { ok: true; value: { summary: string; keyPoints: string[]; sources: TutorSource[] } } | { ok: false; error: string } => {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, error: 'Response is not an object' };
  }
  const obj = payload as Record<string, unknown>;
  const summary = toNonEmptyString(obj.summary);
  if (!summary) return { ok: false, error: 'Missing "summary"' };
  const keyPoints = toStringArray(obj.keyPoints, 12);
  return {
    ok: true,
    value: {
      summary: summary.slice(0, 8000),
      keyPoints,
      sources: parseSources(obj.sources, allowedSourceIds, maxSources),
    },
  };
};

const extractQuizEntries = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== 'object') return [];
  const obj = payload as Record<string, unknown>;
  const candidates = [
    obj.questions,
    obj.quiz,
    obj.items,
    obj.data,
  ];
  for (const candidate of candidates) {
    if (Array.isArray(candidate) && candidate.length > 0) {
      return candidate;
    }
  }
  return [];
};

export const validateQuizResponse = (
  payload: unknown,
  allowedSourceIds: Set<string>,
  maxQuestions: number,
): { ok: true; value: { questions: TutorQuizQuestion[] } } | { ok: false; error: string } => {
  const raw = extractQuizEntries(payload);
  if (!raw.length) {
    return { ok: false, error: 'Missing "questions" array' };
  }

  const questions: TutorQuizQuestion[] = [];
  for (const entry of raw.slice(0, maxQuestions)) {
    if (!entry || typeof entry !== 'object') continue;
    const row = entry as Record<string, unknown>;
    const question =
      toNonEmptyString(row.question) ||
      toNonEmptyString(row.prompt) ||
      toNonEmptyString(row.text);
    const options = normalizeOptions(row.options ?? row.choices ?? row.answers);
    const correctIndex = normalizeCorrectIndex(
      row.correctIndex ?? row.correct_answer ?? row.answer ?? row.correct,
      options.length,
    );
    const explanation =
      toNonEmptyString(row.explanation) ||
      toNonEmptyString(row.rationale) ||
      toNonEmptyString(row.feedback) ||
      '';
    const sourceId = toNonEmptyString(row.sourceId ?? row.source_id);
    if (!question || options.length < 2 || correctIndex === null) continue;

    const safeSourceId =
      sourceId && (allowedSourceIds.size === 0 || allowedSourceIds.has(sourceId))
        ? sourceId
        : undefined;

    questions.push({
      question: question.slice(0, 500),
      options: options.map((o) => o.slice(0, 200)),
      correctIndex,
      explanation: explanation.slice(0, 1000),
      ...(safeSourceId ? { sourceId: safeSourceId } : {}),
    });
  }

  if (questions.length === 0) {
    return { ok: false, error: 'No valid quiz questions' };
  }
  return { ok: true, value: { questions } };
};

export const validateSimplifyResponse = (
  payload: unknown,
  allowedSourceIds: Set<string>,
  maxSources: number,
): { ok: true; value: { answer: string; sources: TutorSource[] } } | { ok: false; error: string } => {
  if (!payload || typeof payload !== 'object') {
    return { ok: false, error: 'Response is not an object' };
  }
  const obj = payload as Record<string, unknown>;
  const answer = toNonEmptyString(obj.answer);
  if (!answer) return { ok: false, error: 'Missing "answer"' };
  return {
    ok: true,
    value: {
      answer: answer.slice(0, 8000),
      sources: parseSources(obj.sources, allowedSourceIds, maxSources),
    },
  };
};

export const parseJsonObject = (raw: string): unknown | null => {
  let trimmed = raw.trim();
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch?.[1]) {
    trimmed = fenceMatch[1].trim();
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    // ignore
  }

  const arrayStart = trimmed.indexOf('[');
  const arrayEnd = trimmed.lastIndexOf(']');
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    try {
      return JSON.parse(trimmed.slice(arrayStart, arrayEnd + 1));
    } catch {
      // ignore
    }
  }

  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(trimmed.slice(start, end + 1));
  } catch {
    return null;
  }
};

export const buildModeSystemPrompt = (
  mode: AiTutorMode,
  courseTitle: string,
  chapterTitle: string,
  contextText: string,
  sourceIds: string[],
  quizCount: number,
  learnerProfile?: string,
): string => {
  const sourceList = sourceIds.length
    ? `Valid source IDs: ${sourceIds.join(', ')}`
    : 'No numbered sources available.';

  const profileBlock =
    learnerProfile && learnerProfile.trim()
      ? `\n\nLearner profile:\n${learnerProfile.trim()}\nAdapt explanations to this learner when relevant.`
      : '';

  const base = `You are a teaching assistant for "${courseTitle}", chapter "${chapterTitle}".
Use ONLY the provided chapter context. If information is missing, say so clearly.
Return ONLY valid JSON. No markdown fences.

${sourceList}

Chapter context:
${contextText}${profileBlock}`;

  switch (mode) {
    case 'summary':
      return `${base}

Task: Produce a chapter summary.
JSON shape: {"summary":"...","keyPoints":["..."],"sources":[{"id":"s1","label":"...","excerpt":"..."}]}
Include 3-6 keyPoints. Cite sources by id when possible.`;
    case 'quiz':
      return `${base}

Task: Create exactly ${quizCount} multiple-choice questions from the chapter content only.
Return ONLY this JSON object (no markdown):
{"questions":[{"question":"string","options":["option A","option B","option C","option D"],"correctIndex":0,"explanation":"why this is correct","sourceId":"s1"}]}
Rules: 3-4 options per question; correctIndex is 0-based; use only valid sourceId values from the list or omit sourceId.`;
    case 'simplify':
      return `${base}

Task: Explain the chapter in simple, beginner-friendly language.
JSON shape: {"answer":"...","sources":[{"id":"s1","label":"...","excerpt":"..."}]}`;
    default:
      return `${base}

Task: Answer the student's question.
JSON shape: {"answer":"...","sources":[{"id":"s1","label":"...","excerpt":"..."}],"intent":"question|clarification|other"}
Cite sources by id when relevant. Keep answer concise.`;
  }
};
