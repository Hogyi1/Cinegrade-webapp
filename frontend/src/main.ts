import { inject, provideAppInitializer, provideZoneChangeDetection } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppComponent } from './app/app.component';
import { HttpClientModule, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app/app.routes';
import { bootstrapApplication } from '@angular/platform-browser';
import { ApiConfiguration } from './app/services/api-configuration';
import { authInterceptor } from './app/auth/auth.interceptor';
import { SessionService } from './app/auth/session.service';
import { ThemeService } from './app/theme/theme.service';

// Relatív API cím: fejlesztéskor az `ng serve` proxy, élesben az nginx
// továbbítja a /api kéréseket a backendnek -> nem kell domaint beégetni.
const apiConfig = new ApiConfiguration();
apiConfig.rootUrl = '/api/v1';

bootstrapApplication(AppComponent, {
  providers: [
    // Angular 21 óta enélkül a képernyő nem frissül a HTTP válaszok után
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'enabled' })),
    { provide: ApiConfiguration, useValue: apiConfig },
    provideAppInitializer(() => void inject(ThemeService)),
    provideAppInitializer(() => inject(SessionService).restore())
  ]
}).catch(err => console.error(err));
