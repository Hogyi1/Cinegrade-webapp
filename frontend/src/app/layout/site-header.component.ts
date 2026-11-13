import { Component, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SessionService } from '../auth/session.service';
import { CurrentUserService } from '../auth/current-user.service';
import { UserSearchComponent } from './user-search.component';
import { TokenService } from '../services/token/token.service';
import { ThemeService } from '../theme/theme.service';
import { isDesktop } from '../shared/desktop';

@Component({
  selector: 'app-site-header',
  imports: [RouterLink, RouterLinkActive, UserSearchComponent],
  templateUrl: './site-header.component.html',
  styleUrl: './site-header.component.css',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'onEscape()',
  },
})
export class SiteHeaderComponent {
  private readonly tokens = inject(TokenService);
  private readonly session = inject(SessionService);
  private readonly theme = inject(ThemeService);
  private readonly account = viewChild<ElementRef<HTMLElement>>('account');
  private readonly avatarButton = viewChild<ElementRef<HTMLButtonElement>>('avatarButton');

  readonly isLoggedIn = this.tokens.isLoggedIn;
  readonly username = this.tokens.username;
  readonly initial = computed(() => this.username()?.charAt(0).toUpperCase() ?? '?');
  // [AI-GENERATED]
  readonly avatarUrl = inject(CurrentUserService).avatarUrl;
  readonly isDark = computed(() => this.theme.theme() === 'dark');
  // [AI-GENERATED] Inside the desktop app: posting and signing in have their own buttons there
  readonly desktop = isDesktop();
  readonly menuOpen = signal(false);

  toggleTheme(): void {
    this.theme.toggle();
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  logout(): void {
    this.closeMenu();
    this.session.logout();
  }

  onDocumentClick(event: Event): void {
    if (this.menuOpen() && !this.account()?.nativeElement.contains(event.target as Node)) {
      this.closeMenu();
    }
  }

  onEscape(): void {
    if (this.menuOpen()) {
      this.closeMenu();
      this.avatarButton()?.nativeElement.focus();
    }
  }
}
