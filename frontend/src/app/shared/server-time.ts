// [AI-GENERATED]
/**
 * The backend sends LocalDateTime values ("2026-11-12T03:45:21.74") with no timezone. They are
 * Hungarian wall-clock time, so read them as Europe/Budapest whatever timezone the viewer is in.
 * Values that do carry a zone ("...Z", "+01:00") are read as they are.
 */
export const SERVER_TIME_ZONE = 'Europe/Budapest';

const HAS_ZONE = /(Z|[+-]\d{2}:?\d{2})$/i;
const LOCAL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,9}))?)?$/;

const offsetFormat = new Intl.DateTimeFormat('en-US', { timeZone: SERVER_TIME_ZONE, timeZoneName: 'longOffset' });

/** Minutes Budapest is ahead of UTC at that moment: 60 in winter, 120 in summer. */
function budapestOffsetMinutes(utcMs: number): number {
  const name = offsetFormat.formatToParts(new Date(utcMs)).find((p) => p.type === 'timeZoneName')?.value ?? '';
  const m = /GMT([+-])(\d{2}):(\d{2})/.exec(name);
  return m ? (m[1] === '-' ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
}

/** Milliseconds since 1970, or NaN for a value that isn't a date. */
export function parseServerTime(value: string): number {
  if (HAS_ZONE.test(value)) {
    return Date.parse(value);
  }
  const m = LOCAL.exec(value);
  if (!m) {
    return Date.parse(value);
  }
  const [, y, mo, d, h, mi, s = '0', frac = '0'] = m;
  const asUtc = Date.UTC(+y, +mo - 1, +d, +h, +mi, +s, Math.floor(Number(`0.${frac}`) * 1000));
  // Take the offset at the guessed moment, then once more in case that crossed a DST change.
  const first = asUtc - budapestOffsetMinutes(asUtc) * 60_000;
  return asUtc - budapestOffsetMinutes(first) * 60_000;
}

export function serverDate(value: string): Date {
  return new Date(parseServerTime(value));
}

const DISPLAY = new Intl.DateTimeFormat('en-GB', { timeZone: SERVER_TIME_ZONE, dateStyle: 'medium', timeStyle: 'short' });

/** "12 Nov 2026, 03:45", always in Hungarian time. */
export function formatHungarian(date: Date): string {
  return DISPLAY.format(date);
}
