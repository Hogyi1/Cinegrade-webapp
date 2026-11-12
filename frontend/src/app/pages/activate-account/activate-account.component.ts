import { HttpErrorResponse } from '@angular/common/http';
import { CONNECTION_ERROR, errorBody, errorMessages } from '../../shared/api-error';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from '../../services/services';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_LENGTH = 6;

// Values of BusinessErrorCodes.java
const ACTIVATION_CODE_EXPIRED = 308;
const ACTIVATION_ATTEMPTS_EXCEEDED = 309;

@Component({
  selector: 'app-activate-account',
  imports: [FormsModule],
  templateUrl: './activate-account.component.html',
  styleUrl: '../auth-page.css',
})
export class ActivateAccountComponent {
  private readonly router = inject(Router);
  private readonly query = inject(ActivatedRoute).snapshot.queryParamMap;
  private readonly authService = inject(AuthenticationService);

  // Filled from the email link, or from the register page.
  readonly email = signal<string>(this.query.get('email') ?? history.state?.email ?? '');
  readonly code = signal(digitsOnly(this.query.get('code') ?? ''));
  readonly submitting = signal(false);
  readonly resending = signal(false);
  readonly resent = signal(false);
  readonly errorMsg = signal<string[]>([]);

  private readonly emailChecked = signal(false);
  private readonly codeChecked = signal(false);

  constructor() {
    // Opened from the email link: activate straight away, no typing needed.
    // The link itself only opens this page; the activation is a POST sent from here.
    // Mail scanners download links but mostly don't run the page's script, so they don't activate anything.
    if (this.query.get('email') && this.query.get('code')) {
      this.submit();
    }
  }

  readonly emailError = computed(() => {
    if (!this.emailChecked()) {
      return '';
    }
    const email = this.email().trim();
    if (!email) {
      return 'Enter the email you registered with.';
    }
    return EMAIL_PATTERN.test(email) ? '' : 'Enter a valid email address, like name@example.com.';
  });

  readonly codeError = computed(() => {
    if (!this.codeChecked()) {
      return '';
    }
    return this.code().length === CODE_LENGTH ? '' : 'Enter all 6 digits of your code.';
  });

  onCodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const digits = digitsOnly(input.value);
    input.value = digits;
    this.code.set(digits);
  }

  submit(): void {
    if (this.submitting()) {
      return;
    }
    this.emailChecked.set(true);
    this.codeChecked.set(true);
    this.errorMsg.set([]);
    this.resent.set(false);
    if (this.emailError() || this.codeError()) {
      return;
    }

    this.submitting.set(true);
    this.authService.activate({
      body: { email: this.email().trim(), code: this.code() },
    }).subscribe({
      next: () => this.onActivated(),
      error: (err: HttpErrorResponse) => this.onActivateError(err),
    });
  }

  resend(): void {
    if (this.resending()) {
      return;
    }
    this.emailChecked.set(true);
    this.errorMsg.set([]);
    this.resent.set(false);
    if (this.emailError()) {
      return;
    }

    this.resending.set(true);
    this.authService.resend({ body: { email: this.email().trim() } }).subscribe({
      next: () => this.onResent(),
      error: (err: HttpErrorResponse) => this.onResendError(err),
    });
  }

  onActivated(): void {
    this.submitting.set(false);
    this.router.navigate(['login'], { state: { activated: true, login: this.email().trim() } });
  }

  // [AI-GENERATED] Uses the shared api-error helpers.
  onActivateError(err: HttpErrorResponse): void {
    this.submitting.set(false);

    const body = errorBody(err);
    switch (body?.businessErrorCode) {
      case ACTIVATION_ATTEMPTS_EXCEEDED:
        this.code.set('');
        this.errorMsg.set(['Too many wrong codes. Send yourself a new code and try again.']);
        return;
      case ACTIVATION_CODE_EXPIRED:
        this.code.set('');
        this.errorMsg.set([body.businessErrorDescription ?? 'That code has expired. We sent a new one to your email.']);
        return;
    }
    this.errorMsg.set(
      errorMessages(err, body?.businessErrorDescription ?? 'Activation failed on the server. Try again in a moment.'),
    );
  }

  onResent(): void {
    this.resending.set(false);
    this.resent.set(true);
  }

  // [AI-GENERATED] Uses the shared api-error helpers.
  onResendError(err: HttpErrorResponse): void {
    this.resending.set(false);
    this.errorMsg.set([err.status === 0 ? CONNECTION_ERROR : "We couldn't send a new code. Try again in a moment."]);
  }
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '').slice(0, CODE_LENGTH);
}
