interface DateParts {
  year: number;
  month: number;
  day: number;
}

interface TimeParts {
  hours: number;
  minutes: number;
  seconds: number;
}

export interface GoogleCalendarTemplateInput {
  title: string;
  description?: string;
  location?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  startTime?: string;
  endTime?: string;
  timezone?: string;
}

const GOOGLE_TIMEZONE_ALIASES: Record<string, string> = {
  UTC: "Etc/UTC",
  EST: "America/New_York",
  PST: "America/Los_Angeles",
  CET: "Europe/Paris",
  IST: "Asia/Kolkata",
  JST: "Asia/Tokyo",
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parseDateParts(value: string | Date | undefined): DateParts | null {
  if (!value) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return {
      year: value.getUTCFullYear(),
      month: value.getUTCMonth() + 1,
      day: value.getUTCDate(),
    };
  }

  const raw = String(value).trim();
  if (!raw) return null;

  const direct = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (direct) {
    return {
      year: Number(direct[1]),
      month: Number(direct[2]),
      day: Number(direct[3]),
    };
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return {
    year: parsed.getUTCFullYear(),
    month: parsed.getUTCMonth() + 1,
    day: parsed.getUTCDate(),
  };
}

function parseTimeParts(value?: string): TimeParts | null {
  if (!value) return null;
  const normalized = String(value).trim();
  const match = normalized.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] || 0);

  if (!isFiniteNumber(hours) || !isFiniteNumber(minutes) || !isFiniteNumber(seconds)) {
    return null;
  }
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59 || seconds < 0 || seconds > 59) {
    return null;
  }

  return { hours, minutes, seconds };
}

function dateFromParts(dateParts: DateParts, timeParts: TimeParts): Date {
  return new Date(
    Date.UTC(
      dateParts.year,
      dateParts.month - 1,
      dateParts.day,
      timeParts.hours,
      timeParts.minutes,
      timeParts.seconds,
      0,
    ),
  );
}

function formatGoogleDateTime(date: Date): string {
  const yyyy = String(date.getUTCFullYear()).padStart(4, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mi = String(date.getUTCMinutes()).padStart(2, "0");
  const ss = String(date.getUTCSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}T${hh}${mi}${ss}`;
}

function isValidTimeZone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function mapGmtOffsetToIana(rawTimezone: string): string | null {
  const match = rawTimezone.toUpperCase().match(/^GMT([+-])(\d{1,2})$/);
  if (!match) return null;

  const sign = match[1];
  const hours = Number(match[2]);
  if (!Number.isFinite(hours) || hours < 0 || hours > 14) return null;

  // In IANA Etc/GMT identifiers the sign is reversed by convention.
  const ianaSign = sign === "+" ? "-" : "+";
  return `Etc/GMT${ianaSign}${hours}`;
}

export function resolveGoogleCalendarTimezone(timezone?: string): string | undefined {
  if (!timezone) return undefined;
  const raw = String(timezone).trim();
  if (!raw) return undefined;

  const alias = GOOGLE_TIMEZONE_ALIASES[raw.toUpperCase()] || raw;
  const gmtMapped = mapGmtOffsetToIana(alias) || alias;

  if (isValidTimeZone(gmtMapped)) {
    return gmtMapped;
  }

  return undefined;
}

export function buildGoogleCalendarTemplateUrl(input: GoogleCalendarTemplateInput): string | null {
  const title = String(input.title || "").trim();
  const startDateParts = parseDateParts(input.startDate);
  if (!title || !startDateParts) {
    return null;
  }

  const startTimeParts = parseTimeParts(input.startTime) || { hours: 0, minutes: 0, seconds: 0 };
  const startDateTime = dateFromParts(startDateParts, startTimeParts);

  const endDateParts = parseDateParts(input.endDate) || startDateParts;
  const parsedEndTime = parseTimeParts(input.endTime);
  let endDateTime = dateFromParts(endDateParts, parsedEndTime || startTimeParts);

  if (!parsedEndTime) {
    endDateTime = new Date(endDateTime.getTime() + 60 * 60 * 1000);
  }

  if (endDateTime.getTime() <= startDateTime.getTime()) {
    endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);
  }

  const params = new URLSearchParams();
  params.set("action", "TEMPLATE");
  params.set("text", title);
  params.set("dates", `${formatGoogleDateTime(startDateTime)}/${formatGoogleDateTime(endDateTime)}`);

  const details = String(input.description || "").trim();
  if (details) {
    params.set("details", details);
  }

  const location = String(input.location || "").trim();
  if (location) {
    params.set("location", location);
  }

  const timezone = resolveGoogleCalendarTimezone(input.timezone);
  if (timezone) {
    params.set("ctz", timezone);
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
