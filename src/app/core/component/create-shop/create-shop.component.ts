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

// ✅izyGlam: traductions & toasts
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { CountryService } from '../../services/country.service';

@Component({
    selector: 'app-create-shop',
    templateUrl: './create-shop.component.html',
    styleUrls: ['./create-shop.component.scss'],
})
export class CreateShopComponent implements OnInit {
    // 🔎 Gestion d’erreurs côté UI (messages par champs)
    error: any = {};

    // 👤 Utilisateur courant
    me: any = {};

    // 🏪 Modèle de création de shop
    newShop: any = {};

    // 🔐 État de session
    isUserConnected: boolean = false;
    alreadyProfessionnal: boolean = false;

    // 🗂️ Catégories
    categories: any[] = [];

    // 🗺️ Adresse & zones de livraison
    newAddress: any = {};
    deliveryPostalCode: string = '';
    deliveryPostalCodesList: string[] = [];

    // 📍 Coordonnées géo
    latitude = 0.0;
    longitude = 0.0;

    // Données récupérées de l'API des villes
    allCitiesData: any[] = [];               // base brute
    availableArrondissements: string[] = []; // arrondissements filtrés pour une ville

    // Valeurs sélectionnées par l'utilisateur (pays / ville / arrondissement)
    selectedCountry = 'France';
    selectedCity: any = {};
    selectedArrondissement = '';
    availableCountries:any[] = [];
    availableCities: any[] = [];
    postalCode: string = '';

    constructor(
        private userService: UserService,
        private shopService: ShopService,
        private countryService: CountryService,
        private productService: ProductService,
        private router: Router,
        private villeService: VilleService,
        private categoryService: CategoryService,
        // ✅izyGlam: traductions & toasts
        private translate: TranslateService,
        private toastr: ToastrService,
        // ✅ Le composant peut être utilisé dans une modal (MatDialog)
        @Optional() public dialogRef?: MatDialogRef<CreateShopComponent>,
        @Optional() @Inject(MAT_DIALOG_DATA) public data?: any,

        // private shopTemplateService: ShopTemplateService,
    ) { }

    // ----------------------------------------
    // 🔄 Cycle de vie
    // ----------------------------------------
    ngOnInit() {
        // 1) Charger les catégories
        this.categoryService.getAll().subscribe({
            next: (data: any) => {
                this.categories = data;
            },
            error: (error: any) => {
                console.error('Erreur lors du chargement des catégories :', error);
                this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
            },
        });

        // 2) Pré-renseigner quelques champs
        this.newShop.companyType = 'coiffure';
        this.newShop.countryIndication = 'FR';
        if (this.isUserConnected) {
            // 3) Charger l’utilisateur
            this.userService.getMe().subscribe({
                next: (data: any) => {
                    this.me = { ...data };

                    if (this.me.role === 'professionnel' || this.me.role === 'entreprise') {
                        this.alreadyProfessionnal = true;
                    }
                    this.isUserConnected = true;
                },
                error: (error: any) => {
                    console.error('Erreur lors de la récupération du profil utilisateur :', error);
                    this.isUserConnected = false;
                    this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
                },
            });
        }

        // 3) Récupération des pays activés
        this.countryService.getAll({ active: true }).subscribe({
            next: (countries: any[]) => {
                this.availableCountries = countries;
            },
            error: (err) => {
                console.error('Erreur lors du chargement des pays :', err);
            }
        });
    }

    // ----------------------------------------
    // 🌍 Sélection du pays
    // ----------------------------------------
    onCountryChange() {
        // Reset des sélections liés au pays
        this.postalCode = '';
        this.availableCities = [];
        this.selectedCity = {};
        this.availableArrondissements = [];
        this.selectedArrondissement = '';
        this.newAddress.code_postal = '';
    }

    // ----------------------------------------
    // ➕ Ajout d’un code postal de livraison
    // ----------------------------------------
    addPostalCode() {
        try {
            if (!this.deliveryPostalCode) return;

            // ✅ Doublon
            if (this.deliveryPostalCodesList.includes(this.deliveryPostalCode)) {
                this.error.deliveryPostalCode = 'Ce code postal est déjà ajouté.';
                return;
            }

            // 🔍 Valider le CP via API (on passe le pays si dispo)
            this.villeService.getByPostalCode(this.deliveryPostalCode, this.selectedCountry).subscribe({
                next: (res) => {
                    if (Array.isArray(res) && res.length > 0) {
                        this.deliveryPostalCodesList.push(this.deliveryPostalCode);
                        this.newShop.deliveryPostalCodes = this.deliveryPostalCodesList;
                        this.deliveryPostalCode = ''; // Reset du champ
                        this.error.deliveryPostalCode = null;
                        // (facultatif) this.showSuccessToast(this.translate.instant('SUCCESS.ACTION_OK'));
                    } else {
                        this.error.deliveryPostalCode = 'Code postal introuvable dans la base';
                    }
                },
                error: (err) => {
                    console.error('Erreur lors de la recherche du code postal :', err);
                    this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
                }
            });
        } catch (err) {
            console.error('Erreur addPostalCode :', err);
            this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        }
    }

    // ❌ Suppression d’un code postal de livraison
    removePostalCode(index: number) {
        try {
            this.deliveryPostalCodesList.splice(index, 1);
            this.newShop.deliveryPostalCodes = this.deliveryPostalCodesList;
        } catch (err) {
            console.error('Erreur removePostalCode :', err);
            this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        }
    }

    // ----------------------------------------
    // 🔎 Recherche des villes par code postal
    // ----------------------------------------
    onPostalCodeEntered() {
        try {
            if (!this.postalCode || this.postalCode.length < 4) return;

            this.villeService.getByPostalCode(this.postalCode, this.selectedCountry).subscribe({
                next: (cities: any[]) => {
                    this.availableCities = cities;
                    this.newAddress.code_postal = this.postalCode;

                    if (cities.length === 1) {
                        this.selectedCity = cities[0];
                    }
                },
                error: (err) => {
                    console.error('Erreur lors du chargement des villes par CP :', err);
                    this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
                }
            });
        } catch (err) {
            console.error('Erreur onPostalCodeEntered :', err);
            this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        }
    }

    // -----------------------------------------
    // 🏙️ Quand l’utilisateur choisit une ville
    // -----------------------------------------
    onCityChange() {
        try {
            // Filtre par pays + nom de ville
            const filteredByCity = this.allCitiesData.filter(
                v => v.pays === this.selectedCountry && v.city === this.selectedCity.nom
            );

            if (filteredByCity.length > 1) {
                // Plusieurs arrondissements => on ne fixe pas le CP tant que l’arrondissement n’est pas choisi
                this.availableArrondissements = [...new Set(filteredByCity.map(v => v.name))];
                this.newAddress.code_postal = '';
            } else if (filteredByCity.length === 1) {
                // Un seul document => on peut fixer le CP, l’arrondissement et les coords
                const doc = filteredByCity[0];
                this.availableArrondissements = [doc.name];
                this.selectedArrondissement = doc.name;
                this.newAddress.code_postal = doc.code_postal;
                this.latitude = doc.latitude;
                this.longitude = doc.longitude;
            }

            // Mise à jour de la ville
            this.newAddress.city = this.selectedCity.nom;
        } catch (err) {
            console.error('Erreur onCityChange :', err);
            this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        }
    }

    // ----------------------------------------
    // ✅ Validation du formulaire & création
    // ----------------------------------------
    onSubmit() {
        try {
            // 1) Validation “Michelle T.”
            if (!this.validateNameWithInitial(this.newShop.name)) {
                this.error.name = 'Le nom doit être au format Michelle T.';
                return;
            } else {
                this.error.name = null;
            }

            // 2) Rue obligatoire
            if (!this.newShop.street) {
                this.error.street = 'La rue est obligatoire';
                return;
            } else {
                this.error.street = null;
            }

            // 3) Pays
            if (!this.selectedCountry) {
                this.error.selectedCountry = 'Le pays est obligatoire';
                return;
            }

            // 4) Ville
            if (!this.selectedCity) {
                this.error.selectedCity = 'La ville est obligatoire';
                return;
            }

            // 5) Type de service
            if (!this.newShop.companyType) {
                this.error.companyType = 'Le type de service proposé est obligatoire';
                return;
            }

            // 6) On passe à la création si user connecté
            if (this.isUserConnected) {
                this.me.shopCompany = this.newShop;
                this.me.role = 'professionnel';

                this.userService.update(this.me).subscribe({
                    next: async (data: any) => {
                        // Profil mis à jour → créer le shop
                        try {
                            await this.createShop(this.newShop.companyType, this.me._id);
                        } catch (err) {
                            console.error('Erreur lors de la création du shop :', err);
                            this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
                        }
                    },
                    error: (error: any) => {
                        console.error('Erreur lors de la mise à jour du profil en “professionnel” :', error);
                        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
                    },
                });
            }
        } catch (err) {
            console.error('Erreur onSubmit :', err);
            this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        }
    }

    // ----------------------------------------
    // 🔤 Validation du nom “Prénom N.”
    // ----------------------------------------
    validateNameWithInitial(input: string): boolean {
        const nameRegex = /^[A-Z][a-z]+ [A-Z]\.$/;
        return nameRegex.test((input || '').trim());
    }

    /**
     * 🧼 Reformate newShop.name en "Prénom N."
     * Ex : "Pierre Dupont" → "Pierre D."
     */
    formatShopName(): void {
        try {
            const raw = (this.newShop.name || '').trim();
            if (!raw) {
                this.newShop.name = '';
                return;
            }

            const parts = raw.split(/\s+/);

            const rawFirst = parts[0];
            const firstName = rawFirst.charAt(0).toUpperCase() + rawFirst.slice(1).toLowerCase();

            let initial: string;
            if (parts.length >= 2) {
                const rawLast = parts[parts.length - 1];
                initial = rawLast.charAt(0).toUpperCase();
            } else {
                // Si pas de nom, on génère une lettre aléatoire
                const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                initial = letters.charAt(Math.floor(Math.random() * letters.length));
            }

            this.newShop.name = `${firstName} ${initial}.`;
        } catch (err) {
            console.error('Erreur formatShopName :', err);
            this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        }
    }

    // ----------------------------------------
    // 🏗️ Création du shop côté backend
    // ----------------------------------------
    createShop(type: string, idUser: string): any {
        const newShopToCreate: any = {};
        newShopToCreate.name = this.newShop.name;

        // Chercher la catégorie correspondante
        let categoryToSelect = this.categories.find((x: any) => x.filter === type);

        // Fallback si introuvable
        if (!categoryToSelect) {
            console.error('Catégorie non trouvée pour le type :', type);
            categoryToSelect = { descriptionTrad: 'Description par défaut', trad: 'Traduit par défaut' };
        }

        // Hydratation du modèle
        newShopToCreate.deliveryPostalCodes = this.deliveryPostalCodesList;
        const description = categoryToSelect.descriptionTrad;
        newShopToCreate.description = description;
        newShopToCreate.image = 'default.png';
        newShopToCreate.note = '5';
        newShopToCreate.type = type;
        newShopToCreate.ville = 'Paris';
        newShopToCreate.maxDistance = 15;
        newShopToCreate.idUser = idUser;
        newShopToCreate.promo = { active: false, type: '1' };

        newShopToCreate.location = { latitude: this.latitude, longitude: this.longitude };

        // Horaires par défaut
        newShopToCreate.hours = {
            morning: { start: '09:00', end: '12:00' },
            afternoon: { start: '13:00', end: '18:00' }
        };
        newShopToCreate.trad = categoryToSelect.trad;

        // Requête API
        this.shopService.create(newShopToCreate).subscribe({
            next: (data: any) => {
                console.log('Shop créé :', data);

                // ✅ Succès UI
                this.showSuccessToast(this.translate.instant('SUCCESS.SUBSCRIBE_SUCCESS'));

                // Si utilisé dans une modal → on renvoie la donnée créée
                if (this.dialogRef) {
                    this.dialogRef.close(data);
                } else {
                    // Sinon, on peut rediriger si besoin (optionnel)
                    // this.router.navigate(['/profile']);
                }
            },
            error: (error: any) => {
                console.error('Erreur lors de la création du shop :', error);
                this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
                return error;
            },
        });
    }

    // ----------------------------------------
    // 🧪 Placeholder (tu l’avais déjà)
    // ----------------------------------------
    formChecking() { }

    // ----------------------------------------
    // 🔐 Navigation
    // ----------------------------------------
    goToSignUp() {
        try {
            this.router.navigate(['/sign-in']);
        } catch (err) {
            console.error('Erreur goToSignUp :', err);
            this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        }
    }

    // ------------------------------------------------------------
    // ✨ ToastsizyGlam
    // ------------------------------------------------------------
    private showCustomToast(message: string) {
        // ❗️Erreurs → canal “error”
        this.toastr.error(message);
    }

    private showSuccessToast(message: string) {
        // ✅ Succès → canal “success”
        this.toastr.success(message);
    }
}
