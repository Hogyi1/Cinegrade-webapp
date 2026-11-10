import { Injectable, computed, signal } from '@angular/core';

// The access token lives only in memory, so page scripts can't find it in storage.
// After a reload, SessionService gets a new one using the HttpOnly refresh cookie.
@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly current = signal<string | null>(null);

  readonly isLoggedIn = computed(() => this.current() !== null);
  readonly username = computed(() => usernameIn(this.current()));

  get token(): string | null {
    return this.current();
  }

  set token(token: string | null) {
    this.current.set(token);
  }
}

// Only for display. The backend is what checks the token.
function usernameIn(token: string | null): string | null {
  try {
    const payload = token!.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload)).username ?? null;
  } catch {
    return null;
  }
}
