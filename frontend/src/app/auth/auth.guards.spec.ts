import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { TokenService } from '../services/token/token.service';
import { authGuard, guestGuard } from './auth.guards';

describe('auth guards', () => {
  const run = (guard: typeof authGuard) =>
    TestBed.runInInjectionContext(() => guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot));
  const url = (result: unknown) => TestBed.inject(Router).serializeUrl(result as UrlTree);

  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));

  it('sends logged-out users to the login page', () => {
    expect(url(run(authGuard))).toBe('/login');
    expect(run(guestGuard)).toBeTrue();
  });

  it('sends logged-in users to the landing page', () => {
    TestBed.inject(TokenService).token = 'token';
    expect(run(authGuard)).toBeTrue();
    expect(url(run(guestGuard))).toBe('/');
  });
});
