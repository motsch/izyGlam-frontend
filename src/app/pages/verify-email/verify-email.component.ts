import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UserService } from 'src/app/core/services/user.service';

// ✅ Ajouts IzyGlam : toasts + i18n
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-verify-email',
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss'],
})
export class VerifyEmailComponent implements OnInit {
  // État d’affichage pour le template
  status: 'loading' | 'success' | 'error' = 'loading';
  // Message affiché dans la page
  message = '';

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,

    // ✅ Injections pour les toasts + i18n
    private toastr: ToastrService,
    private translate: TranslateService
  ) {}

  // ------------------------------------------------------
  // ⏱️ Au chargement : on lit le token et on tente la vérification
  // ------------------------------------------------------
  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token') || '';

    // Absence de token → erreur immédiate
    if (!token) {
      this.status = 'error';
      this.message = this.translate.instant('ERROR.LINK_INVALID_OR_MISSING') || 'Lien invalide ou manquant.';
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      return;
    }

    // Tentative de vérification côté backend
    this.userService.verifyEmail(token).subscribe({
      next: () => {
        this.status = 'success';
        // ✅ Message i18n sous SUCCESS
        this.message = this.translate.instant('SUCCESS.EMAIL_VERIFIED') || 'Votre compte est activé 🎉 Vous pouvez maintenant vous connecter.';
        // Petit toast de succès (UX)
        this.toastr.success(this.message);
      },
      error: (err) => {
        console.error('Erreur lors de la vérification d’email :', err);
        this.status = 'error';
        // ✅ Message d’UI : précis si fourni par le backend, sinon i18n ERROR.*
        this.message =
          err?.error?.message ||
          this.translate.instant('ERROR.LINK_INVALID_OR_EXPIRED') ||
          'Lien invalide ou expiré.';
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      },
    });
  }

  // ------------------------------------------------------
  // 🔁 Renvoyer l’email d’activation
  // ------------------------------------------------------
  resendActivationEmail() {
    const userEmail = localStorage.getItem('userEmail');

    // Pas d’email en localStorage → on informe proprement
    if (!userEmail) {
      this.status = 'error';
      this.message = this.translate.instant('ERROR.EMAIL_NOT_FOUND') || "Email de l'utilisateur introuvable.";
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      return;
    }

    this.userService.resendVerificationEmail(userEmail).subscribe({
      next: () => {
        this.status = 'success';
        // ✅ Message i18n sous SUCCESS
        this.message = this.translate.instant('SUCCESS.EMAIL_RESENT') || 'Email de vérification renvoyé. Consultez votre boîte mail.';
        this.toastr.success(this.message);
      },
      error: (err) => {
        console.error('Erreur lors du renvoi de l’email d’activation :', err);
        this.status = 'error';
        this.message =
          err?.error?.message ||
          this.translate.instant('ERROR.LINK_INVALID_OR_EXPIRED') ||
          'Lien invalide ou expiré.';
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      },
    });
  }

  // ------------------------------------------------------
  // ✨ Toast d’erreur stylisé IzyGlam (centralisé)
  // ------------------------------------------------------
  private showCustomToast(message: string) {
    // Ex conseillé (fr.json) :
    // "ERROR": { "GENERIC_ERROR": "✨ Oups… une erreur s’est glissée. Merci de réessayer ✨" }
    this.toastr.error(message);
  }
}
