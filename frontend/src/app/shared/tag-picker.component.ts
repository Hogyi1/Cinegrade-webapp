// [AI-GENERATED]
import { Component, computed, inject, input, model, signal } from '@angular/core';
import { MAX_TAGS, TagsStore } from './tags.store';

/**
 * Pick tags from the fixed list, grouped by Look / Tone / Subject / Technical.
 * Used on the upload form and when editing a post (with a limit), and as the search filter (no limit).
 * [(selected)] holds the slugs.
 */
@Component({
  selector: 'app-tag-picker',
  template: `
    <div class="head">
      <input
        type="search"
        class="filter"
        placeholder="Find a tag"
        aria-label="Find a tag"
        [value]="query()"
        (input)="query.set($any($event.target).value)"
      />
      @if (max(); as limit) {
        <span class="count" [class.count--full]="selected().length >= limit" aria-live="polite">
          {{ selected().length }} / {{ limit }}
        </span>
      }
    </div>

    @if (store.failed()) {
      <p class="note">Couldn't load the tags. Reload the page to try again.</p>
    }

    @for (g of visibleGroups(); track g.group) {
      <fieldset class="group">
        <legend>{{ g.label }}</legend>
        <div class="options">
          @for (tag of g.tags; track tag.slug) {
            <button
              type="button"
              class="option"
              [class.option--on]="isSelected(tag.slug!)"
              [attr.aria-pressed]="isSelected(tag.slug!)"
              [disabled]="!isSelected(tag.slug!) && full()"
              (click)="toggle(tag.slug!)"
            >
              @if (isSelected(tag.slug!)) {
                <i class="fa-solid fa-check" aria-hidden="true"></i>
              }
              {{ tag.name }}
            </button>
          }
        </div>
      </fieldset>
    } @empty {
      @if (query()) {
        <p class="note">No tag matches "{{ query() }}".</p>
      }
    }
  `,
  styles: `
    :host {
      display: grid;
      gap: 14px;
    }

    .head {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .filter {
      flex: 1;
      min-width: 0;
      padding: 8px 12px;
      background: var(--clr-surface-input);
      border: 1px solid var(--clr-border);
      border-radius: 8px;
      color: var(--clr-text-primary);
      font: inherit;
      font-size: 14px;
    }

    .filter:focus-visible {
      outline: 2px solid var(--clr-blue-hover);
      outline-offset: 1px;
    }

    .count {
      color: var(--clr-text-muted);
      font-size: 13px;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }

    .count--full {
      color: var(--clr-text-primary);
      font-weight: 700;
    }

    .group {
      margin: 0;
      padding: 0;
      border: 0;
      min-width: 0;
    }

    legend {
      margin-bottom: 8px;
      padding: 0;
      color: var(--clr-text-muted);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    .options {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .option {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      background: var(--clr-surface-input);
      border: 1px solid var(--clr-border-subtle);
      border-radius: 999px;
      color: var(--clr-text-secondary);
      font: inherit;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
    }

    .option:hover:not(:disabled) {
      border-color: var(--clr-border);
      color: var(--clr-text-primary);
    }

    .option--on {
      background: var(--clr-blue);
      border-color: var(--clr-blue);
      color: #fff;
    }

    .option--on:hover:not(:disabled) {
      background: var(--clr-blue-hover);
      border-color: var(--clr-blue-hover);
      color: #fff;
    }

    .option:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .option:focus-visible {
      outline: 2px solid var(--clr-blue-hover);
      outline-offset: 2px;
    }

    .option i {
      font-size: 11px;
    }

    .note {
      margin: 0;
      color: var(--clr-text-muted);
      font-size: 14px;
    }
  `,
})
export class TagPickerComponent {
  readonly store = inject(TagsStore);

  readonly selected = model<string[]>([]);
  /** Null = no limit (the search filter). */
  readonly max = input<number | null>(MAX_TAGS);

  readonly query = signal('');

  readonly full = computed(() => {
    const limit = this.max();
    return limit !== null && this.selected().length >= limit;
  });

  readonly visibleGroups = computed(() => {
    const q = this.query().trim().toLowerCase();
    return this.store
      .grouped()
      .map((g) => ({ ...g, tags: q ? g.tags.filter((t) => t.name?.toLowerCase().includes(q)) : g.tags }))
      .filter((g) => g.tags.length > 0);
  });

  constructor() {
    this.store.load();
  }

  isSelected(slug: string): boolean {
    return this.selected().includes(slug);
  }

  toggle(slug: string): void {
    if (this.isSelected(slug)) {
      this.selected.update((s) => s.filter((x) => x !== slug));
    } else if (!this.full()) {
      this.selected.update((s) => [...s, slug]);
    }
  }
}
