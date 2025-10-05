import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ShopService } from '../../services/shop.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-review-modal',
  templateUrl: './review-modal.component.html',
  styleUrls: ['./review-modal.component.scss']
})
export class ReviewModalComponent implements OnInit, OnDestroy {
  // === Inputs/Outputs ===
  @Input() booking: any;                 // Booking contenant shopId, clientId, etc.
  @Output() closeModal = new EventEmitter<void>(); // Fermeture modale

  // === Form state ===
  rating: number = 5;                    // Note par défaut
  reviewText: string = '';               // Commentaire libre
  message: string = '';                  // Champ optionnel (si tu l'utilises dans le template)
  photos: string[] = [];                 // Base64 pour preview & envoi API
  isLoadingShop = false;                 // Chargement du shop (pour affichage éventuel)
  isSubmitting = false;                  // Envoi en cours

  // === Shop context ===
  shop: any = null;

  constructor(
    private shopService: ShopService,
    private translate: TranslateService,
    private toastr: ToastrService
  ) {}

  // ============================================================
  //                          LIFECYCLE
  // ============================================================

  ngOnInit() {
    // Bloque le scroll de la page sous-jacente pendant l’ouverture de la modale
    try {
      document.body.style.overflow = 'hidden';
    } catch (err) {
      console.warn('[ReviewModal] Impossible de bloquer le scroll body:', err);
    }

    // Charge les infos du shop pour contextualiser l’avis
    this.fetchShop();
  }

  ngOnDestroy() {
    // Restaure le scroll de la page
    try {
      document.body.style.overflow = 'auto';
    } catch (err) {
      console.warn('[ReviewModal] Impossible de rétablir le scroll body:', err);
    }
  }

  // ============================================================
  //                          DATA
  // ============================================================

  /**
   * Récupère les informations de la boutique liée au booking (sécurisé).
   */
  private fetchShop() {
    if (!this.booking?.shopId) {
      console.warn('[ReviewModal] booking.shopId manquant:', this.booking);
      this.showCustomToast(
        this.translate.instant('ERROR.GENERIC_ERROR') || '✨ Oups… une erreur s’est glissée. Merci de réessayer ✨',
        'error'
      );
      return;
    }

    this.isLoadingShop = true;
    this.shopService.getById(this.booking.shopId).subscribe({
      next: (result: any) => {
        this.shop = result;
        this.isLoadingShop = false;
        console.log('[ReviewModal] SHOP FOR REVIEW:', result);
      },
      error: (error: any) => {
        this.isLoadingShop = false;
        console.error('[ReviewModal] getById ERROR:', error);
        this.showCustomToast(
          error?.error?.message ||
            this.translate.instant('ERROR.GENERIC_ERROR') ||
            'Impossible de charger la boutique.',
          'error'
        );
      }
    });
  }

  // ============================================================
  //                        FORM HANDLERS
  // ============================================================

  /**
   * Gestion du changement de note (input range).
   */
  onRatingChange(event: Event) {
    try {
      const input = event.target as HTMLInputElement;
      this.rating = +input.value;
    } catch (err) {
      console.error('[ReviewModal] onRatingChange ERROR:', err);
    }
  }

  /**
   * Déclenche l’ouverture du sélecteur de fichier pour les photos.
   */
  triggerFileInput() {
    try {
      const input = document.querySelector<HTMLInputElement>('#fileInput');
      input?.click();
    } catch (err) {
      console.error('[ReviewModal] triggerFileInput ERROR:', err);
    }
  }

  /**
   * Lecture du fichier sélectionné en base64 pour l’aperçu et l’envoi.
   */
  onPhotoSelected(event: Event) {
    try {
      const input = event.target as HTMLInputElement;
      if (input.files && input.files[0]) {
        const file = input.files[0];

        // Optionnel : contrôle basique du type/taille
        if (!file.type.startsWith('image/')) {
          this.showCustomToast(
            this.translate.instant('ERROR.INVALID_IMAGE') || 'Image invalide.',
            'error'
          );
          return;
        }

        const reader = new FileReader();
        reader.onload = () => {
          this.photos.push(reader.result as string);
        };
        reader.onerror = (e) => {
          console.error('[ReviewModal] FileReader ERROR:', e);
          this.showCustomToast(
            this.translate.instant('ERROR.GENERIC_ERROR') || 'Erreur lors du chargement de l’image.',
            'error'
          );
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('[ReviewModal] onPhotoSelected ERROR:', err);
      this.showCustomToast(
        this.translate.instant('ERROR.GENERIC_ERROR') || 'Erreur lors de l’ajout de la photo.',
        'error'
      );
    }
  }

  /**
   * Suppression d’une photo par index.
   */
  removePhoto(index: number) {
    try {
      this.photos.splice(index, 1);
    } catch (err) {
      console.error('[ReviewModal] removePhoto ERROR:', err);
    }
  }

  /**
   * Soumission de l’avis.
   * - Validation minimale
   * - Envoi via ShopService.addReview(shopId, review)
   */
  submitReview() {
    try {
      // Validation minimale
      if (!this.booking?.shopId) {
        this.showCustomToast(
          this.translate.instant('ERROR.GENERIC_ERROR') || 'Boutique introuvable.',
          'error'
        );
        return;
      }
      if (!this.rating || this.rating < 1 || this.rating > 5) {
        this.showCustomToast(
          this.translate.instant('ERROR.INVALID_RATING') || 'Note invalide (1 à 5).',
          'error'
        );
        return;
      }

      // Construction du payload d’avis
      const reviewPayload = {
        user: this.booking?.clientId || this.booking?.user || undefined, // selon ton modèle
        rating: this.rating,
        comment: (this.reviewText || '').trim(),
        message: (this.message || '').trim(),
        photos: this.photos, // base64 ou URLs, selon ton API
        bookingId: this.booking?._id,     // utile côté backend pour éviter doublons
        createdAt: new Date().toISOString()
      };

      this.isSubmitting = true;

      this.shopService.addReview(this.booking.shopId, reviewPayload).subscribe({
        next: (res: any) => {
          console.log('[ReviewModal] Review saved:', res);
          this.isSubmitting = false;
          this.showCustomToast(
            this.translate.instant('SUCCESS.REVIEW_ADDED') || 'Votre avis a été publié. Merci !',
            'success'
          );
          this.close(); // fermeture modale
        },
        error: (error: any) => {
          console.error('[ReviewModal] addReview ERROR:', error);
          this.isSubmitting = false;
          this.showCustomToast(
            error?.error?.message ||
              this.translate.instant('ERROR.GENERIC_ERROR') ||
              'Impossible d’enregistrer votre avis.',
            'error'
          );
        }
      });
    } catch (err) {
      console.error('[ReviewModal] submitReview ERROR:', err);
      this.isSubmitting = false;
      this.showCustomToast(
        this.translate.instant('ERROR.GENERIC_ERROR') || 'Erreur inattendue lors de l’envoi.',
        'error'
      );
    }
  }

  /**
   * Fermeture de la modale (émission à parent).
   */
  close() {
    try {
      this.closeModal.emit();
    } catch (err) {
      console.error('[ReviewModal] close ERROR:', err);
    }
  }

  // ============================================================
  //                          TOASTS
  // ============================================================

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
      console.warn('[ReviewModal] showCustomToast WARN (fallback):', e);
      if (type === 'success') this.toastr.success(messageOrKey);
      else this.toastr.error(messageOrKey);
    }
  }
}
