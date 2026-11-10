import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { ActivateAccountComponent } from './pages/activate-account/activate-account.component';
import { LandingComponent } from './pages/landing/landing.component';
import { AccountComponent } from './pages/account/account.component';
import { SiteLayoutComponent } from './layout/site-layout.component';
import { authGuard, guestGuard } from './auth/auth.guards';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    component: RegisterComponent,
    canActivate: [guestGuard],
  },
  {
    path: 'activate-account',
    component: ActivateAccountComponent,
  },
  {
    // Pages inside this one get the header and footer.
    path: '',
    component: SiteLayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: LandingComponent,
      },
      {
        path: 'account',
        component: AccountComponent,
        canActivate: [authGuard],
      },
    ],
  },
];
