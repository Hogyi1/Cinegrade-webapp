import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token/token.service';
import { SHARE_DRAFT_PARAM, SHARE_DRAFT_VALUE, isDesktop } from '../shared/desktop';

export const authGuard: CanActivateFn = () =>
  inject(TokenService).isLoggedIn() || inject(Router).createUrlTree(['/login']);

// [AI-GENERATED] Posts are shared from the desktop app's own preset menu, not from the web form inside it.
// The one way in on desktop is the app itself opening /upload?from=desktop with the files it prepared.
export const notDesktopGuard: CanActivateFn = (route) =>
  !isDesktop() ||
  route.queryParamMap.get(SHARE_DRAFT_PARAM) === SHARE_DRAFT_VALUE ||
  inject(Router).createUrlTree(['/']);

// [AI-GENERATED] Pages that only make sense in a browser (the About pitch for the app): the feed inside the app.
export const desktopHiddenGuard: CanActivateFn = () => !isDesktop() || inject(Router).createUrlTree(['/']);

// Keeps logged-in users away from the login and register pages.
export const guestGuard: CanActivateFn = () =>
  !inject(TokenService).isLoggedIn() || inject(Router).createUrlTree(['/']);
