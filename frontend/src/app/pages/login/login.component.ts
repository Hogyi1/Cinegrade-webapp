import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthenticationService } from '../../services/services';
import { TokenService } from '../../services/token/token.service';

// Values of BusinessErrorCodes.java
const ACCOUNT_LOCKED = 302;
const ACCOUNT_DISABLED = 303;
const BAD_CREDENTIALS = 304;

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: '../auth-page.css',
})
export class LoginComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthenticationService);
  private readonly tokenService = inject(TokenService);

  // Filled in when the user arrives from the activation page.
  readonly login = signal<string>(history.state?.login ?? '');
  readonly password = signal('');
  readonly showPassword = signal(false);
  readonly submitting = signal(false);
  readonly errorMsg = signal<string[]>([]);
  readonly needsActivation = signal(false);
  readonly activated = signal<boolean>(history.state?.activated === true);

  private readonly submitted = signal(false);

  readonly loginError = computed(() =>
    this.submitted() && !this.login().trim() ? 'Enter your username or email.' : '',
  );
  readonly passwordError = computed(() =>
    this.submitted() && !this.password() ? 'Enter your password.' : '',
  );

  togglePassword(): void {
    this.showPassword.update((shown) => !shown);
  }

  submit(): void {
    if (this.submitting()) {
      return;
    }
    this.submitted.set(true);
    this.errorMsg.set([]);
    this.needsActivation.set(false);
    this.activated.set(false);
    if (this.loginError() || this.passwordError()) {
      return;
    }

    this.submitting.set(true);
    this.authService.login({
      body: { login: this.login().trim(), password: this.password() },
    }).subscribe({
      next: (res) => {
        this.tokenService.token = res.token as string;
        this.onLoginSuccess();
      },
      error: (err: HttpErrorResponse) => this.onLoginError(err),
    });
  }

  onLoginSuccess(): void {
    this.submitting.set(false);
    this.router.navigate(['/']);
  }

  onLoginError(err: HttpErrorResponse): void {
    this.submitting.set(false);

    const validationErrors: string[] | undefined = err.error?.validationErrors;
    if (validationErrors?.length) {
      this.errorMsg.set(validationErrors);
      return;
    }
    if (err.status === 0) {
      this.errorMsg.set(["Can't reach CineGrade. Check your connection and try again."]);
      return;
    }

    switch (err.error?.businessErrorCode) {
      case ACCOUNT_DISABLED:
        this.needsActivation.set(true);
        break;
      case BAD_CREDENTIALS:
        this.errorMsg.set(["That login and password don't match. Check them and try again."]);
        break;
      case ACCOUNT_LOCKED:
        this.errorMsg.set(['This account is locked, so it can’t sign in.']);
        break;
      default:
        this.errorMsg.set(['Sign-in failed on the server. Try again in a moment.']);
    }
  }
}
