import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DrawerService } from 'src/app/core/services/drawer.service';
import { ShopService } from 'src/app/core/services/shop.service';

@Component({
    selector: 'app-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit {
    filteredItems: any[] = [];
    selectedCategory: string | undefined;
    filterClicked = false;
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
            filter: 'russianlips',
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
            name: 'Soins corporel',
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
    shops = [];

    @ViewChild('scrollContainerCategory')
    private scrollContainerCategory: ElementRef | undefined;
    @ViewChild('scrollContainerAround') private scrollContainerAround:
        | ElementRef
        | undefined;
    @ViewChild('scrollContainerPromo') private scrollContainerPromo:
        | ElementRef
        | undefined;
    @ViewChild('scrollContainerTop10') private scrollContainerTop10:
        | ElementRef
        | undefined;

    constructor(
        private router: Router,
        private drawerService: DrawerService,
        private shopService: ShopService
    ) {}
    ngOnInit() {
        this.drawerService.closeDrawer();
        this.shopService.getAll().subscribe((shops: any) => {
            console.log(JSON.stringify(shops));
            this.shops = shops;
            this.filteredItems = this.shops;
        });
    }

    filterByCategory(type: string) {
        console.log(type);
        if (!this.filterClicked) {
            this.selectedCategory = type;
            this.filterClicked = true;
            this.filteredItems = this.shops.filter((x: any) => x.type === type);
        } else if (this.selectedCategory === type) {
            this.cancelFilter();
            this.selectedCategory = undefined;
            this.filterClicked = false;
            this.filteredItems = this.shops;
        } else {
            this.selectedCategory = type;
            this.filteredItems = this.shops.filter((x: any) => x.type === type);
        }
    }

    scrollLeft(type: string) {
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

    scrollRight(type: string) {
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

    toShopPage() {
        this.router.navigate(['shop']);
    }

    cancelFilter() {
        this.selectedCategory = '';
        this.filterClicked = false;
        this.filteredItems = this.shops;
    }
}
