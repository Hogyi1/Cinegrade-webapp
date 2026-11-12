import { HttpErrorResponse } from '@angular/common/http';
import { businessErrorCode, errorMessages } from '../../shared/api-error';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PASSWORD_RULE, meetsPasswordRule } from '../../auth/password-rule';
import { AuthenticationService } from '../../services/services';

// Values of BusinessErrorCodes.java
const NEW_PASSWORD_DOES_NOT_MATCH = 301;
const INVALID_RESET_LINK = 319;

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: '../auth-page.css',
})
export class ResetPasswordComponent {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthenticationService);

  // The raw token from the email link: /forgot-password/reset/:token
  readonly token = inject(ActivatedRoute).snapshot.paramMap.get('token') ?? '';
  readonly rule = PASSWORD_RULE;

  readonly password = signal('');
  readonly confirm = signal('');
  readonly showPassword = signal(false);
  readonly submitting = signal(false);
  readonly linkInvalid = signal(this.token === '');
  readonly errorMsg = signal<string[]>([]);

  private readonly submitted = signal(false);

  readonly passwordError = computed(() => {
    if (!this.submitted()) {
      return '';
    }
    if (!this.password()) {
      return 'Enter a new password.';
    }
    return meetsPasswordRule(this.password()) ? '' : PASSWORD_RULE;
  });

  readonly confirmError = computed(() =>
    this.submitted() && this.confirm() !== this.password() ? 'The passwords do not match.' : '',
  );

  togglePassword(): void {
    this.showPassword.update((shown) => !shown);
  }

  // Never sent by itself: the user has to type the new password, so a mail scanner can't use the link.
  submit(): void {
    if (this.submitting() || this.linkInvalid()) {
      return;
    }
    this.submitted.set(true);
    this.errorMsg.set([]);
    if (this.passwordError() || this.confirmError()) {
      return;
    }

    this.submitting.set(true);
    this.authService.resetPassword({
      body: { token: this.token, newPassword: this.password(), confirmPassword: this.confirm() },
    }).subscribe({
      next: () => this.onReset(),
      error: (err: HttpErrorResponse) => this.onError(err),
    });
  }

  onReset(): void {
    this.submitting.set(false);
    this.router.navigate(['login'], { state: { passwordReset: true } });
  }

  // [AI-GENERATED] Uses the shared api-error helpers.
  onError(err: HttpErrorResponse): void {
    this.submitting.set(false);

    switch (businessErrorCode(err)) {
      case INVALID_RESET_LINK:
        this.linkInvalid.set(true);
        return;
      case NEW_PASSWORD_DOES_NOT_MATCH:
        this.errorMsg.set(['The passwords do not match.']);
        return;
    }
    this.errorMsg.set(errorMessages(err, 'Saving the new password failed on the server. Try again in a moment.'));
  }
}
