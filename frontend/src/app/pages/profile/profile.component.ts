// [AI-GENERATED]
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, Subscription, map } from 'rxjs';
import { ApiConfiguration } from '../../services/api-configuration';
import { PublicUserProfileResponse } from '../../services/models/public-user-profile-response';
import { PostsService } from '../../services/services/posts.service';
import { UsersService } from '../../services/services/users.service';
import { TokenService } from '../../services/token/token.service';
import { fileUrl } from '../../auth/current-user.service';
import { PostTileComponent } from '../../shared/post-tile.component';
import { CompactNumberPipe } from '../../shared/compact-number.pipe';
import { PAGE_SIZE, PageLoader, Posts, isLastPage } from '../../shared/paged';
import { businessErrorCode, errorMessages } from '../../shared/api-error';
// [AI-GENERATED]
import { toProfileLink } from '../../shared/profile-link';

// Same number as BusinessErrorCodes.java.
const USER_NOT_FOUND = 316;

type Tab = 'posts' | 'saved';

/** /users/:username. Anyone can view it; Saved only shows on your own profile. */
@Component({
  selector: 'app-profile',
  imports: [RouterLink, PostTileComponent, CompactNumberPipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent {
  private readonly users = inject(UsersService);
  private readonly posts = inject(PostsService);
  private readonly tokens = inject(TokenService);
  private readonly router = inject(Router);
  private readonly rootUrl = inject(ApiConfiguration).rootUrl;

  readonly profile = signal<PublicUserProfileResponse | null>(null);
  readonly notFound = signal(false);
  readonly loadErrors = signal<string[]>([]);

  readonly tab = signal<Tab>('posts');
  readonly items = signal<Posts>([]);
  readonly loadingPosts = signal(false);
  readonly lastPage = signal(false);
  readonly postErrors = signal<string[]>([]);
  readonly followBusy = signal(false);

  private username = '';
  private page = 0;
  private pageRequest?: Subscription;

  readonly isMe = computed(() => {
    const me = this.tokens.username();
    return me !== null && me === this.profile()?.username;
  });
  readonly avatarUrl = computed(() => fileUrl(this.rootUrl, this.profile()?.avatarFileId));
  readonly initial = computed(() => this.profile()?.username?.charAt(0).toUpperCase() ?? '?');
  readonly links = computed(() => (this.profile()?.links ?? []).map(toProfileLink)); // [AI-GENERATED] platform icon + handle

  constructor() {
    // The same page shows another profile when only the username in the URL changes.
    inject(ActivatedRoute)
      .paramMap.pipe(
        map((params) => params.get('username') ?? ''),
        takeUntilDestroyed(),
      )
      .subscribe((username) => this.open(username));
  }

  selectTab(tab: Tab): void {
    if (tab === this.tab()) {
      return;
    }
    this.tab.set(tab);
    this.resetPosts();
    this.loadMore();
  }

  loadMore(): void {
    if (this.loadingPosts() || this.lastPage()) {
      return;
    }
    this.loadingPosts.set(true);
    this.postErrors.set([]);
    this.pageRequest = this.loader()(this.page).subscribe({
      next: (res) => {
        this.items.update((items) => [...items, ...(res.content ?? [])]);
        this.lastPage.set(isLastPage(res));
        this.page++;
        this.loadingPosts.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingPosts.set(false);
        this.postErrors.set(errorMessages(err, "Couldn't load the posts. Try again in a moment."));
      },
    });
  }

  toggleFollow(): void {
    const profile = this.profile();
    if (!profile || this.followBusy()) {
      return;
    }
    if (!this.tokens.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    const following = profile.following === true;
    // Show the change straight away, and undo it if the server says no.
    this.applyFollow(!following);
    this.followBusy.set(true);
    const params = { username: profile.username! };
    const request: Observable<void> = following
      ? this.users.unfollowUser(params)
      : this.users.followUser(params);
    request.subscribe({
      next: () => this.followBusy.set(false),
      error: () => {
        this.applyFollow(following);
        this.followBusy.set(false);
      },
    });
  }

  private open(username: string): void {
    this.username = username;
    this.profile.set(null);
    this.notFound.set(false);
    this.loadErrors.set([]);
    this.tab.set('posts');
    this.resetPosts();

    this.users.getPublicProfile({ username }).subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.loadMore();
      },
      error: (err: HttpErrorResponse) => {
        if (businessErrorCode(err) === USER_NOT_FOUND || err.status === 403) {
          this.notFound.set(true);
        } else {
          this.loadErrors.set(errorMessages(err, "Couldn't load this profile. Reload the page to try again."));
        }
      },
    });
  }

  private loader(): PageLoader {
    return this.tab() === 'saved'
      ? (page) => this.users.getSavedPosts({ page, size: PAGE_SIZE })
      : (page) => this.posts.listPosts({ author: this.username, page, size: PAGE_SIZE });
  }

  private resetPosts(): void {
    this.pageRequest?.unsubscribe();
    this.items.set([]);
    this.page = 0;
    this.lastPage.set(false);
    this.loadingPosts.set(false);
    this.postErrors.set([]);
  }

  private applyFollow(following: boolean): void {
    this.profile.update((p) => {
      if (!p) {
        return p;
      }
      const delta = following === (p.following === true) ? 0 : following ? 1 : -1;
      return { ...p, following, followerCount: Math.max(0, (p.followerCount ?? 0) + delta) };
    });
  }
}
