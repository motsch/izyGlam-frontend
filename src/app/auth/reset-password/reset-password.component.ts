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
  errorMessage: string = '';
  isNewPasswordVisible: boolean = false;
  isConfirmedPasswordVisible: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
            private translate: TranslateService,
    private authService: AuthenticationService
  ) {}

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
    if (!this.token) {
      this.errorMessage = 'Le token est invalide ou manquant.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Les mots de passe ne correspondent pas.';
      return;
    }

    this.authService.resetPassword(this.token, this.newPassword).subscribe({
      next: () => {
        alert('Votre mot de passe a été réinitialisé avec succès.');
        // Rediriger l'utilisateur après succès
    this.router.navigate(['/sign-in']);
      },
      error: (error) => {
        this.errorMessage = error.error.message || 'Une erreur est survenue.';
      }
    });
  }
}
