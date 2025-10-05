import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { UserService } from '../../services/user.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-profile-informations',
  templateUrl: './profile-informations.component.html',
  styleUrls: ['./profile-informations.component.scss'],
})
export class ProfileInformationsComponent implements OnInit, OnChanges {
  // ====== Inputs ======
  @Input() me: any = {};

  // ====== UI / State ======
  disabledButton = true;
  imgStorageUrl: string = environment.imgStorageUrl;
  profileForm: FormGroup | undefined;
  imagePreview: string | undefined;

  // Flags et messages locaux (les toasts gèrent surtout l’affichage à l’utilisateur)
  userChangeSuccess: boolean = false;
  userChangeError: string = '';

  // Onglet actif (pour la navigation interne)
  activeSection: string = 'account-info';

  // Copie de travail
  user: any = {};
  userCopy: any = {};

  constructor(
    private userService: UserService,
    private translate: TranslateService,
    private toastr: ToastrService
  ) {}

  // ============================================================
  // ===================   LIFECYCLE HOOKS   ====================
  // ============================================================

  ngOnInit(): void {
    try {
      // Mémorise l’onglet actif (utile à la navigation globale)
      localStorage.setItem('menu-param', 'account-info');

      // Initialise les données si déjà disponibles
      this.updateUser();
    } catch (err) {
      console.error('[ProfileInformations] ngOnInit ERROR:', err);
      this.showCustomToast(
        this.translate.instant('ERROR.GENERIC_ERROR') || 'Une erreur est survenue.',
        'error'
      );
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    try {
      // Si `me` arrive après l’init, on rafraîchit l’état local
      if (changes['me'] && changes['me'].currentValue) {
        this.updateUser();
      }
    } catch (err) {
      console.error('[ProfileInformations] ngOnChanges ERROR:', err, changes);
      this.showCustomToast(
        this.translate.instant('ERROR.GENERIC_ERROR') || 'Une erreur est survenue.',
        'error'
      );
    }
  }

  // ============================================================
  // ======================   DATA LOGIC   ======================
  // ============================================================

  /**
   * Met à jour l’état local à partir de `me`.
   * Garde une copie immuable pour pouvoir annuler.
   */
  private updateUser(): void {
    try {
      if (!this.me || typeof this.me !== 'object') {
        console.warn('[ProfileInformations] updateUser: `me` invalide ou vide.');
        return;
      }
      this.user = { ...this.me };
      this.userCopy = { ...this.me };
      // Par défaut, aucune modif → bouton désactivé
      this.disabledButton = true;
      console.log('[ProfileInformations] user loaded:', this.user);
    } catch (err) {
      console.error('[ProfileInformations] updateUser ERROR:', err);
      this.showCustomToast(
        this.translate.instant('ERROR.GENERIC_ERROR') || 'Erreur lors du chargement du profil.',
        'error'
      );
    }
  }

  // ============================================================
  // ===================   ACTIONS UTILISATEUR   ================
  // ============================================================

  /**
   * Soumet les modifications de profil.
   */
  validateChangeUser() {
    try {
      console.log('[ProfileInformations] validateChangeUser() called');
      // On peut ajouter ici des validations avant submit si nécessaire

      this.userService.update(this.user).subscribe({
        next: (dataUpdate: any) => {
          try {
            console.log('[ProfileInformations] update response:', dataUpdate);

            // Vérif rapide : on compare quelques champs clés
            const isOk =
              dataUpdate?.email === this.user.email &&
              dataUpdate?.firstname === this.user.firstname &&
              dataUpdate?.lastname === this.user.lastname &&
              dataUpdate?.phone === this.user.phone;

            if (isOk) {
              // On remet la copie à jour et on désactive le bouton
              this.userCopy = { ...dataUpdate };
              this.userChangeSuccess = true;
              this.disabledButton = true;

              // Toast succès (clé i18n optionnelle)
              this.showCustomToast(
                this.translate.instant('SUCCESS.PROFILE_UPDATED') || 'Profil mis à jour avec succès.',
                'success'
              );

              this.handleErrorClearance();
            } else {
              // Le backend renvoie autre chose que prévu
              console.warn('[ProfileInformations] update mismatch:', { expected: this.user, got: dataUpdate });
              this.userChangeError = this.translate.instant('ERROR.GENERIC_ERROR') || 'Échec de la mise à jour.';
              this.showCustomToast(this.userChangeError, 'error');
              this.handleErrorClearance();
            }
          } catch (innerErr) {
            console.error('[ProfileInformations] validateChangeUser next ERROR:', innerErr);
            this.userChangeError = this.translate.instant('ERROR.GENERIC_ERROR') || 'Une erreur est survenue.';
            this.showCustomToast(this.userChangeError, 'error');
            this.handleErrorClearance();
          }
        },
        error: (updateError: any) => {
          console.error('[ProfileInformations] update ERROR:', updateError);
          this.userChangeError =
            this.translate.instant('PROFILE.UPDATE_ERROR') ||
            this.translate.instant('ERROR.GENERIC_ERROR') ||
            'Erreur lors de la mise à jour du profil.';
          this.showCustomToast(this.userChangeError, 'error');
          this.handleErrorClearance();
        },
      });
    } catch (err) {
      console.error('[ProfileInformations] validateChangeUser CATCH ERROR:', err);
      this.userChangeError =
        this.translate.instant('ERROR.GENERIC_ERROR') || 'Une erreur est survenue.';
      this.showCustomToast(this.userChangeError, 'error');
      this.handleErrorClearance();
    }
  }

  /**
   * Déclenchement UI → active le bouton "Enregistrer"
   * dès qu’un changement est détecté dans le formulaire.
   */
  changedDetected() {
    try {
      this.disabledButton = false;
    } catch (err) {
      console.error('[ProfileInformations] changedDetected ERROR:', err);
    }
  }

  /**
   * Annule les changements et restaure l’état initial.
   */
  cancel() {
    try {
      this.user = { ...this.userCopy };
      this.disabledButton = true;
      this.showCustomToast(
        this.translate.instant('SUCCESS.CHANGES_CANCELLED') || 'Modifications annulées.',
        'success'
      );
    } catch (err) {
      console.error('[ProfileInformations] cancel ERROR:', err);
      this.showCustomToast(
        this.translate.instant('ERROR.GENERIC_ERROR') || 'Impossible d’annuler les modifications.',
        'error'
      );
    }
  }

  // ============================================================
  // ===================   HELPERS / FEEDBACK   =================
  // ============================================================

  /**
   * Nettoie les messages/flags locaux (les toasts gèrent la notif UI).
   */
  private handleErrorClearance(): void {
    setTimeout(() => {
      this.userChangeSuccess = false;
      this.userChangeError = '';
    }, 5000);
  }

  /**
   * Affiche un toast succès/erreur avec fallback si la clé i18n n’existe pas.
   */
  private showCustomToast(messageOrKey: string, type: 'success' | 'error' = 'success') {
    try {
      const translated = this.translate.instant(messageOrKey);
      const msg = translated && translated !== messageOrKey ? translated : messageOrKey;
      if (type === 'success') this.toastr.success(msg);
      else this.toastr.error(msg);
    } catch (e) {
      console.warn('[ProfileInformations] showCustomToast WARN (fallback):', e);
      if (type === 'success') this.toastr.success(messageOrKey);
      else this.toastr.error(messageOrKey);
    }
  }
}
