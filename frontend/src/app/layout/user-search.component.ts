// [AI-GENERATED]
import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Subject, catchError, debounceTime, distinctUntilChanged, of, switchMap } from 'rxjs';
import { ApiConfiguration } from '../services/api-configuration';
import { UserSummaryResponse } from '../services/models/user-summary-response';
import { UsersService } from '../services/services/users.service';
import { fileUrl } from '../auth/current-user.service';
import { TagResponse } from '../services/models/tag-response';
import { TagsStore } from '../shared/tags.store';

const SEARCH_DELAY_MS = 250;
// [AI-GENERATED] How many matching tags the dropdown shows under the people.
const TAG_SUGGESTIONS = 3;

/**
 * The search box in the header: usernames that start with what you type (best first),
 * then matching tags, then a row that opens the full search. [AI-GENERATED] tags and full search.
 */
@Component({
  selector: 'app-user-search',
  templateUrl: './user-search.component.html',
  styleUrl: './user-search.component.css',
  host: {
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class UserSearchComponent {
  private readonly users = inject(UsersService);
  private readonly router = inject(Router);
  private readonly rootUrl = inject(ApiConfiguration).rootUrl;
  private readonly box = viewChild.required<ElementRef<HTMLElement>>('box');
  private readonly queries = new Subject<string>();
  // [AI-GENERATED]
  private readonly tagsStore = inject(TagsStore);

  readonly query = signal('');
  readonly results = signal<UserSummaryResponse[]>([]);
  readonly open = signal(false);
  readonly active = signal(-1);

  // [AI-GENERATED] Tags whose name contains the text, e.g. "warm" -> Warm, "gold" -> Golden hour.
  readonly tagMatches = computed<TagResponse[]>(() => {
    const q = this.query().trim().toLowerCase();
    return q ? this.tagsStore.tags().filter((t) => t.name?.toLowerCase().includes(q)).slice(0, TAG_SUGGESTIONS) : [];
  });
  /** People, then tags, then the "Search for" row: the arrow keys move through all of them. */
  readonly optionCount = computed(() => this.results().length + this.tagMatches().length + 1);
  readonly searchIndex = computed(() => this.optionCount() - 1);

  constructor() {
    this.tagsStore.load(); // [AI-GENERATED]
    this.queries
      .pipe(
        debounceTime(SEARCH_DELAY_MS),
        distinctUntilChanged(),
        switchMap((query) =>
          query ? this.users.searchUsers({ query }).pipe(catchError(() => of([]))) : of([]),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((results) => {
        this.results.set(results);
        this.active.set(-1);
        this.open.set(this.query().trim().length > 0);
      });
  }

  avatar(user: UserSummaryResponse): string | null {
    return fileUrl(this.rootUrl, user.avatarFileId);
  }

  onInput(value: string): void {
    this.query.set(value);
    this.queries.next(value.trim().toLowerCase());
    if (!value.trim()) {
      this.open.set(false);
    }
  }

  // [AI-GENERATED] Arrow keys move through people, tags and the search row. Enter opens the highlighted
  // one, or the full search when nothing is highlighted.
  onKeydown(event: KeyboardEvent): void {
    const count = this.optionCount();
    if (event.key === 'ArrowDown' && this.query().trim()) {
      event.preventDefault();
      this.open.set(true);
      this.active.update((i) => (i + 1) % count);
    } else if (event.key === 'ArrowUp' && this.query().trim()) {
      event.preventDefault();
      this.active.update((i) => (i <= 0 ? count - 1 : i - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.pick(this.active());
    } else if (event.key === 'Escape') {
      this.open.set(false);
    }
  }

  // [AI-GENERATED]
  pick(index: number): void {
    const users = this.results();
    const tags = this.tagMatches();
    if (index >= 0 && index < users.length) {
      this.go(users[index]);
    } else if (index >= users.length && index < users.length + tags.length) {
      this.leave(['/search'], { tags: tags[index - users.length].slug });
    } else if (this.query().trim()) {
      this.leave(['/search'], { q: this.query().trim() });
    }
  }

  go(user: UserSummaryResponse): void {
    this.leave(['/users', user.username]);
  }

  // [AI-GENERATED]
  private leave(commands: unknown[], queryParams?: Record<string, string | undefined>): void {
    this.open.set(false);
    this.query.set('');
    this.results.set([]);
    this.active.set(-1);
    this.router.navigate(commands, { queryParams });
  }

  onDocumentClick(event: Event): void {
    if (this.open() && !this.box().nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }
}
