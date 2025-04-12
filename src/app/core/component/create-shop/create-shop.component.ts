import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ShopService } from '../../services/shop.service';
import { ShopTemplateService } from '../../services/shop-template.service';
import { max } from 'lodash';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';
import { VilleService } from '../../services/ville.service';

@Component({
    selector: 'app-create-shop',
    templateUrl: './create-shop.component.html',
    styleUrls: ['./create-shop.component.scss'],
})
export class CreateShopComponent implements OnInit {
    me: any = {};
    newShopUser: any = {};
    error: string | null = null;
    isUserConnected: boolean = false;
    alreadyProfessionnal: boolean = false;
    categories: any[] = [];
    newAddress: any = {};

    latitude = 0.0;
    longitude = 0.0;
    // Données récupérées de l'API
    allCitiesData: any[] = [];        // on stocke ici toutes les villes brutes
    availableCountries: string[] = [];  // liste unique de pays
    availableCities: string[] = [];     // liste filtrée de villes pour un pays
    availableArrondissements: string[] = []; // liste filtrée d'arrondissements (name) pour une ville

    // Valeurs sélectionnées par l'utilisateur
    selectedCountry: string = '';
    selectedCity: string = '';
    selectedArrondissement: string = '';
    constructor(
        private userService: UserService,
        private shopService: ShopService,
        private productService: ProductService,
        private router: Router,
        private villeService: VilleService,
        private shopTemplateService: ShopTemplateService,
        private categoryService: CategoryService
    ) { }

    ngOnInit() {
        this.getCities();
        this.categoryService.getAll().subscribe({
            next: (data: any) => {
                this.categories = data;
            },
            error: (error: any) => {
                console.log(error);
            },
        });
        this.newShopUser.companyType = 'coiffure';
        this.newShopUser.countryIndication = 'FR';
        this.userService.getMe().subscribe({
            next: (data: any) => {
                this.me = { ...data };
                if (
                    this.me.role === 'professionnel' ||
                    this.me.role === 'entreprise'
                ) {
                    this.alreadyProfessionnal = true;
                }
                this.isUserConnected = true;
            },
            error: (error: any) => {
                console.log(error);
                console.log('Error getting user');
            },
        });
    }

    getCities() {
        this.villeService.getAllLimted().subscribe((result: any) => {
            console.log(result);
            this.allCitiesData = result.data;
            this.availableCountries = result.pays;  // Liste unique de pays

        }, (error: any) => {
            console.log(error);
        })
    }


    // ----------------------------------------
    // 1) Quand l’utilisateur choisit un pays
    // ----------------------------------------
    onCountryChange() {
        // Filtrer les villes qui appartiennent à ce pays
        const filteredByCountry = this.allCitiesData.filter(v => v.pays === this.selectedCountry);
        // Extraire la liste unique de city
        this.availableCities = [...new Set(filteredByCountry.map(v => v.city))];
        // On réinitialise la sélection de ville & arrondissements
        this.selectedCity = '';
        this.availableArrondissements = [];
        // Mettre à jour l'objet newAddress
        this.newAddress.country = this.selectedCountry;
    }
    // ------------------------------------------------
    // 3) Quand l’utilisateur choisit un arrondissement
    // ------------------------------------------------
    onArrondissementChange() {
        // Refiltrer pour trouver l’unique document
        const doc = this.allCitiesData.find(
            v =>
                v.pays === this.selectedCountry &&
                v.city === this.selectedCity &&
                v.name === this.selectedArrondissement
        );
        if (doc) {
            console.log("DOC : " + JSON.stringify(doc));
            this.newAddress.code_postal = doc.code_postal;
            this.latitude = doc.latitude;
            this.longitude = doc.longitude;
            // on peut aussi récupérer d’autres infos si besoin
        }
        // Mettre à jour l'objet newAddress
        this.newAddress.arrondissement = this.selectedArrondissement;
    }

    // -----------------------------------------
    // 2) Quand l’utilisateur choisit une ville
    // -----------------------------------------
    onCityChange() {
        // Filtre les documents par pays + city
        const filteredByCity = this.allCitiesData.filter(
            v => v.pays === this.selectedCountry && v.city === this.selectedCity
        );
        if (filteredByCity.length > 1) {
            // Plusieurs arrondissements => on récupère juste la liste des name
            this.availableArrondissements = [...new Set(filteredByCity.map(v => v.name))];
            // On ne définit pas encore le code postal, 
            // car l’utilisateur doit choisir l’arrondissement précis.
            this.newAddress.code_postal = '';
        } else if (filteredByCity.length === 1) {
            // Un seul document => on récupère directement le code postal
            const doc = filteredByCity[0];
            this.availableArrondissements = [doc.name]; // si tu veux un tableau à un seul élément
            this.selectedArrondissement = doc.name;     // on sélectionne l'arrondissement par défaut
            this.newAddress.code_postal = doc.code_postal; // On met à jour le 
            this.latitude = doc.latitude;
            this.longitude = doc.longitude;

        }
        // On met à jour la ville
        this.newAddress.city = this.selectedCity;
    }

    onSubmit() {
        // let test = this.createShop('coiffure', 'id_fake');
        // console.log(test);

        // Si toutes les vérifications passent, on continue
        if (this.isUserConnected) {
            this.me.shopCompany = this.newShopUser;
            this.me.role = 'professionnel';
            this.userService.update(this.me).subscribe({
                next: async (data: any) => {
                    console.log(data);
                    let shopToCreate: any = {};
                    shopToCreate.name =
                        this.me.firstname +
                        ' ' +
                        this.me.lastname.charAt(0) +
                        '.';
                    await this.createShop(
                        this.newShopUser.companyType,
                        this.me._id
                    );
                },
                error: (error: any) => {
                    console.log(error);
                },
            });
        }
    }

    createShop(type: string, idUser: string): any {
        let newShopToCreate: any = {};

        if (this.isUserConnected) {
            newShopToCreate.name =
                this.me.firstname +
                ' ' +
                this.me.lastname.charAt(0) +
                '.';
        } else {
            newShopToCreate.name =
                this.newShopUser.firstname +
                ' ' +
                this.newShopUser.lastname.charAt(0) +
                '.';
        }
        let categoryToSelect = this.categories.find(
            (x: any) => x.filter === type
        )
        let description = categoryToSelect.descriptionTrad;
        newShopToCreate.description = description;
        newShopToCreate.image = 'default.png';
        newShopToCreate.note = '5';
        newShopToCreate.type = type;
        newShopToCreate.ville = 'Paris';
        newShopToCreate.maxDistance = 15;
        newShopToCreate.idUser = idUser;
        newShopToCreate.promo = {};
        newShopToCreate.promo.active = false;
        newShopToCreate.promo.type = '1';
        
        newShopToCreate.location = {};
        newShopToCreate.location.latitude = this.latitude;
        newShopToCreate.location.longitude = this.longitude;


        newShopToCreate.hours = {};
        newShopToCreate.trad = categoryToSelect.trad;
        newShopToCreate.hours.morning = {};
        newShopToCreate.hours.morning.start = '09:00';
        newShopToCreate.hours.morning.end = '12:00';
        newShopToCreate.hours.afternoon = {};
        newShopToCreate.hours.afternoon.start = '13:00';
        newShopToCreate.hours.afternoon.end = '18:00';
        this.shopService.create(newShopToCreate).subscribe({
            next: (data: any) => {
                console.log(data);
                // this.router.navigate(['/profile']);

            },
            error: (error: any) => {
                console.log('Error : ' + JSON.stringify(error));
                console.log(error);
                return error;
            },
        });
    }

    formChecking() { }
}
