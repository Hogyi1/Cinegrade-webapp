import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  beforeEach(() => localStorage.removeItem('theme'));
  afterEach(() => {
    localStorage.removeItem('theme');
    document.documentElement.removeAttribute('data-theme');
  });

  it('starts dark', () => {
    expect(TestBed.inject(ThemeService).theme()).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });

  it('switches the page and remembers the choice', () => {
    TestBed.inject(ThemeService).toggle();
    expect(document.documentElement.dataset['theme']).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('starts with the saved theme', () => {
    localStorage.setItem('theme', 'light');
    expect(TestBed.inject(ThemeService).theme()).toBe('light');
  });
});
