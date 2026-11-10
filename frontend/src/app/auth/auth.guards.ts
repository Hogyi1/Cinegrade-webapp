import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from '../services/token/token.service';

export const authGuard: CanActivateFn = () =>
  inject(TokenService).isLoggedIn() || inject(Router).createUrlTree(['/login']);

// Keeps logged-in users away from the login and register pages.
export const guestGuard: CanActivateFn = () =>
  !inject(TokenService).isLoggedIn() || inject(Router).createUrlTree(['/']);
