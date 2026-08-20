type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object";
}

export function normalizeCourseId(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value).trim();

  if (isRecord(value)) {
    const record = value as UnknownRecord;
    const candidate =
      record.id ?? record._id ?? record.mongoId ?? record.courseId ?? record.cours;
    if (typeof candidate === "string" || typeof candidate === "number") {
      return String(candidate).trim();
    }
  }

  return String(value).trim();
}

function collectCourseIdCandidates(
  value: unknown,
  ids: Set<string>,
  seen: WeakSet<object>,
  depth = 0,
) {
  const normalized = normalizeCourseId(value);
  if (normalized) ids.add(normalized);

  if (!isRecord(value) || depth > 3) return;
  if (seen.has(value)) return;
  seen.add(value);

  const record = value as UnknownRecord;
  const directKeys = ["id", "_id", "mongoId", "courseId"];
  for (const key of directKeys) {
    const next = record[key];
    if (next == null) continue;
    const nextNormalized = normalizeCourseId(next);
    if (nextNormalized) ids.add(nextNormalized);
  }

  const nestedKeys = ["courseId", "course", "cours", "courseRef", "courseData"];
  for (const key of nestedKeys) {
    const nested = record[key];
    if (isRecord(nested)) {
      collectCourseIdCandidates(nested, ids, seen, depth + 1);
    }
  }
}

export function getCourseIdCandidates(value: unknown): string[] {
  if (value == null) return [];
  const ids = new Set<string>();
  collectCourseIdCandidates(value, ids, new WeakSet<object>());
  return Array.from(ids);
}

export function idsMatch(left: unknown, right: unknown): boolean {
  const leftIds = getCourseIdCandidates(left);
  const rightIds = getCourseIdCandidates(right);
  if (!leftIds.length || !rightIds.length) return false;
  const rightSet = new Set(rightIds);
  return leftIds.some((id) => rightSet.has(id));
}

export function resolveCourseRouteId(course: unknown): string {
  if (!isRecord(course)) return normalizeCourseId(course);
  return (
    normalizeCourseId(course.id) ||
    normalizeCourseId(course.mongoId) ||
    normalizeCourseId(course._id) ||
    getCourseIdCandidates(course)[0] ||
    ""
  );
}
