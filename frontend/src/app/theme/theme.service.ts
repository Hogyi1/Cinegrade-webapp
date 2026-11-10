import { Injectable, signal } from '@angular/core';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'theme';

function savedTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  readonly theme = signal<Theme>(savedTheme());

  constructor() {
    this.apply();
  }

  toggle(): void {
    this.theme.update((theme) => (theme === 'dark' ? 'light' : 'dark'));
    this.apply();
    try {
      localStorage.setItem(STORAGE_KEY, this.theme());
    } catch {
      // Private windows can block storage. The theme still applies until the next reload.
    }
  }

  private apply(): void {
    document.documentElement.dataset['theme'] = this.theme();
  }
}
