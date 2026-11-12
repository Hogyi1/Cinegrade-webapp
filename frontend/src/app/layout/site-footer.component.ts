// [AI-GENERATED]
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TokenService } from '../services/token/token.service';
import { DESKTOP_DOWNLOAD_URL } from '../shared/links';

const CONTACT_EMAIL = 'cinegrade.webapp@gmail.com';

@Component({
  selector: 'app-site-footer',
  imports: [RouterLink],
  templateUrl: './site-footer.component.html',
  styleUrl: './site-footer.component.css',
})
export class SiteFooterComponent {
  private readonly tokens = inject(TokenService);

  readonly isLoggedIn = this.tokens.isLoggedIn;
  readonly username = this.tokens.username;
  readonly downloadUrl = DESKTOP_DOWNLOAD_URL;
  readonly email = CONTACT_EMAIL;
  readonly reportLink = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('CineGrade: reporting a problem')}`;
  readonly year = new Date().getFullYear();

  backToTop(): void {
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }
}
