export function computeEventStartAt(
  startDate: string | Date | undefined,
  startTime?: string | null,
  _timezone?: string | null,
): Date | null {
  if (!startDate) return null;

  const eventStart = startDate instanceof Date
    ? new Date(startDate.getTime())
    : new Date(startDate);

  if (Number.isNaN(eventStart.getTime())) {
    return null;
  }

  if (startTime) {
    const [hoursRaw, minutesRaw] = String(startTime).split(':');
    const hours = Number(hoursRaw);
    const minutes = Number(minutesRaw);
    if (Number.isFinite(hours) && Number.isFinite(minutes)) {
      eventStart.setHours(hours, minutes, 0, 0);
    }
  } else {
    eventStart.setHours(0, 0, 0, 0);
  }

  return eventStart;
}

export function isEventUpcoming(
  startDate: string | Date | undefined,
  startTime?: string | null,
  timezone?: string | null,
  now: Date = new Date(),
): boolean {
  const eventStart = computeEventStartAt(startDate, startTime, timezone);
  if (!eventStart) return false;
  return eventStart >= now;
}
