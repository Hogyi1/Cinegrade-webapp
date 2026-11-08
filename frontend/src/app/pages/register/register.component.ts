import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RegistrationRequest } from '../../services/models';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../services/services';

@Component({
  selector: 'app-register',
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css',
  // Angular 22 alapból OnPush: enélkül a HTTP válasz után nem frissül a képernyő
  changeDetection: ChangeDetectionStrategy.Eager
})
export class RegisterComponent {
  registerRequest: RegistrationRequest = {
    email: '',
    firstName: '',
    lastName: '',
    password: '',
  }
  errorMsg: Array<string> = [];

  constructor(
    private router: Router, private authService: AuthenticationService
  ) { }


  register() {
    this.errorMsg = [];
    this.authService.register({
      body: this.registerRequest
    }).subscribe({
      next: () => {
        this.router.navigate(['activate-account']);
      },
      error: (err) => {
        this.errorMsg = err.error?.validationErrors
          ?? [err.error?.businessErrorDescription ?? err.error?.error ?? 'Registration failed, please try again'];
      }
    })
  }
  login() {
    this.router.navigate(['login'])
  }
}
