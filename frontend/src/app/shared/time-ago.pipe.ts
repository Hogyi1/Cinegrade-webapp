// [AI-GENERATED]
import { Pipe, PipeTransform } from '@angular/core';
import { parseServerTime } from './server-time';

const FORMAT = new Intl.RelativeTimeFormat('en', { numeric: 'auto', style: 'short' });
const STEPS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

/** "3 days ago", "last week". Under a minute is "just now". */
@Pipe({ name: 'timeAgo' })
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    // Server times are Hungarian time with no zone attached; see server-time.ts.
    const seconds = Math.max(0, (Date.now() - parseServerTime(value)) / 1000);
    for (const [unit, size] of STEPS) {
      if (seconds >= size) {
        return FORMAT.format(-Math.floor(seconds / size), unit);
      }
    }
    return 'just now';
  }
}
