import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DrawerService } from 'src/app/core/services/drawer.service';
import { SessionService } from 'src/app/core/services/session.service';
import { ShopService } from 'src/app/core/services/shop.service';
import { environment } from 'src/environments/environment';

// Définition du composant avec son sélecteur, son template HTML et ses styles CSS associés
@Component({
    selector: 'app-main',
    templateUrl: './main.component.html',
    styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit {
    imgStorageUrl: string = environment.imgStorageUrl; // URL de stockage des images, récupérée depuis les variables d'environnement
    filteredItems: any[] = [];
    filteredItemsAdecouvrir: any[] = []; // Tableau pour stocker les éléments filtrés affichés à l'utilisateur
    filteredItemsApprecier: any[] = []; // Tableau pour stocker les éléments filtrés affichés à l'utilisateur
    filteredItemsMalin: any[] = []; // Tableau pour stocker les éléments filtrés affichés à l'utilisateur
    filteredItemsTop10: any[] = []; // Tableau pour stocker les éléments filtrés affichés à l'utilisateur
    selectedCategory: string | undefined; // Catégorie sélectionnée actuellement par l'utilisateur
    filterClicked = false; // Booléen pour gérer l'état du filtre (activé ou non)
    promotedShops: any[] = []; // Tableau pour stocker les boutiques promues
    categoriesFilter = [
        // Tableau des catégories disponibles pour le filtrage
        // Chaque catégorie est représentée par un objet contenant son nom, une icône et un identifiant de filtre
        // ... liste des catégories ...
        {
            name: 'Coiffure',
            icon: 'assets/images/icon_category_hairdresser.png',
            filter: 'coiffure',
            trad: 'MAIN_CATEGORY.COIFFURE',
        },
        {
            name: 'Manucure',
            icon: 'assets/images/icon_category_manucure.png',
            filter: 'manucure',
            trad: 'MAIN_CATEGORY.MANUCURE',
        },
        {
            name: 'Visage',
            icon: 'assets/images/icon_category_head.png',
            filter: 'visage',
            trad: 'MAIN_CATEGORY.VISAGE',
        },
        {
            name: 'Massage',
            icon: 'assets/images/icon_category_massage2.png',
            filter: 'massage',
            trad: 'MAIN_CATEGORY.MASSAGE',
        },
        {
            name: 'Maquillage',
            icon: 'assets/images/icon_category_eye.png',
            filter: 'maquillage',
            trad: 'MAIN_CATEGORY.MAQUILLAGE',
        },
        {
            name: 'Épilation',
            icon: 'assets/images/icon_category_epilation.png',
            filter: 'epilation',
            trad: 'MAIN_CATEGORY.EPILATION',
        },
        {
            name: 'Bronzage',
            icon: 'assets/images/icon_category_sun.png',
            filter: 'bronzage',
            trad: 'MAIN_CATEGORY.BRONZAGE',
        },
        {
            name: 'Post-partum',
            icon: 'assets/images/icon_category_baby.png',
            filter: 'partum',
            trad: 'MAIN_CATEGORY.PARTUM',
        },
        {
            name: 'Nutrition',
            icon: 'assets/images/icon_category_nutrition.png',
            filter: 'nutrition',
            trad: 'MAIN_CATEGORY.NUTRITION',
        },
        {
            name: 'Fitness',
            icon: 'assets/images/icon_category_fitness2.png',
            filter: 'fitness',
            trad: 'MAIN_CATEGORY.FITNESS',
        },
        {
            name: 'Acupuncture',
            icon: 'assets/images/icon_category_accuponcture.png',
            filter: 'acupuncture',
            trad: 'MAIN_CATEGORY.ACUPUNCTURE',
        },
        {
            name: 'Stylisme',
            icon: 'assets/images/icon_category_style.png',
            filter: 'style',
            trad: 'MAIN_CATEGORY.STYLISME',
        },
        {
            name: 'Tatouage',
            icon: 'assets/images/icon_category_tatoo.png',
            filter: 'tatouage',
            trad: 'MAIN_CATEGORY.TATOUAGE',
        },
        {
            name: 'Décoration',
            icon: 'assets/images/icon_category_decor.png',
            filter: 'decoration',
            trad: 'MAIN_CATEGORY.DECO',
        },
        /*
        {
            name: 'Pédicure',
            icon: 'assets/images/icon_category_hairdresser.png',
            filter: 'pedicure',
        },
        {
            name: 'Luminothérapie',
            icon: 'assets/images/svg/clothes.svg',
            filter: 'lumiere',
        },
        {
            name: 'Aromathérapie',
            icon: 'assets/images/svg/fitness.svg',
            filter: 'arome',
        },
        {
            name: 'Reiki',
            icon: 'assets/images/svg/clothes.svg',
            filter: 'reiki',
        },
        {
            name: 'Yoga',
            icon: 'assets/images/svg/icon_category_yoga.png',
            filter: 'yoga',
        },
        {
            name: 'Pilates',
            icon: 'assets/images/svg/clothes.svg',
            filter: 'pilates',
        },
        {
            name: 'Chiropractie',
            icon: 'assets/images/svg/clothes.svg',
            filter: 'chiropractie',
        },
        {
            name: 'Sophrologie',
            icon: 'assets/images/svg/clothes.svg',
            filter: 'sophrologie',
        },
        */
    ];
    shops: any[] = []; // Tableau pour stocker les informations des boutiques récupérées de l'API

    // Références aux éléments du DOM pour gérer le défilement des conteneurs de contenu
    @ViewChild('scrollContainerCategory') private scrollContainerCategory:
        | ElementRef
        | undefined;
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
        private shopService: ShopService,
        public sessionService: SessionService
    ) {}

    // Fonction appelée à l'initialisation du composant
    ngOnInit() {
        localStorage.removeItem('shopSelected');
        localStorage.removeItem('productToBuy');
        localStorage.removeItem('selectItemFromShop');
        localStorage.removeItem('activeMenu');
        this.getLocationAndLoadShops(); // Charge les shops basés sur la localisation du client
    }

    // Récupère la localisation de l'utilisateur et charge les shops correspondants
    private getLocationAndLoadShops() {
        navigator.geolocation.getCurrentPosition((position) => {
            console.log('Latitude: ' + position.coords.latitude); // Log de la latitude pour le débogage
            console.log('Longitude: ' + position.coords.longitude); // Log de la longitude pour le débogage
            this.shopService
                .getShopsNearby(
                    position.coords.latitude,
                    position.coords.longitude
                )
                .subscribe((shops: any[]) => {
                    console.log(JSON.stringify(shops)); // Log des données pour le débogage
                    this.shops = shops;
                    // this.filteredItems =  this.shuffleArray(shops); // Initialise les éléments filtrés avec tous les shops récupérés
                    // URL de stockage des images, récupérée depuis les variables d'environnement
                    this.filteredItemsAdecouvrir = this.shuffleArray(shops); // Tableau pour stocker les éléments filtrés affichés à l'utilisateur
                    this.filteredItemsApprecier = this.shuffleArray(shops); // Tableau pour stocker les éléments filtrés affichés à l'utilisateur
                    this.filteredItemsMalin = this.shuffleArray(shops); // Tableau pour stocker les éléments filtrés affichés à l'utilisateur
                    this.filteredItemsTop10 = this.shuffleArray(shops);
                    this.promotedShops = shops.filter(
                        (x: any) => x.promo.active === true
                    ); // Filtre les shops promus
                });
        });
    }

    // Applique ou retire un filtre basé sur la catégorie
    filterByCategory(type: string) {
        console.log(type); // Log du type pour débogage
        if (!this.filterClicked) {
            this.selectedCategory = type;
            this.filterClicked = true;
            this.filteredItems = this.shops.filter((x: any) => x.type === type); // Applique le filtre
        } else if (this.selectedCategory === type) {
            this.cancelFilter(); // Retire le filtre si la même catégorie est sélectionnée de nouveau
        } else {
            this.selectedCategory = type;
            this.filteredItems = this.shops.filter((x: any) => x.type === type); // Change le filtre à une nouvelle catégorie
        }
    }

    shuffleArray<T>(array: T[]): T[] {
        // Création d'une copie du tableau pour ne pas modifier l'original
        let shuffledArray = array.slice();

        // Algorithme de Fisher-Yates
        for (let i = shuffledArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledArray[i], shuffledArray[j]] = [
                shuffledArray[j],
                shuffledArray[i],
            ];
        }

        return shuffledArray;
    }

    // Fonctions pour gérer le défilement horizontal des différents conteneurs
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

    // Calcule la quantité de défilement basée sur une estimation de la taille d'un 'app-card' et sa marge
    private calculateScrollAmount(): number {
        return (300 + 20) * 4; // 300px par carte plus 20px de marge, multiplié par 4 cartes
    }

    // Redirige vers la page d'une boutique spécifique
    toShopPage(id: string) {
        this.router.navigate(['shop/' + id]); // Navigation programmée vers la page du shop
    }

    // Annule le filtre appliqué et réinitialise l'affichage de tous les shops
    cancelFilter() {
        this.selectedCategory = '';
        this.filterClicked = false;
        this.filteredItems = this.shops;
    }
}
