import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;

  const failWith = (status: number, error: unknown) =>
    component.onLoginError(new HttpErrorResponse({ status, error }));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('confirms activation and fills in the login after the activation page', () => {
    history.replaceState({ activated: true, login: 'name@example.com' }, '');
    const arrived = TestBed.createComponent(LoginComponent).componentInstance;
    history.replaceState(null, '');

    expect(arrived.activated()).toBeTrue();
    expect(arrived.login()).toBe('name@example.com');
  });

  it('requires both fields, and clears the error once a field is filled', () => {
    expect(component.loginError()).toBe('');

    component.submit();
    expect(component.loginError()).not.toBe('');
    expect(component.passwordError()).not.toBe('');

    component.login.set('someone');
    expect(component.loginError()).toBe('');
    expect(component.passwordError()).not.toBe('');
  });

  it('treats a whitespace-only login as empty', () => {
    component.login.set('   ');
    component.submit();
    expect(component.loginError()).not.toBe('');
  });

  it('toggles the password input type', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#password');
    expect(input.type).toBe('password');

    component.togglePassword();
    fixture.detectChanges();
    expect(input.type).toBe('text');
  });

  it('shows the activation prompt for a disabled account', () => {
    failWith(401, { businessErrorCode: 303 });
    expect(component.needsActivation()).toBeTrue();
    expect(component.errorMsg()).toEqual([]);
  });

  it('maps bad credentials and locked accounts to different messages', () => {
    failWith(401, { businessErrorCode: 304 });
    const badCredentials = component.errorMsg()[0];

    failWith(401, { businessErrorCode: 302 });
    expect(component.errorMsg()[0]).toContain('locked');
    expect(badCredentials).not.toContain('locked');
  });

  it('lists validation errors from the server', () => {
    failWith(400, { validationErrors: ['one', 'two'] });
    expect(component.errorMsg()).toEqual(['one', 'two']);
  });

  it('handles an unreachable server and an empty error body', () => {
    failWith(0, null);
    expect(component.errorMsg()[0]).toContain('reach');

    failWith(500, null);
    expect(component.errorMsg()[0]).toContain('server');
    expect(component.submitting()).toBeFalse();
  });
});
