import { HttpErrorResponse } from '@angular/common/http';
import { businessErrorCode, errorMessages } from '../../shared/api-error';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthenticationService } from '../../services/services';
import { TokenService } from '../../services/token/token.service';
import { BeforeAfterComponent } from '../../shared/before-after.component';

// Values of BusinessErrorCodes.java
const ACCOUNT_LOCKED = 302;
const ACCOUNT_DISABLED = 303;
const BAD_CREDENTIALS = 304;

@Component({
  selector: 'app-login',
  // [AI-GENERATED] BeforeAfterComponent and login.component.css are for the split layout.
  imports: [FormsModule, RouterLink, BeforeAfterComponent],
  templateUrl: './login.component.html',
  styleUrls: ['../auth-page.css', './login.component.css'],
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
  readonly passwordReset = signal<boolean>(history.state?.passwordReset === true);

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
    this.passwordReset.set(false);
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

  // [AI-GENERATED] Uses the shared api-error helpers.
  onLoginError(err: HttpErrorResponse): void {
    this.submitting.set(false);

    switch (businessErrorCode(err)) {
      case ACCOUNT_DISABLED:
        this.needsActivation.set(true);
        return;
      case BAD_CREDENTIALS:
        this.errorMsg.set(["That login and password don't match. Check them and try again."]);
        return;
      case ACCOUNT_LOCKED:
        this.errorMsg.set(['This account is locked, so it can’t sign in.']);
        return;
    }
    this.errorMsg.set(errorMessages(err, 'Sign-in failed on the server. Try again in a moment.'));
  }
}
