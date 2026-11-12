// [AI-GENERATED]
import { Injectable, computed, inject, signal } from '@angular/core';
import { TagResponse } from '../services/models/tag-response';
import { TagsService } from '../services/services/tags.service';

export type TagGroup = NonNullable<TagResponse['group']>;

export const TAG_GROUPS: { group: TagGroup; label: string }[] = [
  { group: 'LOOK', label: 'Look' },
  { group: 'TONE', label: 'Tone' },
  { group: 'SUBJECT', label: 'Subject' },
  { group: 'TECHNICAL', label: 'Technical' },
];

/** Same as CreatePostRequest.MAX_TAGS. */
export const MAX_TAGS = 5;

/**
 * The fixed tag list from GET /tags. It never changes while the site is open,
 * so it's fetched once and shared by the picker, the filters and the chips.
 */
@Injectable({ providedIn: 'root' })
export class TagsStore {
  private readonly api = inject(TagsService);
  private requested = false;

  readonly tags = signal<TagResponse[]>([]);
  readonly failed = signal(false);

  readonly bySlug = computed(() => new Map(this.tags().map((t) => [t.slug ?? '', t])));

  readonly grouped = computed(() =>
    TAG_GROUPS.map(({ group, label }) => ({
      group,
      label,
      tags: this.tags().filter((t) => t.group === group),
    })).filter((g) => g.tags.length > 0),
  );

  /** Safe to call from every component that needs the tags; only the first call asks the server. */
  load(): void {
    if (this.requested) {
      return;
    }
    this.requested = true;
    this.api.getTags().subscribe({
      next: (tags) => {
        this.tags.set(tags);
        this.failed.set(false);
      },
      error: () => {
        this.requested = false; // Let the next page try again.
        this.failed.set(true);
      },
    });
  }

  /** "teal-orange" -> "Teal & orange"; falls back to the slug while the list is loading. */
  name(slug: string): string {
    return this.bySlug().get(slug)?.name ?? slug;
  }
}
