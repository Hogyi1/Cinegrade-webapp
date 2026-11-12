// [AI-GENERATED]
import { Pipe, PipeTransform } from '@angular/core';

const FORMAT = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

/** 1234 → "1.2K", like the counts on social sites. */
@Pipe({ name: 'compactNumber' })
export class CompactNumberPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return FORMAT.format(value ?? 0);
  }
}
