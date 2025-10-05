import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../../services/user.service';
import { ShopService } from '../../services/shop.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-rating-modal',
  templateUrl: './rating-modal.component.html',
  styleUrl: './rating-modal.component.scss',
})
export class RatingModalComponent {
  // ====== Inputs / State ======
  shopId: string | null = null;
  rating: number = 5;
  comment: string = '';
  stars = [5, 4, 3, 2, 1];

  isSubmitting = false; // évite le double-submit

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<RatingModalComponent>,
    private userService: UserService,
    private shopService: ShopService,
    private translate: TranslateService,
    private toastr: ToastrService
  ) {
    try {
      // On s’assure que l’ID de shop est bien passé via la data du dialog
      console.log('[RatingModal] ctor data:', data);
      this.shopId = data?.shopId || null;

      if (!this.shopId) {
        console.warn('[RatingModal] shopId manquant à l’ouverture du modal.');
        this.showCustomToast(
          this.translate.instant('ERROR.GENERIC_ERROR') || 'Une erreur est survenue.',
          'error'
        );
      }
    } catch (err) {
      console.error('[RatingModal] ctor ERROR:', err);
      this.showCustomToast(
        this.translate.instant('ERROR.GENERIC_ERROR') || 'Une erreur est survenue.',
        'error'
      );
    }
  }

  /**
   * Ferme la modale (sans action)
   */
  closeDialog() {
    try {
      this.dialogRef.close();
    } catch (err) {
      console.error('[RatingModal] closeDialog ERROR:', err);
    }
  }

  /**
   * Envoie l’avis :
   * 1) Récupère l’utilisateur courant
   * 2) Construit l’objet review
   * 3) Appelle l’API d’ajout d’avis pour la boutique
   * 4) Toaster succès/erreur + close dialog en succès
   */
  submitReview() {
    // Anti double-clic
    if (this.isSubmitting) return;

    try {
      // Validation basique côté front (tu peux en ajouter plus si besoin)
      if (!this.shopId) {
        console.error('[RatingModal] submitReview: shopId nul/indéfini.');
        this.showCustomToast(
          this.translate.instant('ERROR.GENERIC_ERROR') || 'Boutique introuvable.',
          'error'
        );
        return;
      }

      if (!this.rating || this.rating < 1 || this.rating > 5) {
        console.warn('[RatingModal] submitReview: rating invalide:', this.rating);
        this.showCustomToast(
          this.translate.instant('REVIEWS.INVALID_RATING') || 'Note invalide.',
          'error'
        );
        return;
      }

      this.isSubmitting = true;
      console.log('[RatingModal] submitReview started…');

      // 1) Récupère l'utilisateur courant
      this.userService.getMe().subscribe({
        next: (me: any) => {
          try {
            console.log('[RatingModal] getMe OK:', me);

            const review = {
              user: me?._id,
              rating: this.rating,
              comment: (this.comment || '').trim(),
            };

            // 2) Appel API pour créer l’avis
            this.shopService.addReview(this.shopId!, review).subscribe({
              next: (res: any) => {
                try {
                  console.log('[RatingModal] addReview OK:', res);

                  // Succès : on notifie et on ferme en renvoyant la review
                  this.showCustomToast(
                    this.translate.instant('SUCCESS.REVIEW_ADDED') || 'Votre avis a été publié 🎉',
                    'success'
                  );
                  this.dialogRef.close(review);
                } catch (innerErr) {
                  console.error('[RatingModal] addReview next ERROR:', innerErr);
                  this.showCustomToast(
                    this.translate.instant('ERROR.GENERIC_ERROR') || 'Erreur lors de la publication de l’avis.',
                    'error'
                  );
                } finally {
                  this.isSubmitting = false;
                }
              },
              error: (err: any) => {
                console.error('[RatingModal] addReview ERROR:', err);
                this.showCustomToast(
                  err?.error?.message ||
                    this.translate.instant('ERROR.GENERIC_ERROR') ||
                    'Impossible de publier votre avis.',
                  'error'
                );
                this.isSubmitting = false;
              },
            });
          } catch (innerErr) {
            console.error('[RatingModal] getMe next ERROR:', innerErr);
            this.showCustomToast(
              this.translate.instant('ERROR.GENERIC_ERROR') || 'Une erreur est survenue.',
              'error'
            );
            this.isSubmitting = false;
          }
        },
        error: (err: any) => {
          console.error('[RatingModal] getMe ERROR:', err);
          this.showCustomToast(
            this.translate.instant('ERROR.GENERIC_ERROR') || 'Impossible de récupérer votre profil.',
            'error'
          );
          this.isSubmitting = false;
        },
      });
    } catch (err) {
      console.error('[RatingModal] submitReview CATCH ERROR:', err);
      this.showCustomToast(
        this.translate.instant('ERROR.GENERIC_ERROR') || 'Une erreur est survenue.',
        'error'
      );
      this.isSubmitting = false;
    }
  }

  // ============================================================
  // ===================   HELPERS / TOASTS   ===================
  // ============================================================

  /**
   * Toast centralisé (succès/erreur) avec fallback i18n.
   */
  private showCustomToast(messageOrKey: string, type: 'success' | 'error' = 'success') {
    try {
      const translated = this.translate.instant(messageOrKey);
      const msg = translated && translated !== messageOrKey ? translated : messageOrKey;
      if (type === 'success') this.toastr.success(msg);
      else this.toastr.error(msg);
    } catch (e) {
      console.warn('[RatingModal] showCustomToast WARN (fallback):', e);
      if (type === 'success') this.toastr.success(messageOrKey);
      else this.toastr.error(messageOrKey);
    }
  }
}
