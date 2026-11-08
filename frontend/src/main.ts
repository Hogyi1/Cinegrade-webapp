import { provideZoneChangeDetection } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppComponent } from './app/app.component';
import { HttpClientModule, provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';
import { bootstrapApplication } from '@angular/platform-browser';
import { ApiConfiguration } from './app/services/api-configuration';

// Relatív API cím: fejlesztéskor az `ng serve` proxy, élesben az nginx
// továbbítja a /api kéréseket a backendnek -> nem kell domaint beégetni.
const apiConfig = new ApiConfiguration();
apiConfig.rootUrl = '/api/v1';

bootstrapApplication(AppComponent, {
  providers: [
    // Angular 21 óta ez nélkül a képernyő nem frissül a HTTP válaszok után
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(),
    provideRouter(routes),
    { provide: ApiConfiguration, useValue: apiConfig }
  ]
}).catch(err => console.error(err));
