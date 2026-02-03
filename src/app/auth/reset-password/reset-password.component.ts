import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AuthenticationService } from 'src/app/core/services/authentication.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  placeholderPasswordNew: string = 'LOGIN.PLACEHOLDER_PASSWORD_NEW';
  placeholderPasswordConfirmed: string = 'LOGIN.PLACEHOLDER_PASSWORD_CONFIRMED';
  token: string | null = null;
  newPassword: string = '';
  confirmPassword: string = '';
  isNewPasswordVisible: boolean = false;
  isConfirmedPasswordVisible: boolean = false;
  loading = false;
  userChangeSuccess: boolean = false;
  userChangeError: string = '';

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService,
    private authService: AuthenticationService
  ) { }

  ngOnInit(): void {
    // Récupérer le token depuis l'URL
    this.token = this.route.snapshot.queryParamMap.get('token');
    this.translate
      .get('LOGIN.PLACEHOLDER_PASSWORD_NEW')
      .subscribe((res: string) => {
        this.placeholderPasswordNew = res;
      });


    this.translate
      .get('LOGIN.PLACEHOLDER_PASSWORD_CONFIRMED')
      .subscribe((res: string) => {
        this.placeholderPasswordConfirmed = res;
      });
  }

  toggleNewPasswordVisibility(): void {
    this.isNewPasswordVisible = !this.isNewPasswordVisible;
  }

  toggleConfirmedPasswordVisibility(): void {
    this.isConfirmedPasswordVisible = !this.isConfirmedPasswordVisible;
  }
  onSubmit(): void {
    this.loading = true;
    if (!this.token) {
      this.userChangeError = this.translate.instant('LOGIN.INVALID_TOKEN');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.userChangeError = this.translate.instant('LOGIN.MDP_NOT_MATCHING');
      return;
    }

    this.authService.resetPassword(this.token, this.newPassword).subscribe({
      next: () => {
        this.userChangeSuccess = true;
        // alert('Votre mot de passe a été réinitialisé avec succès.');
        // Rediriger l'utilisateur après succès
        this.router.navigate(['/sign-in']);
        this.loading = false;
      },
      error: (error) => {
        this.userChangeError = error.error.message || this.translate.instant('LOGIN.ERROR_HAPPEN');
        this.loading = false;
      }
    });
  }
}
