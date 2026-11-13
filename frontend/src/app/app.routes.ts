import { Routes } from '@angular/router';
import { SiteLayoutComponent } from './layout/site-layout.component';
import { authGuard, desktopHiddenGuard, guestGuard, notDesktopGuard } from './auth/auth.guards';

// [AI-GENERATED] Every page is loaded only when it's first opened (loadComponent),
// which keeps the first download small.
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.component').then((m) => m.RegisterComponent),
    canActivate: [guestGuard],
  },
  {
    path: 'activate-account',
    loadComponent: () =>
      import('./pages/activate-account/activate-account.component').then((m) => m.ActivateAccountComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./pages/forgot-password/forgot-password.component').then((m) => m.ForgotPasswordComponent),
    canActivate: [guestGuard],
  },
  {
    // The link in the reset email. No guard: the link works even in a browser that's logged in.
    path: 'forgot-password/reset/:token',
    loadComponent: () =>
      import('./pages/reset-password/reset-password.component').then((m) => m.ResetPasswordComponent),
  },
  {
    // Pages inside this one get the header and footer.
    path: '',
    component: SiteLayoutComponent,
    children: [
      // [AI-GENERATED] The feed is the home page; the old landing page is now About.
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./pages/feed/feed.component').then((m) => m.FeedComponent),
      },
      {
        path: 'about',
        loadComponent: () => import('./pages/landing/landing.component').then((m) => m.LandingComponent),
        // [AI-GENERATED] The pitch for the app; inside the app it goes to the feed instead
        canActivate: [desktopHiddenGuard],
      },
      {
        path: 'users/:username',
        loadComponent: () => import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
      },
      // [AI-GENERATED] Posts
      {
        path: 'upload',
        loadComponent: () => import('./pages/upload/upload.component').then((m) => m.UploadComponent),
        // [AI-GENERATED] The desktop app shares from its preset menu instead
        canActivate: [notDesktopGuard, authGuard],
      },
      {
        path: 'posts/:id',
        loadComponent: () => import('./pages/post/post.component').then((m) => m.PostComponent),
      },
      {
        path: 'search',
        loadComponent: () => import('./pages/search/search.component').then((m) => m.SearchComponent),
      },
      {
        path: 'account',
        loadComponent: () => import('./pages/account/account.component').then((m) => m.AccountComponent),
        canActivate: [authGuard],
      },
    ],
  },
];
