import { Component } from '@angular/core';

const CONTACT_EMAIL = 'cinegrade.webapp@gmail.com';

@Component({
  selector: 'app-site-footer',
  templateUrl: './site-footer.component.html',
  styleUrl: './site-footer.component.css',
})
export class SiteFooterComponent {
  readonly email = CONTACT_EMAIL;
  readonly reportLink = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('CineGrade: reporting a problem')}`;
  readonly year = new Date().getFullYear();

  // Add each address here and the name turns into a link.
  readonly socials = [
    { name: 'Instagram', url: '' },
    { name: 'Discord', url: '' },
    { name: 'Twitter', url: '' },
    { name: 'YouTube', url: '' },
  ];

  backToTop(): void {
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }
}
