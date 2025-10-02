import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from 'src/app/core/services/user.service';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss'],
})
export class VerifyEmailComponent implements OnInit {
  status: 'loading' | 'success' | 'error' = 'loading';
  message = '';

  constructor(private route: ActivatedRoute, private userService: UserService) { }

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token') || '';

    if (!token) {
      this.status = 'error';
      this.message = 'Lien invalide ou manquant.';
      return;
    }

    this.userService.verifyEmail(token).subscribe({
      next: () => {
        this.status = 'success';
        this.message = 'Votre compte est activé 🎉 Vous pouvez maintenant vous connecter.';
      },
      error: (err) => {
        this.status = 'error';
        this.message = err?.error?.message || 'Lien invalide ou expiré.';
      },
    });
  }

  resendActivationEmail() {
    const userEmail = localStorage.getItem("userEmail");
    if (!userEmail) {
      this.status = 'error';
      this.message = 'Email de l\'utilisateur introuvable.';
      return;
    }
    this.userService.resendVerificationEmail(userEmail).subscribe({
      next: () => {
        this.status = 'success';
        this.message = 'Votre compte est activé 🎉 Vous pouvez maintenant vous connecter.';
      },
      error: (err) => {
        this.status = 'error';
        this.message = err?.error?.message || 'Lien invalide ou expiré.';
      },
    });
  }
}
