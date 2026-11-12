import { HttpErrorResponse } from '@angular/common/http';
import { CONNECTION_ERROR } from '../../shared/api-error';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthenticationService } from '../../services/services';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

@Component({
  selector: 'app-forgot-password',
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: '../auth-page.css',
})
export class ForgotPasswordComponent {
  private readonly authService = inject(AuthenticationService);

  // Filled in when the user comes from the login page with an email already typed.
  readonly email = signal<string>(history.state?.email ?? '');
  readonly submitting = signal(false);
  readonly sent = signal(false);
  readonly errorMsg = signal('');

  private readonly submitted = signal(false);

  readonly emailError = computed(() => {
    if (!this.submitted()) {
      return '';
    }
    const email = this.email().trim();
    if (!email) {
      return 'Enter the email you registered with.';
    }
    return EMAIL_PATTERN.test(email) ? '' : 'Enter a valid email address, like name@example.com.';
  });

  submit(): void {
    if (this.submitting()) {
      return;
    }
    this.submitted.set(true);
    this.errorMsg.set('');
    this.sent.set(false);
    if (this.emailError()) {
      return;
    }

    this.submitting.set(true);
    this.authService.forgotPassword({ body: { email: this.email().trim() } }).subscribe({
      next: () => this.onSent(),
      error: (err: HttpErrorResponse) => this.onError(err),
    });
  }

  onSent(): void {
    this.submitting.set(false);
    // The same message for every email: the backend never says whether an account exists.
    this.sent.set(true);
  }

  // [AI-GENERATED] Uses the shared api-error helpers.
  onError(err: HttpErrorResponse): void {
    this.submitting.set(false);
    this.errorMsg.set(err.status === 0 ? CONNECTION_ERROR : "We couldn't send the link. Try again in a moment.");
  }
}
