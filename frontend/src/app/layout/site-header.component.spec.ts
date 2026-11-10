import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TokenService } from '../services/token/token.service';
import { SiteHeaderComponent } from './site-header.component';

describe('SiteHeaderComponent', () => {
  let fixture: ComponentFixture<SiteHeaderComponent>;
  const page = () => fixture.nativeElement as HTMLElement;
  const logIn = () => {
    TestBed.inject(TokenService).token = `x.${btoa(JSON.stringify({ username: 'someone' }))}.y`;
    fixture.detectChanges();
  };
  const click = (selector: string) => {
    page().querySelector<HTMLElement>(selector)!.click();
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SiteHeaderComponent],
      providers: [provideRouter([]), provideHttpClient()],
    });
    fixture = TestBed.createComponent(SiteHeaderComponent);
    fixture.detectChanges();
  });

  it('offers sign in and sign up to visitors', () => {
    expect(page().textContent).toContain('Sign in');
    expect(page().textContent).toContain('Sign up');
    expect(page().querySelector('.avatar')).toBeNull();
  });

  it('shows the avatar with the first letter once logged in', () => {
    logIn();
    expect(page().querySelector('.avatar-face')?.textContent).toBe('S');
    expect(page().textContent).not.toContain('Sign in');
  });

  it('opens the menu, and closes it on an outside click or Escape', () => {
    logIn();
    click('.avatar');
    expect(page().querySelector('.menu')?.textContent).toContain('My account');
    expect(page().querySelector('.menu')?.textContent).toContain('someone');

    document.body.click();
    fixture.detectChanges();
    expect(page().querySelector('.menu')).toBeNull();

    click('.avatar');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(page().querySelector('.menu')).toBeNull();
  });
});
