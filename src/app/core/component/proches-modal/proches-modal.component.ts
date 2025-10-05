import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewChecked,
  Inject,
  OnInit,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

// Notifications / i18n
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-proches-modal',
  templateUrl: './proches-modal.component.html',
  styleUrls: ['./proches-modal.component.scss'],
})
export class ProchesModalComponent implements AfterViewChecked, OnInit {
  // ====== Références DOM ======
  @ViewChild('searchInput') searchInputElement: ElementRef | undefined;

  // ====== État UI ======
  step = 1;                 // Étape courante du wizard
  elem: any = {};           // Proche en cours d’édition/Création
  validate = false;         // Affiche la zone de validation
  savedProche: any = {};    // Copie pour annulation/retour en arrière

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,                  // Données injectées : { user, ... }
    private dialogRef: MatDialogRef<ProchesModalComponent>,     // Référence pour fermer la modale
    private toastr: ToastrService,                              // Toasts de succès/erreur
    private translate: TranslateService                         // i18n
  ) {}

  // ============================================================
  // ===================   LIFECYCLE HOOKS   ====================
  // ============================================================

  ngOnInit() {
    try {
      // Sécuriser l'accès aux données injectées
      if (!this.data || !this.data.user) {
        console.warn('[ProchesModal] Aucune donnée utilisateur injectée.');
        this.showCustomToast(
          this.translate.instant('ERROR.GENERIC_ERROR') || 'Erreur : données indisponibles.',
          'error'
        );
        return;
      }
      console.log('[ProchesModal] Données utilisateur :', this.data.user);
    } catch (err) {
      console.error('[ProchesModal] ngOnInit ERROR:', err);
      this.showCustomToast(
        this.translate.instant('ERROR.GENERIC_ERROR') || 'Erreur lors du chargement.',
        'error'
      );
    }
  }

  ngAfterViewChecked() {
    // Focus doux sur l’input après rendu
    try {
      setTimeout(() => this.searchInputElement?.nativeElement?.focus(), 0);
    } catch (err) {
      console.warn('[ProchesModal] Focus input impossible:', err);
    }
  }

  // ============================================================
  // =====================     ACTIONS UI     ===================
  // ============================================================

  /**
   * Affiche la zone de validation (ex: récapitulatif)
   */
  showValidate() {
    try {
      this.validate = true;
    } catch (err) {
      console.error('[ProchesModal] showValidate ERROR:', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), 'error');
    }
  }

  /**
   * Passe en mode édition d’un proche existant
   */
  editProche(proche: any) {
    try {
      if (!proche) {
        console.warn('[ProchesModal] editProche appelé sans proche.');
        return;
      }
      this.step += 1;
      this.savedProche = { ...proche }; // Copie pour annuler si besoin
      this.elem = { ...proche };        // Objet modifiable par le formulaire
      console.log('[ProchesModal] Edition proche :', proche);
    } catch (err) {
      console.error('[ProchesModal] editProche ERROR:', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), 'error');
    }
  }

  /**
   * Démarre la création d’un nouveau proche
   */
  newProche() {
    try {
      this.step += 1;
      this.savedProche = null;
      this.elem = {}; // Reset du formulaire
      console.log('[ProchesModal] Création d’un nouveau proche.');
    } catch (err) {
      console.error('[ProchesModal] newProche ERROR:', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), 'error');
    }
  }

  /**
   * Retour à l’étape précédente, restauration éventuelle
   */
  stepMinus() {
    try {
      if (this.savedProche) {
        // Restaurer l'objet initial si on annule une édition
        this.elem = { ...this.savedProche };
        this.savedProche = null;
        console.log("[ProchesModal] Annulation : retour à l'état initial :", this.elem);
      } else {
        // En création : on vide juste le formulaire
        this.elem = {};
      }

      this.step = Math.max(1, this.step - 1);
      this.validate = false;

      console.log('[ProchesModal] Étape courante :', this.step);
    } catch (err) {
      console.error('[ProchesModal] stepMinus ERROR:', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), 'error');
    }
  }

  // ============================================================
  // =====================  SUBMIT / SAVE  ======================
  // ============================================================

  /**
   * Validation finale et fermeture avec retour de l’élément
   * (À appeler depuis le template quand l’utilisateur confirme)
   */
  submitProche() {
    try {
      // Petites validations de base (à adapter à ton modèle)
      if (!this.elem || !this.elem.firstname || !this.elem.lastname) {
        this.showCustomToast(
          this.translate.instant('ERROR.MISSING_FIELDS') || 'Veuillez renseigner les champs obligatoires.',
          'error'
        );
        return;
      }

      // Ici, tu peux appeler un service de persistance si nécessaire.
      // ex: this.userService.addProche(this.data.user._id, this.elem).subscribe(...)

      console.log('[ProchesModal] Proche validé :', this.elem);
      this.showCustomToast(
        this.translate.instant('SUCCESS.SAVED') || 'Enregistré avec succès.',
        'success'
      );
      this.dialogRef.close(this.elem); // retourne le proche validé à l’appelant
    } catch (err) {
      console.error('[ProchesModal] submitProche ERROR:', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), 'error');
    }
  }

  /**
   * Fermeture manuelle sans sauvegarde
   */
  closeModal() {
    try {
      this.dialogRef.close(); // Pas de payload => annulation
    } catch (err) {
      console.error('[ProchesModal] closeModal ERROR:', err);
    }
  }

  // ============================================================
  // ===================  HELPERS / NOTIFS  =====================
  // ============================================================

  /**
   * Affiche un toast (success/error) avec tentative de traduction,
   * puis fallback sur le message brut si clé inconnue.
   */
  private showCustomToast(keyOrMessage: string, type: 'success' | 'error' = 'success') {
    try {
      const translated = this.translate.instant(keyOrMessage);
      const message = translated && translated !== keyOrMessage ? translated : keyOrMessage;

      if (type === 'success') this.toastr.success(message);
      else this.toastr.error(message);
    } catch {
      if (type === 'success') this.toastr.success(keyOrMessage);
      else this.toastr.error(keyOrMessage);
    }
  }
}
