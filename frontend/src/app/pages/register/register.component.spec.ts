import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { RegisterComponent } from './register.component';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  const failWith = (status: number, error: unknown) =>
    component.onRegisterError(new HttpErrorResponse({ status, error }));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('requires every field once submitted', () => {
    expect(component.usernameError()).toBe('');

    component.submit();
    expect(component.usernameError()).not.toBe('');
    expect(component.emailError()).not.toBe('');
    expect(component.passwordError()).not.toBe('');
    expect(component.confirmPasswordError()).not.toBe('');
  });

  it('requires the password to be repeated exactly', () => {
    component.submit();
    component.password.set('abcdef12!');

    component.confirmPassword.set('abcdef12?');
    expect(component.confirmPasswordError()).toContain("don't match");

    component.confirmPassword.set('abcdef12!');
    expect(component.confirmPasswordError()).toBe('');
  });

  it('lowercases the username as it is typed', () => {
    component.onUsernameChange('Some_User');
    expect(component.username()).toBe('some_user');
  });

  it('rejects usernames outside the allowed format', () => {
    component.submit();
    for (const bad of ['ab', 'has space', 'at@sign', 'x'.repeat(31)]) {
      component.onUsernameChange(bad);
      expect(component.usernameError()).withContext(bad).not.toBe('');
    }
    component.onUsernameChange('good_name1');
    expect(component.usernameError()).toBe('');
  });

  it('validates the email format', () => {
    component.submit();

    component.email.set('nope');
    expect(component.emailError()).not.toBe('');
    component.email.set(' name@example.com ');
    expect(component.emailError()).toBe('');
  });

  it('applies the same password rule as the server', () => {
    component.submit();

    for (const bad of ['abc12!', 'abcdefg1!', 'abcdefg12', 'abcdef12 ']) {
      component.password.set(bad);
      expect(component.passwordError()).withContext(bad).not.toBe('');
    }
    component.password.set('abcdef12!');
    expect(component.passwordError()).toBe('');
  });

  it('shows a taken username without waiting for submit', () => {
    component.onUsernameChange('taken_name');
    component.onAvailabilityResult('taken_name', false);
    expect(component.usernameError()).toContain('taken');
  });

  it('ignores an availability answer for an older name', () => {
    component.onUsernameChange('first_name');
    component.onUsernameChange('second_name');
    component.onAvailabilityResult('first_name', false);
    expect(component.usernameStatus()).toBe('idle');
  });

  it('clears the availability status when the username changes', () => {
    component.onUsernameChange('free_name');
    component.onAvailabilityResult('free_name', true);
    expect(component.usernameStatus()).toBe('available');

    component.onUsernameChange('free_name2');
    expect(component.usernameStatus()).toBe('idle');
  });

  it('goes to activation with the email after success', () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate');
    component.email.set(' name@example.com ');

    component.onRegisterSuccess();

    expect(navigate).toHaveBeenCalledOnceWith(['activate-account'], {
      state: { email: 'name@example.com' },
    });
  });

  it('maps server errors to messages', () => {
    failWith(400, { validationErrors: ['one', 'two'] });
    expect(component.errorMsg()).toEqual(['one', 'two']);

    failWith(409, null);
    expect(component.errorMsg()[0]).toContain('already registered');

    failWith(0, null);
    expect(component.errorMsg()[0]).toContain('reach');

    failWith(500, null);
    expect(component.errorMsg()[0]).toContain('server');
    expect(component.submitting()).toBeFalse();
  });

  it('toggles the password input type', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#password');
    expect(input.type).toBe('password');

    component.togglePassword();
    fixture.detectChanges();
    expect(input.type).toBe('text');
  });
});
