import { Component, Inject, OnInit, Optional } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ShopService } from '../../services/shop.service';
import { ShopTemplateService } from '../../services/shop-template.service';
import { max } from 'lodash';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';
import { VilleService } from '../../services/ville.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
// import { MatDialogRef } from '@angular/material/dialog';

@Component({
    selector: 'app-create-shop',
    templateUrl: './create-shop.component.html',
    styleUrls: ['./create-shop.component.scss'],
})
export class CreateShopComponent implements OnInit {
    error: any = {};
    me: any = {};
    newShop: any = {};
    isUserConnected: boolean = false;
    alreadyProfessionnal: boolean = false;
    categories: any[] = [];
    newAddress: any = {};
    deliveryPostalCode: string = '';
    deliveryPostalCodesList: string[] = [];
    latitude = 0.0;
    longitude = 0.0;
    // Données récupérées de l'API
    allCitiesData: any[] = [];        // on stocke ici toutes les villes brutes
    availableArrondissements: string[] = []; // liste filtrée d'arrondissements (name) pour une ville

    // Valeurs sélectionnées par l'utilisateur


    selectedCountry = 'France';
    selectedCity: any = {};
    selectedArrondissement = '';
    availableCountries = ['France'];
    availableCities: any[] = [];
    postalCode: string = '';
    constructor(
        private userService: UserService,
        private shopService: ShopService,
        private productService: ProductService,
        private router: Router,
        private villeService: VilleService,
        private categoryService: CategoryService,
        @Optional() public dialogRef?: MatDialogRef<CreateShopComponent>,
        @Optional() @Inject(MAT_DIALOG_DATA) public data?: any,
        // private shopTemplateService: ShopTemplateService,
    ) { }

    ngOnInit() {
        this.categoryService.getAll().subscribe({
            next: (data: any) => {
                this.categories = data;
            },
            error: (error: any) => {
                console.log(error);
            },
        });
        this.newShop.companyType = 'coiffure';
        this.newShop.countryIndication = 'FR';
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


    // ----------------------------------------
    // 1) Quand l’utilisateur choisit un pays
    // ----------------------------------------


    onCountryChange() {
        this.postalCode = '';
        this.availableCities = [];
        this.selectedCity = {};
    }

    addPostalCode() {
        if (!this.deliveryPostalCode) return;
        // Vérifie si le code est déjà ajouté
        if (this.deliveryPostalCodesList.includes(this.deliveryPostalCode)) {
            this.error.deliveryPostalCode = "Ce code postal est déjà ajouté.";
            return;
        }
        this.villeService.getByPostalCode(this.deliveryPostalCode).subscribe({
            next: (res) => {
                if (res.length > 0) {
                    this.deliveryPostalCodesList.push(this.deliveryPostalCode);
                    this.newShop.deliveryPostalCodes = this.deliveryPostalCodesList;
                    this.deliveryPostalCode = ''; // Réinitialise le champ
                    this.error.deliveryPostalCode = null;
                } else {
                    this.error.deliveryPostalCode = "Code postal introuvable dans la base";
                }
            },
            error: () => {
                alert("Erreur lors de la recherche du code postal.");
            }
        });
    }

    removePostalCode(index: number) {
        this.deliveryPostalCodesList.splice(index, 1);
        this.newShop.deliveryPostalCodes = this.deliveryPostalCodesList;
    }

    onPostalCodeEntered() {
        if (!this.postalCode || this.postalCode.length < 4) return;

        this.villeService.getByPostalCode(this.postalCode, this.selectedCountry).subscribe((cities: any[]) => {
            console.log(cities)
            this.availableCities = cities;
            this.newAddress.code_postal = this.postalCode;

            if (cities.length === 1) {
                this.selectedCity = cities[0];
            }
        });
    }

    // -----------------------------------------
    // 2) Quand l’utilisateur choisit une ville
    // -----------------------------------------
    onCityChange() {
        // Filtre les documents par pays + city
        const filteredByCity = this.allCitiesData.filter(
            v => v.pays === this.selectedCountry && v.city === this.selectedCity.nom
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
        this.newAddress.city = this.selectedCity.nom;
    }

    onSubmit() {
        if (!this.validateNameWithInitial(this.newShop.name)) {
            this.error.name = "Le nom doit être au format Michelle T.";
            return;
        } else {
            this.error.name = null;
        }

        if (!this.newShop.street) {
            this.error.street = "La rue est obligatoire";
            return;
        } else {
            this.error.street = null;
        }

        if (!this.selectedCountry) {
            this.error.selectedCountry = "Le pays est obligatoire";
            return;
        }

        if (!this.selectedCity) {
            this.error.selectedCity = "La ville est obligatoire";
            return;
        }

        if (!this.newShop.companyType) {
            this.error.companyType = "Le type de service proposé est obligatoire";
            return;
        }
        // this.newShop.deliveryPostalCodesList = this.deliveryPostalCodesList;
        // console.log(this.newShop.name)
        // let test = this.createShop('coiffure', 'id_fake');
        // console.log(test);

        // Si toutes les vérifications passent, on continue
        if (this.isUserConnected) {
            this.me.shopCompany = this.newShop;
            this.me.role = 'professionnel';
            this.userService.update(this.me).subscribe({
                next: async (data: any) => {
                    console.log(data);
                    let shopToCreate: any = {};
                    await this.createShop(
                        this.newShop.companyType,
                        this.me._id
                    );
                },
                error: (error: any) => {
                    console.log(error);
                },
            });
        }
    }
    validateNameWithInitial(input: string): boolean {
        const nameRegex = /^[A-Z][a-z]+ [A-Z]\.$/;
        return nameRegex.test(input.trim());
    }




    /**
     * Reformate newShop.name en "Prénom N."
     * Ex : "Pierre Dupont" → "Pierre D."
     */
    formatShopName(): void {
        // 1) Nettoyage et découpe
        const raw = this.newShop.name.trim();
        if (!raw) {
            this.newShop.name = '';
            return;
        }
        const parts = raw.split(/\s+/);

        // 2) Normalisation du prénom
        const rawFirst = parts[0];
        const firstName = rawFirst.charAt(0).toUpperCase()
            + rawFirst.slice(1).toLowerCase();

        // 3) Détermination de l'initiale
        let initial: string;
        if (parts.length >= 2) {
            const rawLast = parts[parts.length - 1];
            initial = rawLast.charAt(0).toUpperCase();
        } else {
            // lettre aléatoire si pas de nom
            const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            initial = letters.charAt(
                Math.floor(Math.random() * letters.length)
            );
        }

        // 4) Assemblage final
        this.newShop.name = `${firstName} ${initial}.`;
    }

    createShop(type: string, idUser: string): any {
        let newShopToCreate: any = {};
        newShopToCreate.name = this.newShop.name;

        // Trouver la catégorie correspondant au type
        let categoryToSelect = this.categories.find(
            (x: any) => x.filter === type
        );

        // Si aucune catégorie n'est trouvée, définir une description par défaut
        if (!categoryToSelect) {
            console.error('Catégorie non trouvée pour le type:', type);
            categoryToSelect = { descriptionTrad: 'Description par défaut', trad: 'Traduit par défaut' };
        }

        // Assignation des valeurs pour la nouvelle boutique
        newShopToCreate.deliveryPostalCodes = this.deliveryPostalCodesList;
        let description = categoryToSelect.descriptionTrad;  // Utilisation de la descriptionTrad de la catégorie trouvée
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

        // Définition des horaires de la boutique
        newShopToCreate.hours = {};
        newShopToCreate.trad = categoryToSelect.trad;
        newShopToCreate.hours.morning = {};
        newShopToCreate.hours.morning.start = '09:00';
        newShopToCreate.hours.morning.end = '12:00';
        newShopToCreate.hours.afternoon = {};
        newShopToCreate.hours.afternoon.start = '13:00';
        newShopToCreate.hours.afternoon.end = '18:00';

        // Envoi de la requête pour créer la boutique
        this.shopService.create(newShopToCreate).subscribe({
            next: (data: any) => {
                console.log(data);
                // Ferme la modal après la création réussie de la boutique
                if (this.dialogRef)
                    this.dialogRef.close(data);  // Ferme la modal et passe la donnée à la modal par le `close()`
            },
            error: (error: any) => {
                console.log('Error : ' + JSON.stringify(error));
                console.log(error);
                return error;
            },
        });
    }


    formChecking() { }

    goToSignUp() {
        this.router.navigate(['/sign-in']);
    }
}
