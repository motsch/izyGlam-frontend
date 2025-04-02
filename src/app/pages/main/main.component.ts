import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CategoryService } from 'src/app/core/services/category.service';
import { SessionService } from 'src/app/core/services/session.service';
import { SharedService } from 'src/app/core/services/shared.service';
import { ShopService } from 'src/app/core/services/shop.service';
import { UserService } from 'src/app/core/services/user.service';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { AdvertisementService } from 'src/app/core/services/advertisement.service';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';

@Component({
    selector: 'app-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit, AfterViewInit {
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
    pubs: any[] = [];

    searchControl = new FormControl('');
    
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
        private router: Router,
        private advertisementService: AdvertisementService
    ) { }

    ngOnInit() {
        this.searchControl.valueChanges.pipe(
          debounceTime(300),
          distinctUntilChanged(),
          switchMap((query) =>
            this.shopService.searchShopsWithServices(this.selectedPostalCode, this.searchQuery)
          )
        ).subscribe((results) => {
          this.shops = results;
        });
        // 🔐 Redirection si non connecté
        if (!this.sessionService.isLoggedIn()) {
            this.router.navigate(['/login']);
            return;
        }
        this.loadAds();
        this.loadUserAndShops();
    }

    ngAfterViewInit(): void {
        const elements = document.querySelectorAll('.drag-scroll');

        elements.forEach((el) => {
            let isDown = false;
            let startX = 0;
            let scrollLeft = 0;

            (el as HTMLElement).addEventListener('mousedown', (event) => {
                const e = event as MouseEvent;
                isDown = true;
                (el as HTMLElement).classList.add('active-drag');
                startX = e.pageX - (el as HTMLElement).offsetLeft;
                scrollLeft = (el as HTMLElement).scrollLeft;
            });

            (el as HTMLElement).addEventListener('mouseleave', () => {
                isDown = false;
                (el as HTMLElement).classList.remove('active-drag');
            });

            (el as HTMLElement).addEventListener('mouseup', () => {
                isDown = false;
                (el as HTMLElement).classList.remove('active-drag');
            });

            (el as HTMLElement).addEventListener('mousemove', (event) => {
                const e = event as MouseEvent;
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - (el as HTMLElement).offsetLeft;
                const walk = (x - startX) * 1.2; // ajustable
                (el as HTMLElement).scrollLeft = scrollLeft - walk;
            });
        });
    }

    loadAds() {
        this.advertisementService.getAdvertisements().subscribe((data: any) => {
            //F6: Ads
            this.pubs = data;
        }, (error: any) => {
            console.log(error);
        })
    }

    goTo(link: string) {
        console.log("click: " + link);
    
        if (link.startsWith('http://') || link.startsWith('https://')) {
            window.open(link, '_blank'); // Ouvre le lien externe dans un nouvel onglet
        } else {
            this.router.navigateByUrl(link); // Navigation interne Angular
        }
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
            next: (data: any[]) => {
                this.categoriesFilter = data.sort((a, b) => a.position - b.position);
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
