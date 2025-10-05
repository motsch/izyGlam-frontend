import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { RdvModalComponent } from 'src/app/core/component/rdv-modal/rdv-modal.component';
import { AdminService } from 'src/app/core/services/admin.service';
import { ProductService } from 'src/app/core/services/product.service';
import { ScheduleService } from 'src/app/core/services/schedule.service';
import { SessionService } from 'src/app/core/services/session.service';
import { ShopService } from 'src/app/core/services/shop.service';
import { environment } from 'src/environments/environment';

// ✅ AjoutsizyGlam : toasts + i18n
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

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

    // Infos du shop (détails, note, images, etc.)
    shopInfo: any = {};

    // Références pour scroll horizontal (UI)
    @ViewChild('scrollContainerCategory') private scrollContainerCategory: ElementRef | undefined;
    @ViewChild('scrollContainerAround') private scrollContainerAround: ElementRef | undefined;
    @ViewChild('scrollContainerPromo') private scrollContainerPromo: ElementRef | undefined;
    @ViewChild('scrollContainerTop10') private scrollContainerTop10: ElementRef | undefined;

    // Liste des services/produits du shop
    shopItems: any[] = [];

    // Lightbox (galerie)
    isLightboxOpen = false;
    selectedImage: string = '';
    currentIndex: number = 0;

    // Description étendue
    isExpanded = false;

    constructor(
        private router: Router,
        public sessionService: SessionService,
        public dialog: MatDialog,
        private productService: ProductService,
        private activatedRoute: ActivatedRoute,
        private shopService: ShopService,
        private adminService: AdminService,

        // ✅ InjectionsizyGlam
        private toastr: ToastrService,
        private translate: TranslateService
    ) { }

    // ----------------------------------------------------
    // ⏱️ ngOnInit : charge settings, produits et shop
    // ----------------------------------------------------
    ngOnInit(): void {
        // 1) Paramètres d’admin (commission, frais, etc.)
        this.adminService.getAdminSettings().subscribe({
            next: (data: any) => {
                this.adminSettings = data;
                // Affichage propre à 2 décimales
                this.adminSettings.serviceFee = this.adminSettings.serviceFee.toFixed(2);
                console.log(this.adminSettings);
            },
            error: (err: any) => {
                console.error('Erreur lors du chargement des paramètres admin :', err);
                this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
            },
        });

        // 2) Récupère l'id du shop depuis l'URL
        const shopId = this.activatedRoute.snapshot.params['id'];
        console.log('shop id : ' + shopId);
        localStorage.setItem('shopSelected', shopId);

        // 3) Vide la liste locale avant rechargement
        this.shopItems = [];

        // 4) Charge les produits du shop
        this.productService.getProductsByShop(shopId).subscribe({
            next: (data: any) => {
                console.log('Produits shop :', data);
                this.shopItems = data;
            },
            error: (err: any) => {
                console.error('Erreur lors du chargement des produits du shop :', err);
                this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
            }
        });

        // 5) Charge les infos du shop (note, reviews, galerie…)
        this.shopService.getById(shopId).subscribe({
            next: (data: any) => {
                console.log('Shop data: ' + JSON.stringify(data));
                this.shopInfo = data;

                // Initialisation / recalcul de la note moyenne
                this.shopInfo.note = 0;
                this.shopInfo.noteCount = data.reviews.length;

                for (const elem of data.reviews) {
                    this.shopInfo.note = this.shopInfo.note + elem.rating;
                }
                this.shopInfo.note = this.shopInfo.note / data.reviews.length;

                // Fallbacks si pas de note/décompte
                if (!this.shopInfo.note || isNaN(this.shopInfo.note)) {
                    this.shopInfo.note = 5;
                }
                if (!this.shopInfo.noteCount) {
                    this.shopInfo.noteCount = 0;
                }
            },
            error: (err: any) => {
                console.error('Erreur lors du chargement des informations du shop :', err);
                this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
            }
        });
    }

    // ----------------------------------------------------
    // 📝 Affichage description : réduit / étendu
    // ----------------------------------------------------
    toggleDescription() {
        this.isExpanded = !this.isExpanded;
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
}
