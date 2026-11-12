// [AI-GENERATED]
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiConfiguration } from '../../services/api-configuration';
import { UserSummaryResponse } from '../../services/models/user-summary-response';
import { SearchService } from '../../services/services/search.service';
import { fileUrl } from '../../auth/current-user.service';
import { CompactNumberPipe } from '../../shared/compact-number.pipe';
import { InViewDirective } from '../../shared/in-view.directive';
import { PostTileComponent } from '../../shared/post-tile.component';
import { TagPickerComponent } from '../../shared/tag-picker.component';
import { TagsStore } from '../../shared/tags.store';
import { PAGE_SIZE, Posts, isLastPage } from '../../shared/paged';
import { errorMessages } from '../../shared/api-error';

type Sort = 'new' | 'popular';

/**
 * /search?q=&tags=&sort=: people and posts in one place. Everything lives in the URL,
 * so a search can be shared or bookmarked, and Back goes to the previous search.
 */
@Component({
  selector: 'app-search',
  imports: [FormsModule, RouterLink, CompactNumberPipe, InViewDirective, PostTileComponent, TagPickerComponent],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css',
})
export class SearchComponent {
  private readonly api = inject(SearchService);
  private readonly router = inject(Router);
  private readonly rootUrl = inject(ApiConfiguration).rootUrl;
  readonly tagsStore = inject(TagsStore);

  // What the URL says.
  readonly q = signal('');
  readonly tags = signal<string[]>([]);
  readonly sort = signal<Sort>('new');

  // The text box, which only goes into the URL on Enter.
  readonly draft = signal('');
  readonly filtersOpen = signal(false);

  readonly users = signal<UserSummaryResponse[]>([]);
  readonly posts = signal<Posts>([]);
  readonly total = signal<number | null>(null);
  readonly loading = signal(false);
  readonly lastPage = signal(false);
  readonly errors = signal<string[]>([]);

  readonly hasQuery = computed(() => this.q() !== '' || this.tags().length > 0);

  private page = 0;
  private request?: Subscription;

  constructor() {
    this.tagsStore.load();
    inject(ActivatedRoute)
      .queryParamMap.pipe(takeUntilDestroyed())
      .subscribe((params) => this.apply(params));
  }

  submit(): void {
    this.navigate({ q: this.draft().trim() || null });
  }

  setTags(tags: string[]): void {
    this.navigate({ tags: tags.length ? tags : null });
  }

  removeTag(slug: string): void {
    this.setTags(this.tags().filter((t) => t !== slug));
  }

  setSort(sort: Sort): void {
    this.navigate({ sort: sort === 'new' ? null : sort });
  }

  clearAll(): void {
    this.draft.set('');
    this.router.navigate(['/search']);
  }

  loadMore(): void {
    if (this.loading() || this.lastPage()) {
      return;
    }
    this.loading.set(true);
    this.errors.set([]);
    const first = this.page === 0;
    this.request = this.api
      .search({
        q: this.q() || undefined,
        tags: this.tags().length ? this.tags() : undefined,
        sort: this.sort(),
        page: this.page,
        size: PAGE_SIZE,
      })
      .subscribe({
        next: (res) => {
          if (first) {
            this.users.set(res.users ?? []);
            this.total.set(res.posts?.page?.totalElements ?? 0);
          }
          this.posts.update((p) => [...p, ...(res.posts?.content ?? [])]);
          this.lastPage.set(!res.posts || isLastPage(res.posts));
          this.page++;
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          this.errors.set(errorMessages(err, "Couldn't search right now. Try again in a moment."));
        },
      });
  }

  file(id: number | undefined): string | null {
    return fileUrl(this.rootUrl, id);
  }

  private navigate(changes: Record<string, string | string[] | null>): void {
    this.router.navigate(['/search'], { queryParams: changes, queryParamsHandling: 'merge' });
  }

  private apply(params: ParamMap): void {
    this.q.set((params.get('q') ?? '').trim());
    this.draft.set(this.q());
    this.tags.set([...new Set(params.getAll('tags').filter(Boolean))]);
    this.sort.set(params.get('sort') === 'popular' ? 'popular' : 'new');

    this.request?.unsubscribe();
    this.page = 0;
    this.users.set([]);
    this.posts.set([]);
    this.total.set(null);
    this.lastPage.set(false);
    this.loading.set(false);
    this.loadMore();
  }
}
