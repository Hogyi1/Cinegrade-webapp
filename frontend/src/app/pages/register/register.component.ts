import { HttpErrorResponse } from '@angular/common/http';
import { errorBody, errorMessages } from '../../shared/api-error';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { USERNAME_PATTERN, USERNAME_RULE } from '../../auth/username-rule';
import { meetsPasswordRule } from '../../auth/password-rule';
import { AuthenticationService } from '../../services/services';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const AVAILABILITY_DELAY_MS = 350;

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: '../auth-page.css',
})
export class RegisterComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthenticationService);

  readonly usernameRule = USERNAME_RULE;

  readonly username = signal('');
  readonly email = signal('');
  readonly password = signal('');
  readonly confirmPassword = signal('');
  readonly showPassword = signal(false);
  readonly submitting = signal(false);
  readonly errorMsg = signal<string[]>([]);
  readonly usernameStatus = signal<UsernameStatus>('idle');

  private readonly submitted = signal(false);
  private availabilityTimer?: ReturnType<typeof setTimeout>;

  readonly usernameError = computed(() => {
    if (this.usernameStatus() === 'taken') {
      return 'That username is taken. Try another one.';
    }
    if (!this.submitted()) {
      return '';
    }
    if (!this.username()) {
      return 'Choose a username.';
    }
    return USERNAME_PATTERN.test(this.username()) ? '' : `Use ${USERNAME_RULE}`;
  });

  readonly emailError = computed(() => {
    if (!this.submitted()) {
      return '';
    }
    const email = this.email().trim();
    if (!email) {
      return 'Enter your email address.';
    }
    return EMAIL_PATTERN.test(email) ? '' : 'Enter a valid email address, like name@example.com.';
  });

  readonly passwordError = computed(() => {
    if (!this.submitted()) {
      return '';
    }
    if (!this.password()) {
      return 'Choose a password.';
    }
    return meetsPasswordRule(this.password())
      ? ''
      : 'Use at least 8 characters, including 2 numbers and 1 special character.';
  });

  readonly confirmPasswordError = computed(() => {
    if (!this.submitted()) {
      return '';
    }
    if (!this.confirmPassword()) {
      return 'Enter your password again.';
    }
    return this.confirmPassword() === this.password() ? '' : "The passwords don't match.";
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.availabilityTimer));
  }

  onUsernameChange(value: string): void {
    const username = value.toLowerCase();
    this.username.set(username);
    this.usernameStatus.set('idle');
    clearTimeout(this.availabilityTimer);

    if (USERNAME_PATTERN.test(username)) {
      this.availabilityTimer = setTimeout(() => this.checkAvailability(username), AVAILABILITY_DELAY_MS);
    }
  }

  togglePassword(): void {
    this.showPassword.update((shown) => !shown);
  }

  submit(): void {
    if (this.submitting()) {
      return;
    }
    this.submitted.set(true);
    this.errorMsg.set([]);
    if (this.usernameError() || this.emailError() || this.passwordError() || this.confirmPasswordError()) {
      return;
    }

    this.submitting.set(true);
    this.authService.register({
      body: { username: this.username(), email: this.email().trim(), password: this.password() },
    }).subscribe({
      next: () => this.onRegisterSuccess(),
      error: (err: HttpErrorResponse) => this.onRegisterError(err),
    });
  }

  // Ignores answers for a name the user has already typed past.
  onAvailabilityResult(username: string, available: boolean): void {
    if (username === this.username()) {
      this.usernameStatus.set(available ? 'available' : 'taken');
    }
  }

  onRegisterSuccess(): void {
    this.submitting.set(false);
    // The activation step needs the email together with the code.
    this.router.navigate(['activate-account'], { state: { email: this.email().trim() } });
  }

  // [AI-GENERATED] Uses the shared api-error helpers.
  onRegisterError(err: HttpErrorResponse): void {
    this.submitting.set(false);

    if (err.status === 409 && !errorBody(err)?.validationErrors?.length) {
      this.errorMsg.set([
        errorBody(err)?.businessErrorDescription ??
          'That username or email is already registered. Sign in, or use a different one.',
      ]);
      return;
    }
    this.errorMsg.set(errorMessages(err, 'Account creation failed on the server. Try again in a moment.'));
  }

  private checkAvailability(username: string): void {
    this.usernameStatus.set('checking');
    this.authService.isUsernameAvailable({ username }).subscribe({
      next: (available) => this.onAvailabilityResult(username, available),
      error: () => this.usernameStatus.set('idle'),
    });
  }
}
