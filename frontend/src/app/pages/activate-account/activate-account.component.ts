import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AuthenticationService } from '../../services/services';
import { Router } from '@angular/router';
import { CodeInputModule } from 'angular-code-input';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-activate-account',
  imports: [CodeInputModule, CommonModule],
  templateUrl: './activate-account.component.html',
  styleUrl: './activate-account.component.css',
  // Angular 22 alapból OnPush: enélkül a HTTP válasz után nem frissül a képernyő
  changeDetection: ChangeDetectionStrategy.Eager
})
export class ActivateAccountComponent {


  message: string = '';
  isOkay: boolean = true;
  submitted: boolean = false;

  constructor(private router: Router, private authService: AuthenticationService) { }

  onCodeCompleted(token: string) {
    this.submitted = false;
    this.confirmAccount(token);
  }
  confirmAccount(token: string) {
    this.authService.confirm({
      token
    }).subscribe({
      next: () => {
        this.message = 'Your account has been succesfully activated. \n';
        this.submitted = true;
        this.isOkay = true;
      },
      error: () => {
        this.message = 'The token has been expired';
        this.submitted = true;
        this.isOkay = false;
      }
    })
  }

  redirectToLogin() {
   this.router.navigate(['login']);
  }
}
