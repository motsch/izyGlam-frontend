import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { UserService } from '../../services/user.service';
import { SessionService } from '../../services/session.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { ReviewsModalService } from '../../services/reviews-modal.service';

@Component({
  selector: 'app-round-shop-card',
  templateUrl: './round-shop-card.component.html',
  styleUrls: ['./round-shop-card.component.scss'],
})
export class RoundShopCardComponent {
  // ======================= Inputs =======================
  @Input() me: any;
  @Input() shop: any;
  @Input() promoVisible: boolean = false;
  @Input() promoType: any;

  // ======================= State =======================
  imgStorageUrl: string = environment.APIimgStorageUrl;
  skeleton = true;
  loadedShops: Record<string, boolean> = {};
  modalOpen = false;

  constructor(
    private router: Router,
    private userService: UserService,
    public sessionService: SessionService,
    private translate: TranslateService,
    private toastr: ToastrService,
    private reviewsModal: ReviewsModalService
  ) { }

  // ======================= Favoris =======================
  toggleFavorite(): void {
    try {
      if (!this.sessionService.isLoggedIn() || !this.me?._id) {
        this.showCustomToast(
          this.translate.instant('ERROR.LOGIN_REQUIRED') ||
          'Veuillez vous connecter pour gérer vos favoris.',
          'error'
        );
        return;
      }

      if (!Array.isArray(this.me.favoriteShops)) this.me.favoriteShops = [];

      const wasFavoriteBefore = !!this.shop?.isFavorite;
      this.shop.isFavorite = !wasFavoriteBefore;

      const previousFavoriteList = [...this.me.favoriteShops];

      if (this.shop.isFavorite) {
        if (!this.me.favoriteShops.includes(this.shop._id)) {
          this.me.favoriteShops.push(this.shop._id);
        }
      } else {
        this.me.favoriteShops = this.me.favoriteShops.filter(
          (id: string) => id !== this.shop._id
        );
      }

      this.userService.updateUserFavorites(this.me._id, this.me.favoriteShops).subscribe({
        next: () => {
          const key = this.shop.isFavorite ? 'SUCCESS.FAVORITE_ADDED' : 'SUCCESS.FAVORITE_REMOVED';
          const fallback = this.shop.isFavorite
            ? 'Boutique ajoutée à vos favoris.'
            : 'Boutique retirée de vos favoris.';
          this.showCustomToast(this.translate.instant(key) || fallback, 'success');
        },
        error: (err) => {
          this.shop.isFavorite = wasFavoriteBefore;
          this.me.favoriteShops = previousFavoriteList;
          this.showCustomToast(
            err?.error?.message ||
            this.translate.instant('ERROR.GENERIC_ERROR') ||
            '✨ Oups… une erreur s’est glissée. Merci de réessayer ✨',
            'error'
          );
        },
      });
    } catch (err) {
      this.showCustomToast(
        this.translate.instant('ERROR.GENERIC_ERROR') ||
        '✨ Oups… une erreur s’est glissée. Merci de réessayer ✨',
        'error'
      );
    }
  }

  // ======================= Navigation =======================
  toShopPage(handle: string) {
    try {
      this.router.navigate(['shop/' + handle]);
    } catch {
      this.showCustomToast(
        this.translate.instant('ERROR.GENERIC_ERROR') || 'Navigation impossible.',
        'error'
      );
    }
  }

  // ======================= Images =======================
  onImageLoad(shopId: string) {
    console.log("ON IMAGE LOAD");
    this.loadedShops[shopId] = true;
    this.skeleton = false;
  }

  onImageError(shopId: string) {
    console.log("ON ERROR");
    this.loadedShops[shopId] = false;
  }

  onShopLoaded(shopId: string) {
    this.loadedShops[shopId] = true;
  }

  // ======================= Modale =======================
  // ouvre la modale globale
  openModal() {
    this.reviewsModal.open(this.shop);
  }

  // (optionnel) fermer depuis la carte si besoin
  closeModal() {
    this.reviewsModal.close();
  }

  // ======================= Toast =======================
  private showCustomToast(messageOrKey: string, type: 'success' | 'error' = 'success') {
    const translated = this.translate.instant(messageOrKey);
    const msg = translated && translated !== messageOrKey ? translated : messageOrKey;

    if (type === 'success') this.toastr.success(msg);
    else this.toastr.error(msg);
  }

  get finishedBookingsTotal(): number {
    const total = this.shop?.stats?.bookings?.finished?.total;
    return Number.isFinite(+total) ? +total : 0;
  }

  get levelUi(): {
    emoji: string; label: string; class: string; trads: string
  } | null {
    if (!this.shop?.isPremium) return null; // ✅ badge jamais affiché si pas premium
    const total = this.finishedBookingsTotal;
    if (total < 30) return { emoji: "🌱", label: "Créatrice", class: "lvl-starter", trads: "UILEVEL.STARTER" };
    if (total < 120) return { emoji: "🔥", label: "Confirmée", class: "lvl-active", trads: "UILEVEL.ACTIVE" };
    if (total < 250) return { emoji: "💎", label: "Ambassadrice izyGlam", class: "lvl-ambassador", trads: "UILEVEL.AMBASSADOR" };
    return { emoji: "👑", label: "Icône locale", class: "lvl-icon", trads: "UILEVEL.ICONE" };
  }
}
