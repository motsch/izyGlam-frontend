import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { UserService } from '../../services/user.service';
import { SessionService } from '../../services/session.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-round-shop-card',
  templateUrl: './round-shop-card.component.html',
  styleUrls: ['./round-shop-card.component.scss'],
})
export class RoundShopCardComponent {
  // =======================
  // Inputs du composant
  // =======================
  @Input() me: any;                         // Utilisateur courant (avec favoriteShops)
  @Input() shop: any;                       // Boutique affichée
  @Input() promoVisible: boolean = false;   // Affichage du badge promo
  @Input() promoType: any;                  // Type de promo (au besoin)

  // =======================
  // State / UI helpers
  // =======================
  imgStorageUrl: string = environment.APIimgStorageUrl;
  skeleton = true;                          // Pour gérer un skeleton lors du chargement
  loadedShops: Record<string, boolean> = {}; // Suivi des images chargées

  // =======================
  // Ctor & DI
  // =======================
  constructor(
    private router: Router,
    private userService: UserService,
    public sessionService: SessionService,
    private translate: TranslateService,
    private toastr: ToastrService
  ) {}

  // ============================================================
  //                         FAVORIS
  // ============================================================

  /**
   * Ajoute/retire la boutique des favoris de l’utilisateur avec UI optimiste,
   * rollback en cas d’erreur et toast (succès/erreur).
   */
  toggleFavorite(): void {
    try {
      // 1) Vérifier la session
      if (!this.sessionService.isLoggedIn() || !this.me?._id) {
        console.warn('[RoundShopCard] toggleFavorite: utilisateur non connecté.');
        this.showCustomToast(
          this.translate.instant('ERROR.LOGIN_REQUIRED') || 'Veuillez vous connecter pour gérer vos favoris.',
          'error'
        );
        return;
      }

      // 2) Initialisation de la structure favoriteShops si absente
      if (!Array.isArray(this.me.favoriteShops)) {
        this.me.favoriteShops = [];
      }

      // 3) UI optimiste : inversion de l’état local
      const wasFavoriteBefore = !!this.shop?.isFavorite;
      this.shop.isFavorite = !wasFavoriteBefore;

      // Sauvegarde liste initiale pour rollback si besoin
      const previousFavoriteList = [...this.me.favoriteShops];

      // 4) Met à jour la liste côté client (optimiste)
      if (this.shop.isFavorite) {
        // Ajout si absent
        if (!this.me.favoriteShops.includes(this.shop._id)) {
          this.me.favoriteShops.push(this.shop._id);
        }
      } else {
        // Retrait si présent
        this.me.favoriteShops = this.me.favoriteShops.filter((id: string) => id !== this.shop._id);
      }

      // 5) Appel API — persiste l’état
      this.userService.updateUserFavorites(this.me._id, this.me.favoriteShops).subscribe({
        next: () => {
          // Succès : toast contextualisé
          const key = this.shop.isFavorite ? 'SUCCESS.FAVORITE_ADDED' : 'SUCCESS.FAVORITE_REMOVED';
          const fallback = this.shop.isFavorite
            ? 'Boutique ajoutée à vos favoris.'
            : 'Boutique retirée de vos favoris.';
          this.showCustomToast(this.translate.instant(key) || fallback, 'success');
          console.log(`[RoundShopCard] Favoris mis à jour pour shop=${this.shop?._id}, favorite=${this.shop?.isFavorite}`);
        },
        error: (err) => {
          // Erreur : rollback + toast
          console.error('[RoundShopCard] updateUserFavorites ERROR:', err);
          this.shop.isFavorite = wasFavoriteBefore;
          this.me.favoriteShops = previousFavoriteList;

          this.showCustomToast(
            err?.error?.message ||
              this.translate.instant('ERROR.GENERIC_ERROR') ||
              '✨ Oups… une erreur s’est glissée. Merci de réessayer ✨',
            'error'
          );
        }
      });
    } catch (err) {
      // Garde-fou global (ne devrait PAS arriver souvent)
      console.error('[RoundShopCard] toggleFavorite FATAL:', err);
      this.showCustomToast(
        this.translate.instant('ERROR.GENERIC_ERROR') ||
          '✨ Oups… une erreur s’est glissée. Merci de réessayer ✨',
        'error'
      );
    }
  }

  // ============================================================
  //                      NAVIGATION / CLICK
  // ============================================================

  /**
   * Redirige vers la page de la boutique.
   */
  toShopPage(id: string) {
    try {
      this.router.navigate(['shop/' + id]);
    } catch (err) {
      console.error('[RoundShopCard] toShopPage ERROR:', err);
      this.showCustomToast(
        this.translate.instant('ERROR.GENERIC_ERROR') || 'Navigation impossible.',
        'error'
      );
    }
  }

  // ============================================================
  //                 GESTION D’ÉTATS D’IMAGES
  // ============================================================

  /**
   * Callback: image chargée.
   */
  onImageLoad(shopId: string) {
    try {
      this.loadedShops[shopId] = true;
      this.skeleton = false;
      console.log('[RoundShopCard] Image loaded for shopId:', shopId);
    } catch (err) {
      console.warn('[RoundShopCard] onImageLoad WARN:', err);
    }
  }

  /**
   * Callback: erreur de chargement image.
   */
  onImageError(shopId: string) {
    try {
      this.loadedShops[shopId] = false; // on garde la trace si tu veux afficher un fallback
      console.warn('[RoundShopCard] Image error for shopId:', shopId);
    } catch (err) {
      console.warn('[RoundShopCard] onImageError WARN:', err);
    }
  }

  /**
   * Hook custom appelé au premier rendu correct de la carte.
   */
  onShopLoaded(shopId: string) {
    try {
      this.loadedShops[shopId] = true;
    } catch (err) {
      console.warn('[RoundShopCard] onShopLoaded WARN:', err);
    }
  }

  // ============================================================
  //                     HELPERS D’AFFICHAGE
  // ============================================================

  /**
   * Coupe une phrase (trad) à `limit` caractères (avec ellipsis).
   */
  getShortTrad(trad: string, limit: number = 20): string {
    try {
      if (!trad) return '';
      return trad.length > limit ? trad.substring(0, limit) + '...' : trad;
    } catch {
      return '';
    }
  }

  // ============================================================
  //                           MODALE
  // ============================================================

  modalOpen = false;

  openModal() {
    try {
      this.modalOpen = true;
    } catch (err) {
      console.error('[RoundShopCard] openModal ERROR:', err);
    }
  }

  closeModal() {
    try {
      this.modalOpen = false;
    } catch (err) {
      console.error('[RoundShopCard] closeModal ERROR:', err);
    }
  }

  // ============================================================
  //                             TOAST
  // ============================================================

  /**
   * Toast centralisé avec fallback si key i18n manquante.
   */
  private showCustomToast(messageOrKey: string, type: 'success' | 'error' = 'success') {
    try {
      const translated = this.translate.instant(messageOrKey);
      const msg = translated && translated !== messageOrKey ? translated : messageOrKey;

      if (type === 'success') this.toastr.success(msg);
      else this.toastr.error(msg);
    } catch (e) {
      console.warn('[RoundShopCard] showCustomToast WARN (fallback):', e);
      if (type === 'success') this.toastr.success(messageOrKey);
      else this.toastr.error(messageOrKey);
    }
  }
}
