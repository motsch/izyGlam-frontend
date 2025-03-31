import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CategoryService } from 'src/app/core/services/category.service';
import { SessionService } from 'src/app/core/services/session.service';
import { SharedService } from 'src/app/core/services/shared.service';
import { ShopService } from 'src/app/core/services/shop.service';
import { UserService } from 'src/app/core/services/user.service';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';

@Component({
    selector: 'app-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit {
    me: any = {};
    imgStorageUrl: string = environment.imgStorageUrl;
    filteredItems: any[] = [];
    filteredItemsAdecouvrir: any[] = [];
    filteredItemsApprecier: any[] = [];
    filteredItemsMalin: any[] = [];
    filteredItemsTop10: any[] = [];
    selectedCategory: string | undefined;
    filterClicked = false;
    promotedShops: any[] = [];
    categoriesFilter: any[] = [];
    showAddressModal: boolean = false;
    shops: any[] = [];
    searchQuery: string = '';
    searchActive: boolean = false;
    filteredSearchResults: any[] = [];
    // Sélection adresse / code postal
    selectedPostalCode: string = '75001';
    availablePostalCodes: string[] = ['75001'];
    userAddresses: any[] = [];

    @ViewChild('scrollContainerCategory') private scrollContainerCategory?: ElementRef;
    @ViewChild('scrollContainerDiscover') private scrollContainerDiscover?: ElementRef;
    @ViewChild('scrollContainerAround') private scrollContainerAround?: ElementRef;
    @ViewChild('scrollContainerPromo') private scrollContainerPromo?: ElementRef;
    @ViewChild('scrollContainerTop10') private scrollContainerTop10?: ElementRef;
    @ViewChild('scrollContainerSmart') private scrollContainerSmart?: ElementRef;

    constructor(
        private sharedService: SharedService,
        private shopService: ShopService,
        public sessionService: SessionService,
        private categoryService: CategoryService,
        private userService: UserService,
        private router: Router
    ) { }

    ngOnInit() {
        // 🔐 Redirection si non connecté
        if (!this.sessionService.isLoggedIn()) {
            this.router.navigate(['/login']);
            return;
        }
        this.loadUserAndShops();
    }

    private loadUserAndShops() {
        this.userService.getMe().subscribe({
            next: (data: any) => {
                this.me = data;
                this.sharedService.updateMe(data);
                localStorage.removeItem('shopSelected');
                localStorage.removeItem('productToBuy');
                localStorage.removeItem('selectItemFromShop');
                localStorage.removeItem('activeMenu');

                // 🔄 Si l'utilisateur a des adresses, on prend la première
                if (data.address && data.address.length > 0) {
                    const first = data.address[0];
                    if (first.code_postal) {
                        this.selectedPostalCode = first.code_postal;
                    }
                    this.availablePostalCodes = data.address.map((a: any) => a.code_postal);
                    this.userAddresses = data.address;
                }

                this.loadCategories();
                this.loadShops();
            },
            error: (error: any) => {
                console.log(error);
            },
        });
    }

    private loadCategories() {
        this.categoryService.getAvailableCategories(undefined, undefined, [this.selectedPostalCode]).subscribe({
            next: (data: any) => {
                this.categoriesFilter = data;
            },
            error: (error: any) => {
                console.log(error);
            },
        });
    }

    filterShops() {
        const query = this.searchQuery.trim().toLowerCase();

        if (!query) {
            this.filteredSearchResults = [...this.shops];
            return;
        }

        this.filteredSearchResults = this.shops.filter(shop =>
            this.normalizeText(shop.name).includes(this.normalizeText(query))
        );
    }

    normalizeText(text: string): string {
        return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    }


    private loadShops() {
        this.shopService.getShopsByPostalCodes([this.selectedPostalCode]).subscribe(async (shops: any[]) => {
            const favoriteShops = this.me.favoriteShops || [];

            this.shops = shops.map((shop) => ({
                ...shop,
                isFavorite: favoriteShops.includes(shop._id),
            }));

            this.filteredItemsAdecouvrir = this.shuffleArray(this.shops);
            this.filteredItemsApprecier = this.shuffleArray(this.shops);
            this.filteredItemsMalin = this.shuffleArray(this.shops);
            this.filteredItemsTop10 = this.shuffleArray(this.shops);

            this.promotedShops = this.shops.filter((x: any) => x.promo?.active === true);
        });
    }

    filterByCategory(type: string) {
        if (!this.filterClicked) {
            this.selectedCategory = type;
            this.filterClicked = true;
            this.filteredItems = this.shops.filter((x: any) => x.type === type);
        } else if (this.selectedCategory === type) {
            this.cancelFilter();
        } else {
            this.selectedCategory = type;
            this.filteredItems = this.shops.filter((x: any) => x.type === type);
        }
    }

    cancelFilter() {
        this.selectedCategory = '';
        this.filterClicked = false;
        this.filteredItems = this.shops;
    }

    shuffleArray<T>(array: T[]): T[] {
        let shuffledArray = array.slice();
        for (let i = shuffledArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
        }
        return shuffledArray;
    }

    scrollLeft(type: string) {
        this.scrollBy(type, -this.calculateScrollAmount());
    }

    scrollRight(type: string) {
        this.scrollBy(type, this.calculateScrollAmount());
    }

    private scrollBy(type: string, amount: number) {
        const containerMap: { [key: string]: ElementRef | undefined } = {
            category: this.scrollContainerCategory,
            discover: this.scrollContainerDiscover,
            around: this.scrollContainerAround,
            promo: this.scrollContainerPromo,
            top10: this.scrollContainerTop10,
            smart: this.scrollContainerSmart,
        };

        const container = containerMap[type];
        if (container) {
            container.nativeElement.scrollBy({
                left: amount,
                behavior: 'smooth',
            });
        }
    }

    private calculateScrollAmount(): number {
        return (300 + 20) * 4;
    }
    openAddressModal() {
        this.showAddressModal = true;
    }

    closeAddressModal() {
        this.showAddressModal = false;
    }

    selectPostalCode(postalCode: string) {
        this.selectedPostalCode = postalCode;
        this.loadCategories();
        this.loadShops();
        this.closeAddressModal();
    }
}
