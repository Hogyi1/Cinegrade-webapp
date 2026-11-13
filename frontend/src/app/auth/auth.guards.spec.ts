import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree, convertToParamMap, provideRouter } from '@angular/router';
import { TokenService } from '../services/token/token.service';
import { authGuard, desktopHiddenGuard, guestGuard, notDesktopGuard } from './auth.guards';

describe('auth guards', () => {
  const run = (guard: typeof authGuard) =>
    TestBed.runInInjectionContext(() =>
      guard({ queryParamMap: convertToParamMap({}) } as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
  const url = (result: unknown) => TestBed.inject(Router).serializeUrl(result as UrlTree);

  beforeEach(() => TestBed.configureTestingModule({ providers: [provideRouter([])] }));

  it('sends logged-out users to the login page', () => {
    expect(url(run(authGuard))).toBe('/login');
    expect(run(guestGuard)).toBeTrue();
  });

  // [AI-GENERATED]
  it('keeps the desktop app away from the web post form', () => {
    expect(run(notDesktopGuard)).toBeTrue();
    spyOnProperty(navigator, 'userAgent').and.returnValue('Mozilla/5.0 JavaFX CineGradeDesktop/1.0');
    expect(url(run(notDesktopGuard))).toBe('/');
  });

  // [AI-GENERATED]
  it('sends the desktop app from the About page to the feed', () => {
    expect(run(desktopHiddenGuard)).toBeTrue();
    spyOnProperty(navigator, 'userAgent').and.returnValue('Mozilla/5.0 JavaFX CineGradeDesktop/1.0');
    expect(url(run(desktopHiddenGuard))).toBe('/');
  });

  // [AI-GENERATED]
  it('lets the desktop app open the form with its own share draft', () => {
    spyOnProperty(navigator, 'userAgent').and.returnValue('Mozilla/5.0 JavaFX CineGradeDesktop/1.0');
    const route = { queryParamMap: convertToParamMap({ from: 'desktop' }) } as ActivatedRouteSnapshot;
    const result = TestBed.runInInjectionContext(() => notDesktopGuard(route, {} as RouterStateSnapshot));
    expect(result).toBeTrue();
  });

  it('sends logged-in users to the landing page', () => {
    TestBed.inject(TokenService).token = 'token';
    expect(run(authGuard)).toBeTrue();
    expect(url(run(guestGuard))).toBe('/');
  });
});
