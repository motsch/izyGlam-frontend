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

@Component({
    selector: 'app-shop',
    templateUrl: './shop.component.html',
    styleUrls: ['./shop.component.scss'],

})
export class ShopComponent {
    adminSettings: any = {};
    imgStorageUrl: string = environment.imgStorageUrl;
    APIimgStorageUrl: string = environment.APIimgStorageUrl.replace(/\/$/, '');
    activeTab = 'home';
    shopInfo: any = {};
    @ViewChild('scrollContainerCategory')
    private scrollContainerCategory: ElementRef | undefined;
    @ViewChild('scrollContainerAround')
    private scrollContainerAround: ElementRef | undefined;
    @ViewChild('scrollContainerPromo') private scrollContainerPromo:
        | ElementRef
        | undefined;
    @ViewChild('scrollContainerTop10') private scrollContainerTop10:
        | ElementRef
        | undefined;
    shopItems = [];
    isLightboxOpen = false;
    selectedImage: string = '';
    currentIndex: number = 0;
    isExpanded = false;

    constructor(
        private router: Router,
        public sessionService: SessionService,
        public dialog: MatDialog,
        private productService: ProductService,
        private activatedRoute: ActivatedRoute,
        private shopService: ShopService,
        private adminService: AdminService

    ) { }

    ngOnInit(): void {
        this.adminService.getAdminSettings().subscribe({
            next: (data: any) => {
                this.adminSettings = data;
                this.adminSettings.serviceFee = this.adminSettings.serviceFee.toFixed(2); // Ensure two decimal places
                console.log(this.adminSettings);
            },
            error: (error: any) => {
                console.log(error);
            },
        });
        //récupérer l'id du shop sur la route
        let shopId = this.activatedRoute.snapshot.params['id'];
        console.log("shop id : " + shopId);
        localStorage.setItem("shopSelected", shopId);
        this.shopItems = [];
        this.productService.getProductsByShop(shopId).subscribe((data: any) => {
            console.log(data);
            this.shopItems = data;
        });
        this.shopService.getById(shopId).subscribe((data: any) => {
            console.log("here: " + JSON.stringify(data));
            this.shopInfo = data;
            this.shopInfo.note = 0;
            this.shopInfo.noteCount = data.reviews.length
            for (let elem of data.reviews) {
                this.shopInfo.note = this.shopInfo.note + elem.rating
            }
            this.shopInfo.note = this.shopInfo.note / data.reviews.length


            if (!this.shopInfo.note || isNaN(this.shopInfo.note)) {
                this.shopInfo.note = 5;
            }
            if (!this.shopInfo.noteCount) {
                this.shopInfo.noteCount = 0;
            }
        })
    }

    toggleDescription() {
        this.isExpanded = !this.isExpanded;
    }

    // Methods for Lightbox functionality
    openLightbox(image: string) {
        this.isLightboxOpen = true;
        this.selectedImage = image;
        this.currentIndex = this.shopInfo.galleryImages.indexOf(image);
    }

    closeLightbox() {
        this.isLightboxOpen = false;
    }

    prevImage() {
        this.currentIndex = (this.currentIndex === 0) ? this.shopInfo.galleryImages.length - 1 : this.currentIndex - 1;
        this.selectedImage = this.shopInfo.galleryImages[this.currentIndex];
    }

    nextImage() {
        this.currentIndex = (this.currentIndex === this.shopInfo.galleryImages.length - 1) ? 0 : this.currentIndex + 1;
        this.selectedImage = this.shopInfo.galleryImages[this.currentIndex];
    }
}
