import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from 'src/app/core/services/admin.service';
import { ProductService } from 'src/app/core/services/product.service';
import { SessionService } from 'src/app/core/services/session.service';
import { ShopService } from 'src/app/core/services/shop.service';
import { environment } from 'src/environments/environment';

// ✅ AjoutsizyGlam : toasts + i18n
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { DOCUMENT } from '@angular/common';
import { SeoService } from 'src/app/core/services/seo.service';
import { DrawerService } from 'src/app/core/services/drawer.service';
import { BookingCategoryService } from 'src/app/core/services/booking-category.service';
import { forkJoin, of } from 'rxjs';
import { switchMap, tap, catchError } from 'rxjs/operators';
import { ReviewsModalService } from 'src/app/core/services/reviews-modal.service';

@Component({
    selector: 'app-shop',
    templateUrl: './shop.component.html',
    styleUrls: ['./shop.component.scss'],
})
export class ShopComponent {
    // --------------------------
    // 🔧 Paramètres / données
    // --------------------------
    adminSettings: any = {};
    imgStorageUrl: string = environment.imgStorageUrl;
    APIimgStorageUrl: string = environment.APIimgStorageUrl.replace(/\/$/, '');
    activeTab = 'home';

    categories: any[] = [];
    shareModalOpen = false;
    qrOpen = false;
    copied = false;

    shareUrl = '';
    shareTitle = '';
    shareText = '';


    // Infos du shop (détails, note, images, etc.)
    shopInfo: any = {};

    // Références pour scroll horizontal (UI)
    @ViewChild('scrollContainerCategory') private scrollContainerCategory: ElementRef | undefined;
    @ViewChild('scrollContainerAround') private scrollContainerAround: ElementRef | undefined;
    @ViewChild('scrollContainerPromo') private scrollContainerPromo: ElementRef | undefined;
    @ViewChild('scrollContainerTop10') private scrollContainerTop10: ElementRef | undefined;

    // Liste des services/produits du shop
    shopItems: any[] = [];


    // ✅ listes prêtes pour le template
    categoriesUnique: any[] = [];
    itemsByCategory: Record<string, any[]> = {};
    // Lightbox (galerie)
    isLightboxOpen = false;
    selectedImage: string = '';
    currentIndex: number = 0;
    public instagramUrl = '';
    public tiktokUrl = '';
    // Description étendue
    isExpanded = false;
    loading = false;
    izyPhone: string | null = null;
    modalOpen = false;

    constructor(
        private router: Router,
        public sessionService: SessionService,
        public dialog: MatDialog,
        private productService: ProductService,
        private activatedRoute: ActivatedRoute,
        private shopService: ShopService,
        private adminService: AdminService,
        @Inject(DOCUMENT) private document: Document,
        private seoService: SeoService,
        private drawerService: DrawerService,

        // ✅ InjectionsizyGlam
        private toastr: ToastrService,
        private translate: TranslateService,
        private bookingCategoryService: BookingCategoryService,
        private reviewsModal: ReviewsModalService
    ) { }

    // ----------------------------------------------------
    // ⏱️ ngOnInit : charge settings, produits et shop
    // ----------------------------------------------------

    ngOnInit(): void {
        this.loading = true;
        this.buildShareLinks();
        this.seoService.updateMeta('shop');

        // Admin settings (peut rester indépendant)
        this.adminService.getAdminSettings().subscribe({
            next: (data: any) => {
                this.adminSettings = data;
                this.adminSettings.serviceFee = Number(this.adminSettings.serviceFee).toFixed(2);
            },
            error: () => this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR')),
        });

        const shopHandle = this.activatedRoute.snapshot.params['handle'];

        this.shopService.getShopByHandle(shopHandle).pipe(
            tap((shop: any) => {
                this.izyPhone = shop.izyPhone;
                localStorage.setItem('shopSelected', shop._id);
            }),
            switchMap((shop: any) => {
                const shopId = shop._id;

                // ⚡ 3 requêtes en parallèle
                return forkJoin({
                    products: this.productService.getProductsByShop(shopId),
                    shopInfo: this.shopService.getById(shopId),
                    categories: this.bookingCategoryService.getBookingCategoryByShopId(shopId),
                });
            }),
            tap(({ products, shopInfo, categories }) => {
                // 1) produits
                this.shopItems = products || [];

                // 2) shop info + note
                this.shopInfo = shopInfo;
                const reviews = shopInfo?.reviews || [];
                const count = reviews.length;

                if (count > 0) {
                    const total = reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0);
                    this.shopInfo.note = total / count;
                    this.shopInfo.noteCount = count;
                } else {
                    this.shopInfo.note = 5;
                    this.shopInfo.noteCount = 0;
                }

                // 3) catégories
                this.categories = categories || [];

                // ✅ maintenant seulement : build
                this.buildViewModel();
            }),
            catchError((err) => {
                console.error(err);
                this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
                return of(null);
            })
        ).subscribe();

    }

    // ======================= Modale =======================
    // ouvre la modale globale
    openModal() {
        this.reviewsModal.open(this.shopInfo);
    }

    // (optionnel) fermer depuis la carte si besoin
    closeModal() {
        this.reviewsModal.close();
    }

    // ----------------------------------------------------
    // 📝 Affichage description : réduit / étendu
    // ----------------------------------------------------
    toggleDescription() {
        this.isExpanded = !this.isExpanded;
    }

    getItemsByCategory(categoryId: string) {
        return this.shopItems.filter(item => item.categoryId === categoryId);
    }

    // ----------------------------------------------------
    // 🖼️ Lightbox — ouverture
    // ----------------------------------------------------
    openLightbox(image: string) {
        this.isLightboxOpen = true;
        this.selectedImage = image;
        // Détermine l’index actuel dans la galerie
        this.currentIndex = this.shopInfo.galleryImages.indexOf(image);
    }

    // ----------------------------------------------------
    // 🖼️ Lightbox — fermeture
    // ----------------------------------------------------
    closeLightbox() {
        this.isLightboxOpen = false;
    }

    goTo(name: string) {
        this.drawerService.closeDrawer();
        this.router.navigate([name]);
    }

    private buildShareLinks(): void {
        const encoded = encodeURIComponent(this.shareUrl);

        // Instagram : pas de share URL officielle. On ouvre Instagram (web/app), l’utilisateur colle le lien.
        // Sur mobile, instagram:// peut marcher mais pas garanti; on reste safe: web.
        this.instagramUrl = `https://www.instagram.com/`;

        // TikTok : pas de share URL simple et stable non plus. On ouvre TikTok.
        this.tiktokUrl = `https://www.tiktok.com/`;

        // Si tu veux tenter un truc "un peu plus direct" pour TikTok (pas garanti) :
        // this.tiktokUrl = `https://www.tiktok.com/upload?lang=fr`; // dépend des versions
    }

    async shareToInstagram(): Promise<void> {
        await this.copyShareUrl(true);
        window.open(this.instagramUrl, '_blank', 'noopener');
    }

    async shareToTiktok(): Promise<void> {
        await this.copyShareUrl(true);
        window.open(this.tiktokUrl, '_blank', 'noopener');
    }

    openSocialLink(url: string): void {
        if (!url) {
            return;
        }

        // Sécurité : si l'utilisateur n'a pas mis http(s)
        const finalUrl = url.startsWith('http')
            ? url
            : `https://${url}`;

        window.open(finalUrl, '_blank', 'noopener,noreferrer');
    }


    // ----------------------------------------------------
    // 🖼️ Lightbox — image précédente
    // ----------------------------------------------------
    prevImage() {
        const last = this.shopInfo.galleryImages.length - 1;
        this.currentIndex = (this.currentIndex === 0) ? last : this.currentIndex - 1;
        this.selectedImage = this.shopInfo.galleryImages[this.currentIndex];
    }

    // ----------------------------------------------------
    // 🖼️ Lightbox — image suivante
    // ----------------------------------------------------
    nextImage() {
        const last = this.shopInfo.galleryImages.length - 1;
        this.currentIndex = (this.currentIndex === last) ? 0 : this.currentIndex + 1;
        this.selectedImage = this.shopInfo.galleryImages[this.currentIndex];
    }

    // ----------------------------------------------------
    // ✨ Toast d’erreur styliséizyGlam
    // ----------------------------------------------------
    private showCustomToast(message: string) {
        // Exemple conseillé (fr.json) :
        // "ERROR": { "GENERIC_ERROR": "✨ Oups… une erreur s’est glissée. Merci de réessayer ✨" }
        this.toastr.error(message);
    }

    private buildSharePayload() {
        // ✅ Mets ici TON url finale (slug / id) selon ton routing réel
        // Exemple: https://izyglam.com/shop/123
        const origin = this.document.location.origin;

        // si tu as un slug : `/pro/${this.shopInfo.slug}`
        // sinon : `/shop/${this.shopInfo._id}`
        const path = `/shop/${(this as any).shopInfo?.handle ?? ''}`;

        this.shareUrl = `${origin}${path}`;
        this.shareTitle = (this as any).shopInfo?.name ?? 'izyGlam';
        this.shareText = `Découvre ${this.shareTitle} sur izyGlam ✨`;
    }

    async onShareClick() {
        this.buildSharePayload();

        // ✅ Web Share API si dispo (mobile surtout)
        const nav: any = navigator as any;
        if (nav?.share) {
            try {
                await nav.share({
                    title: this.shareTitle,
                    text: this.shareText,
                    url: this.shareUrl
                });
                return;
            } catch {
                // si l'utilisateur annule ou erreur -> fallback modal
            }
        }

        // ✅ Fallback desktop
        this.openShareModal();
    }

    openShareModal() {
        this.shareModalOpen = true;
        this.qrOpen = false;
        this.copied = false;
    }

    closeShareModal() {
        this.shareModalOpen = false;
        this.qrOpen = false;
    }

    toggleQr() {
        this.qrOpen = !this.qrOpen;
    }

    async copyShareUrl(silent = false): Promise<void> {
        try {
            await navigator.clipboard.writeText(this.shareUrl);

            if (!silent) {
                this.copied = true;
                setTimeout(() => (this.copied = false), 1500);
            }
        } catch (e) {
            // fallback old-school
            const input = document.createElement('input');
            input.value = this.shareUrl;
            document.body.appendChild(input);
            input.select();
            document.execCommand('copy');
            document.body.removeChild(input);

            if (!silent) {
                this.copied = true;
                setTimeout(() => (this.copied = false), 1500);
            }
        }
    }


    get mailToUrl() {
        const subject = encodeURIComponent(this.shareTitle);
        const body = encodeURIComponent(`${this.shareText}\n\n${this.shareUrl}`);
        return `mailto:?subject=${subject}&body=${body}`;
    }

    get whatsAppUrl() {
        const text = encodeURIComponent(`${this.shareText} ${this.shareUrl}`);
        return `https://wa.me/?text=${text}`;
    }


    // Appelle ça juste après avoir chargé categories + items
    private buildViewModel(): void {
        // 1) Catégories uniques par _id
        const map = new Map<string, any>();
        for (const c of this.categories || []) {
            if (c?._id && !map.has(c._id)) map.set(c._id, c);
        }
        this.categoriesUnique = Array.from(map.values());

        // 2) Groupage des items par categoryId
        const grouped: Record<string, any[]> = {};
        for (const it of this.shopItems || []) {
            const catId = (it as any).categoryId || (it as any).category?._id; // adapte selon ton modèle
            if (!catId) continue;
            if (!grouped[catId]) grouped[catId] = [];
            grouped[catId].push(it);
        }
        this.itemsByCategory = grouped;
        this.loading = false;
    }

    // ✅ TrackBy pour stabiliser l’affichage
    trackByCategoryId = (_: number, cat: any) => cat._id;
    trackByItemId = (_: number, item: any) => item._id;
}
