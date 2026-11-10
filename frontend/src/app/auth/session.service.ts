import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, firstValueFrom, map, of, shareReplay, timeout } from 'rxjs';
import { AuthenticationService } from '../services/services';
import { TokenService } from '../services/token/token.service';

const STARTUP_REFRESH_TIMEOUT_MS = 5000;

@Injectable({
  providedIn: 'root',
})
export class SessionService {
  private readonly auth = inject(AuthenticationService);
  private readonly tokens = inject(TokenService);
  private readonly router = inject(Router);

  private refreshing?: Observable<string>;

  // Requests that fail together all wait for this one call, instead of each sending their own.
  refresh(): Observable<string> {
    this.refreshing ??= this.auth.refresh().pipe(
      map((res) => {
        const token = res.token as string;
        this.tokens.token = token;
        return token;
      }),
      finalize(() => (this.refreshing = undefined)),
      shareReplay(1),
    );
    return this.refreshing;
  }

  // Runs before the first page shows, so route guards know whether the user is logged in.
  restore(): Promise<unknown> {
    return firstValueFrom(
      this.refresh().pipe(
        timeout(STARTUP_REFRESH_TIMEOUT_MS),
        catchError(() => of(null)),
      ),
    );
  }

  logout(): void {
    this.auth.logout().pipe(finalize(() => this.end())).subscribe({ error: () => undefined });
  }

  end(): void {
    this.tokens.token = null;
    this.router.navigate(['login']);
  }
}
