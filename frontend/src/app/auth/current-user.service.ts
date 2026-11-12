// [AI-GENERATED]
import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Observable, finalize, shareReplay, tap } from 'rxjs';
import { ApiConfiguration } from '../services/api-configuration';
import { UserProfileResponse } from '../services/models/user-profile-response';
import { UsersService } from '../services/services/users.service';
import { TokenService } from '../services/token/token.service';

/**
 * The logged-in user's own profile, shared by the header and the account page.
 * The JWT only carries the username, so the avatar has to come from GET /users/me.
 */
@Injectable({ providedIn: 'root' })
export class CurrentUserService {
  private readonly users = inject(UsersService);
  private readonly tokens = inject(TokenService);
  private readonly rootUrl = inject(ApiConfiguration).rootUrl;

  readonly profile = signal<UserProfileResponse | null>(null);
  private loading?: Observable<UserProfileResponse>;

  readonly avatarUrl = computed(() => fileUrl(this.rootUrl, this.profile()?.avatarFileId));

  constructor() {
    // Load on login and after a rename (both give a new username in the token); clear on logout.
    effect(() => {
      const username = this.tokens.username();
      untracked(() => (username ? this.reload() : this.profile.set(null)));
    });
  }

  /** GET /users/me. Callers that ask at the same time share one request. */
  load(): Observable<UserProfileResponse> {
    this.loading ??= this.users.getMyUserProfile().pipe(
      tap((profile) => this.profile.set(profile)),
      finalize(() => (this.loading = undefined)),
      shareReplay(1),
    );
    return this.loading;
  }

  reload(): void {
    this.load().subscribe({ error: () => undefined }); // The header falls back to the initial.
  }

  /** Call with the response of a save, so the header updates without another request. */
  set(profile: UserProfileResponse): void {
    this.profile.set(profile);
  }
}

/** /files/{id} is public, so a plain <img src> works without the auth header. */
export function fileUrl(rootUrl: string, id: number | null | undefined): string | null {
  return id === null || id === undefined ? null : `${rootUrl}/files/${id}`;
}
