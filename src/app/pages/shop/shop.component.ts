import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { RdvModalComponent } from 'src/app/core/component/rdv-modal/rdv-modal.component';
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
    imgStorageUrl: string = environment.imgStorageUrl;
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
    categoriesFilter = [
        {
            name: 'Coiffure',
            icon: 'assets/images/svg/hairdresser.svg',
            filter: 'hairdresser',
        },
        {
            name: 'Manucure',
            icon: 'assets/images/svg/manicure.svg',
            filter: 'manucure',
        },
        {
            name: 'Maquillage',
            icon: 'assets/images/svg/makeup.svg',
            filter: 'maquillage',
        },
        {
            name: 'Russian Lips',
            icon: 'assets/images/svg/lips.svg',
            filter: 'hairdresser',
        },
        {
            name: 'Soins du Visage',
            icon: 'assets/images/svg/head-massage.svg',
            filter: 'visage',
        },
        {
            name: 'Épilation',
            icon: 'assets/images/svg/hairRemove.svg',
            filter: 'epilation',
        },
        {
            name: 'Massages',
            icon: 'assets/images/svg/massage.svg',
            filter: 'massage',
        },
        {
            name: 'Soins du Corps',
            icon: 'assets/images/svg/body.svg',
            filter: 'bodycare',
        },
        {
            name: 'Esthétique',
            icon: 'assets/images/svg/medical.svg',
            filter: 'esthetique',
        },
        {
            name: 'Bien-être',
            icon: 'assets/images/svg/fitness.svg',
            filter: 'wellcare',
        },
        {
            name: 'Stylisme',
            icon: 'assets/images/svg/clothes.svg',
            filter: 'style',
        },
    ];
    shopItems = [];

    constructor(
        private router: Router,
        public sessionService: SessionService,
        public dialog: MatDialog,
        private productService: ProductService,
        private activatedRoute: ActivatedRoute,
        private shopService: ShopService
    ) {}

    ngOnInit(): void {
        //récupérer l'id du shop sur la route
        let shopId = this.activatedRoute.snapshot.params['id'];
        console.log("shop id : "+shopId);
        localStorage.setItem("shopSelected", shopId);
        this.shopItems = [];
        this.productService.getProductsByShop(shopId).subscribe((data:any) => {
            console.log(data);
            this.shopItems = data;
        });
        this.shopService.getById(shopId).subscribe((data:any)=>{
            console.log("here: "+JSON.stringify(data));
            this.shopInfo = data;
            this.shopInfo.note = 0;
            this.shopInfo.noteCount = data.reviews.length
            for(let elem of data.reviews) {
                this.shopInfo.note = this.shopInfo.note + elem.rating
            }
            this.shopInfo.note = this.shopInfo.note/data.reviews.length
        })
    }

    openDialog() {
        this.dialog.open(RdvModalComponent);
    }
    scrollLeft(type: any) {
        switch (type) {
            case 'category':
                this.scrollContainerCategory!.nativeElement.scrollBy({
                    left: -this.calculateScrollAmount(),
                    behavior: 'smooth',
                });
                break;
            case 'around':
                this.scrollContainerAround!.nativeElement.scrollBy({
                    left: -this.calculateScrollAmount(),
                    behavior: 'smooth',
                });
                break;
            case 'promo':
                this.scrollContainerPromo!.nativeElement.scrollBy({
                    left: -this.calculateScrollAmount(),
                    behavior: 'smooth',
                });
                break;
            case 'top10':
                this.scrollContainerTop10!.nativeElement.scrollBy({
                    left: -this.calculateScrollAmount(),
                    behavior: 'smooth',
                });
                break;
        }
    }

    setActiveTab(tab: string): void {
        this.activeTab = tab;
    }
    scrollRight(type: any) {
        switch (type) {
            case 'category':
                this.scrollContainerCategory!.nativeElement.scrollBy({
                    left: this.calculateScrollAmount(),
                    behavior: 'smooth',
                });
                break;
            case 'around':
                this.scrollContainerAround!.nativeElement.scrollBy({
                    left: this.calculateScrollAmount(),
                    behavior: 'smooth',
                });
                break;
            case 'promo':
                this.scrollContainerPromo!.nativeElement.scrollBy({
                    left: this.calculateScrollAmount(),
                    behavior: 'smooth',
                });
                break;
            case 'top10':
                this.scrollContainerTop10!.nativeElement.scrollBy({
                    left: this.calculateScrollAmount(),
                    behavior: 'smooth',
                });
                break;
        }
    }

    private calculateScrollAmount(): number {
        // Taille hypothétique d'un 'app-card' plus la marge
        return (300 + 20) * 4;
    }

    toProfilePage() {
        this.router.navigate(['/profile']);
    }
}
