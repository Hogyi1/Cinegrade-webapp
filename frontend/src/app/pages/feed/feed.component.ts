// [AI-GENERATED]
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { ApiConfiguration } from '../../services/api-configuration';
import { PostSummaryResponse } from '../../services/models/post-summary-response';
import { UserSummaryResponse } from '../../services/models/user-summary-response';
import { PostsService } from '../../services/services/posts.service';
import { UsersService } from '../../services/services/users.service';
import { TokenService } from '../../services/token/token.service';
import { fileUrl } from '../../auth/current-user.service';
import { BeforeAfterComponent } from '../../shared/before-after.component';
import { CompactNumberPipe } from '../../shared/compact-number.pipe';
import { InViewDirective } from '../../shared/in-view.directive';
import { PostActionsService } from '../../shared/post-actions.service';
import { TimeAgoPipe } from '../../shared/time-ago.pipe';
import { PAGE_SIZE, Posts, isLastPage } from '../../shared/paged';
import { errorMessages } from '../../shared/api-error';
import { DESKTOP_DOWNLOAD_URL } from '../../shared/links';
// [AI-GENERATED]
import { TagChipsComponent } from '../../shared/tag-chips.component';
import { TagsStore } from '../../shared/tags.store';

type Scope = 'all' | 'following';

const SUGGESTION_COUNT = 5;

/** The home page: everyone's posts, or only the people you follow. */
@Component({
  selector: 'app-feed',
  imports: [RouterLink, BeforeAfterComponent, CompactNumberPipe, InViewDirective, TimeAgoPipe, TagChipsComponent],
  templateUrl: './feed.component.html',
  styleUrl: './feed.component.css',
})
export class FeedComponent {
  private readonly posts = inject(PostsService);
  private readonly users = inject(UsersService);
  private readonly actions = inject(PostActionsService);
  private readonly rootUrl = inject(ApiConfiguration).rootUrl;

  readonly isLoggedIn = inject(TokenService).isLoggedIn;
  readonly downloadUrl = DESKTOP_DOWNLOAD_URL;

  readonly scope = signal<Scope>('all');
  readonly items = signal<Posts>([]);
  readonly loading = signal(false);
  readonly lastPage = signal(false);
  readonly errors = signal<string[]>([]);
  readonly suggestions = signal<UserSummaryResponse[]>([]);

  // [AI-GENERATED] Shortcuts above the feed: the "Look" tags, which are what people browse by.
  private readonly tagsStore = inject(TagsStore);
  readonly quickTags = computed(() => this.tagsStore.tags().filter((t) => t.group === 'LOOK').slice(0, 12));

  private page = 0;
  private request?: Subscription;

  constructor() {
    this.tagsStore.load(); // [AI-GENERATED]
    this.loadMore();
    // An empty search returns everyone, best first: good enough for "graders to follow".
    this.users.searchUsers({ query: '' }).subscribe({
      next: (users) => this.suggestions.set(users.slice(0, SUGGESTION_COUNT)),
      error: () => undefined,
    });
  }

  selectScope(scope: Scope): void {
    if (scope === this.scope()) {
      return;
    }
    this.scope.set(scope);
    this.request?.unsubscribe();
    this.items.set([]);
    this.page = 0;
    this.lastPage.set(false);
    this.loading.set(false);
    this.loadMore();
  }

  loadMore(): void {
    if (this.loading() || this.lastPage()) {
      return;
    }
    this.loading.set(true);
    this.errors.set([]);
    this.request = this.posts.listPosts({ scope: this.scope(), page: this.page, size: PAGE_SIZE }).subscribe({
      next: (res) => {
        this.items.update((items) => [...items, ...(res.content ?? [])]);
        this.lastPage.set(isLastPage(res));
        this.page++;
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.errors.set(errorMessages(err, "Couldn't load the feed. Try again in a moment."));
      },
    });
  }

  like(post: PostSummaryResponse): void {
    this.actions.toggleLike(post, (next) => this.replace(next));
  }

  save(post: PostSummaryResponse): void {
    this.actions.toggleSave(post, (next) => this.replace(next));
  }

  file(id: number | undefined): string | null {
    return fileUrl(this.rootUrl, id);
  }

  private replace(next: PostSummaryResponse): void {
    this.items.update((items) => items.map((p) => (p.id === next.id ? next : p)));
  }
}
