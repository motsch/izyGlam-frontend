// create-shop.component.ts
import { Component, Inject, OnInit, Optional } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ShopService } from '../../services/shop.service';
import { ShopTemplateService } from '../../services/shop-template.service';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';
import { VilleService } from '../../services/ville.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

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

  // 🧾 Erreurs spécifiques au step 2 (docs)
  verificationError: any = {};

  // 👤 Utilisateur courant
  me: any = {};

  // 🏪 Modèle de création de shop (infos step 1)
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

  // Villes / pays
  allCitiesData: any[] = [];
  availableArrondissements: string[] = [];
  selectedCountry = 'France';
  selectedCity: any = {};
  selectedArrondissement = '';
  availableCountries: any[] = [];
  availableCities: any[] = [];
  postalCode: string = '';

  // 🪜 Stepper
  currentStep: 1 | 2 = 1;
  createdShopId: string | null = null;

  // 📂 Fichiers (step 2)
  identityDocFile: File | null = null;
  insuranceDocFile: File | null = null;
  kbisDocFile: File | null = null;

  identityDocFileName: string | null = null;
  insuranceDocFileName: string | null = null;
  kbisDocFileName: string | null = null;

  verification: any = null;
  isUploadingDocs: boolean = false;
  handleChecking = false;
  handleAvailable: boolean | null = null;
  private handleTouchedByUser = false;
  private handleVerifyTimer: any = null;
  private handleVerifySeq = 0;

  constructor(
    private userService: UserService,
    private shopService: ShopService,
    private countryService: CountryService,
    private productService: ProductService,
    private router: Router,
    private villeService: VilleService,
    private categoryService: CategoryService,
    private translate: TranslateService,
    private toastr: ToastrService,
    @Optional() public dialogRef?: MatDialogRef<CreateShopComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: any
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

    // 3) Charger le user connecté
    this.userService.getMe().subscribe({
      next: (data: any) => {
        this.me = { ...data };
        this.isUserConnected = true;
        this.alreadyProfessionnal =
          this.me.role === 'professionnel' || this.me.role === 'entreprise';
      },
      error: (error: any) => {
        console.error('Erreur lors de la récupération du profil utilisateur :', error);
        this.isUserConnected = false;
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      },
    });

    // 4) Récupération des pays activés
    this.countryService.getAll({ active: true }).subscribe({
      next: (countries: any[]) => {
        this.availableCountries = countries;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des pays :', err);
      },
    });
  }

  // ----------------------------------------
  // 🌍 Sélection du pays
  // ----------------------------------------
  onCountryChange() {
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

      if (this.deliveryPostalCodesList.includes(this.deliveryPostalCode)) {
        this.error.deliveryPostalCode = 'Ce code postal est déjà ajouté.';
        return;
      }

      this.villeService
        .getByPostalCode(this.deliveryPostalCode, this.selectedCountry)
        .subscribe({
          next: (res) => {
            if (Array.isArray(res) && res.length > 0) {
              this.deliveryPostalCodesList.push(this.deliveryPostalCode);
              this.newShop.deliveryPostalCodes = this.deliveryPostalCodesList;
              this.deliveryPostalCode = '';
              this.error.deliveryPostalCode = null;
            } else {
              this.error.deliveryPostalCode = 'Code postal introuvable dans la base';
            }
          },
          error: (err) => {
            console.error('Erreur lors de la recherche du code postal :', err);
            this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
          },
        });
    } catch (err) {
      console.error('Erreur addPostalCode :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

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

      this.villeService
        .getByPostalCode(this.postalCode, this.selectedCountry)
        .subscribe({
          next: (cities: any[]) => {
            this.availableCities = cities;
            this.newAddress.code_postal = this.postalCode;

            if (cities.length === 1) {
              this.selectedCity = cities[0];
              this.onCityChange();
            }
          },
          error: (err) => {
            console.error('Erreur lors du chargement des villes par CP :', err);
            this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
          },
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
      const filteredByCity = this.allCitiesData.filter(
        (v) => v.pays === this.selectedCountry && v.city === this.selectedCity.nom
      );

      if (filteredByCity.length > 1) {
        this.availableArrondissements = [
          ...new Set(filteredByCity.map((v) => v.name)),
        ];
        this.newAddress.code_postal = '';
      } else if (filteredByCity.length === 1) {
        const doc = filteredByCity[0];
        this.availableArrondissements = [doc.name];
        this.selectedArrondissement = doc.name;
        this.newAddress.code_postal = doc.code_postal;
        this.latitude = doc.latitude;
        this.longitude = doc.longitude;
      }

      this.newAddress.city = this.selectedCity.nom;
    } catch (err) {
      console.error('Erreur onCityChange :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // ----------------------------------------
  // ✅ Validation du formulaire & passage au Step 2
  // ----------------------------------------
  onSubmit() {
    try {
      if (!this.validateNameWithInitial(this.newShop.name)) {
        this.error.name = 'Le nom doit être au format Michelle T.';
        return;
      } else {
        this.error.name = null;
      }

      if (!this.newShop.street) {
        this.error.street = 'La rue est obligatoire';
        return;
      } else {
        this.error.street = null;
      }

      if (!this.selectedCountry) {
        this.error.selectedCountry = 'Le pays est obligatoire';
        return;
      } else {
        this.error.selectedCountry = null;
      }

      if (!this.selectedCity) {
        this.error.selectedCity = 'La ville est obligatoire';
        return;
      } else {
        this.error.selectedCity = null;
      }

      if (!this.newShop.companyType) {
        this.error.companyType = 'Le type de service proposé est obligatoire';
        return;
      } else {
        this.error.companyType = null;
      }

      // --- HANDLE: obligatoire + doit être validé via bouton ---
      if (!this.newShop.handle) {
        this.error.handle = "Identifiant public obligatoire";
        return;
      }

      // Si pas encore vérifié => on force l’utilisateur à cliquer "Vérifier"
      if (this.handleAvailable !== true) {
        this.error.handle = "Identifiant non validé ou déjà pris.";
        return;
      }

      this.currentStep = 2;
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

  // ----------------------------------------
  // 🏗️ Création du shop côté backend
  //  ⚠️ C'est ICI qu'on ajoute country + filter + ville, etc.
  // ----------------------------------------
  createShop(type: string, idUser: string, onAfterCreate?: () => void): any {
    const newShopToCreate: any = {};

    // Nom du salon (formaté “Prénom N.”)
    newShopToCreate.name = this.newShop.name;
    newShopToCreate.handle = this.newShop.handle;

    // 🔹 Pays requis par le schema (country: String, required: true)
    newShopToCreate.country =
      this.selectedCountry ||
      this.newShop.country ||
      this.newShop.countryIndication ||
      'France';

    // 🔹 Chercher la catégorie correspondante (pour trad / description / filter)
    let categoryToSelect = this.categories.find(
      (x: any) => x.filter === type
    );

    if (!categoryToSelect) {
      console.error('Catégorie non trouvée pour le type :', type);
      categoryToSelect = {
        descriptionTrad: 'Description par défaut',
        trad: 'Autres',
        filter: type,
      };
    }

    const description = categoryToSelect.descriptionTrad || 'Description par défaut';

    // 🔹 Champs de description
    newShopToCreate.description_original = description;
    newShopToCreate.description = description;

    // 🔹 filter requis par le schema (filter: String, required: true)
    newShopToCreate.filter = categoryToSelect.filter || type;

    // Visuels / note
    newShopToCreate.image = 'default.png';
    newShopToCreate.note = '5';

    // Type principal (coiffure, manucure, etc.)
    newShopToCreate.type = type;

    // Ville / district
    newShopToCreate.ville =
      this.selectedCity?.nom ||
      this.newAddress?.city ||
      'Paris';

    newShopToCreate.district =
      this.selectedArrondissement ||
      this.newAddress?.district ||
      undefined;

    // Booking same-day (optionnel)
    newShopToCreate.ondaybooking = this.newShop.ondaybooking ?? false;

    // Distance max
    newShopToCreate.maxDistance = this.newShop.maxDistance || 15;

    // User propriétaire
    newShopToCreate.idUser = idUser;

    // Liste d’IDs de services (le schema autorise un tableau vide)
    newShopToCreate.services = [];

    // Codes postaux de livraison
    newShopToCreate.deliveryPostalCodes = this.deliveryPostalCodesList;

    // Texte traduit lié à la catégorie
    newShopToCreate.trad = categoryToSelect.trad;

    // Promo par défaut
    newShopToCreate.promo = { active: false, type: '1' };

    // Localisation
    newShopToCreate.location = {
      latitude: this.latitude,
      longitude: this.longitude,
    };

    // Prix moyen / délai minimum (facultatifs dans le schema)
    newShopToCreate.averagePrice = this.newShop.averagePrice || '';
    newShopToCreate.minimumDelay = this.newShop.minimumDelay || '30';

    // Horaires par défaut
    newShopToCreate.hours = {
      monday: {
        morning: { start: '09:00', end: '12:00' },
        afternoon: { start: '13:00', end: '18:00' },
        closed: false,
      },
      tuesday: {
        morning: { start: '09:00', end: '12:00' },
        afternoon: { start: '13:00', end: '18:00' },
        closed: false,
      },
      wednesday: {
        morning: { start: '09:00', end: '12:00' },
        afternoon: { start: '13:00', end: '18:00' },
        closed: false,
      },
      thursday: {
        morning: { start: '09:00', end: '12:00' },
        afternoon: { start: '13:00', end: '18:00' },
        closed: false,
      },
      friday: {
        morning: { start: '09:00', end: '12:00' },
        afternoon: { start: '13:00', end: '18:00' },
        closed: false,
      },
      saturday: {
        morning: { start: '09:00', end: '12:00' },
        afternoon: { start: '13:00', end: '18:00' },
        closed: false,
      },
      sunday: {
        morning: { start: '09:00', end: '12:00' },
        afternoon: { start: '13:00', end: '18:00' },
        closed: false,
      },
    };

    // 🔥 Appel backend
    this.shopService.create(newShopToCreate).subscribe({
      next: (data: any) => {
        console.log('Shop créé :', data);

        const createdShop = data?.shop || data;
        this.createdShopId = createdShop?._id || null;

        this.showSuccessToast(this.translate.instant('SUCCESS.SUBSCRIBE_SUCCESS'));

        if (this.dialogRef) {
          this.dialogRef.close(data);
        } else {
          this.loadVerificationStatus();
        }

        if (onAfterCreate) {
          onAfterCreate();
        }
      },
      error: (error: any) => {
        console.error('Erreur lors de la création du shop :', error);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        return error;
      },
    });
  }

  formChecking() { }

  goToSignUp() {
    try {
      this.router.navigate(['/sign-in']);
    } catch (err) {
      console.error('Erreur goToSignUp :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // ------------------------------------------------------------
  // ✨ Toasts izyGlam
  // ------------------------------------------------------------
  private showCustomToast(message: string) {
    this.toastr.error(message);
  }

  private showSuccessToast(message: string) {
    this.toastr.success(message);
  }

  // ------------------------------------------------------------
  // STEP 2 : Upload & statut de vérification
  // ------------------------------------------------------------
  private loadVerificationStatus(): void {
    if (!this.createdShopId) {
      return;
    }
    this.shopService.getShopVerificationStatus(this.createdShopId).subscribe({
      next: (verification: any) => {
        this.verification = verification;
      },
      error: (err) => {
        console.error('Erreur lors du chargement du statut de vérification :', err);
      },
    });
  }

  onFileSelected(event: Event, type: 'identity' | 'insurance' | 'kbis'): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }
    const file = input.files[0];

    switch (type) {
      case 'identity':
        this.identityDocFile = file;
        this.identityDocFileName = file.name;
        this.verificationError.identityDoc = null;
        break;
      case 'insurance':
        this.insuranceDocFile = file;
        this.insuranceDocFileName = file.name;
        this.verificationError.insuranceDoc = null;
        break;
      case 'kbis':
        this.kbisDocFile = file;
        this.kbisDocFileName = file.name;
        break;
    }
  }

  submitVerificationDocs(): void {
    try {
      this.verificationError = {};
      if (!this.identityDocFile) {
        this.verificationError.identityDoc = this.translate.instant(
          'CREATION_SHOP.VERIF_ID_REQUIRED'
        );
      }
      if (!this.insuranceDocFile) {
        this.verificationError.insuranceDoc = this.translate.instant(
          'CREATION_SHOP.VERIF_INSURANCE_REQUIRED'
        );
      }

      if (this.verificationError.identityDoc || this.verificationError.insuranceDoc) {
        return;
      }

      this.isUploadingDocs = true;

      this.me.shopCompany = this.newShop;
      this.me.role = 'professionnel';

      this.userService.update(this.me).subscribe({
        next: (data: any) => {
          this.me = { ...data };

          const type = this.newShop.companyType;
          const userId = this.me._id;

          this.createShop(type, userId, () => {
            if (
              this.createdShopId &&
              (this.identityDocFile || this.insuranceDocFile || this.kbisDocFile)
            ) {
              this.shopService
                .uploadVerificationDocs(this.createdShopId, {
                  identityDoc: this.identityDocFile,
                  insuranceDoc: this.insuranceDocFile,
                  kbisDoc: this.kbisDocFile,
                })
                .subscribe({
                  next: (resp: any) => {
                    this.isUploadingDocs = false;
                    this.verification = resp?.verification || this.verification;
                    this.showSuccessToast(
                      this.translate.instant('CREATION_SHOP.VERIF_TOAST_SUCCESS')
                    );
                  },
                  error: (err) => {
                    this.isUploadingDocs = false;
                    console.error('Erreur lors de l’upload des documents :', err);
                    this.showCustomToast(
                      this.translate.instant('CREATION_SHOP.VERIF_TOAST_ERROR')
                    );
                  },
                });
            } else {
              this.isUploadingDocs = false;
              this.showSuccessToast(
                this.translate.instant('CREATION_SHOP.VERIF_TOAST_SUCCESS')
              );
            }
          });
        },
        error: (error: any) => {
          this.isUploadingDocs = false;
          console.error(
            'Erreur lors de la mise à jour du profil en “professionnel” :',
            error
          );
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        },
      });
    } catch (err) {
      this.isUploadingDocs = false;
      console.error('Erreur submitVerificationDocs :', err);
      this.showCustomToast(
        this.translate.instant('CREATION_SHOP.VERIF_TOAST_ERROR')
      );
    }
  }

  skipVerification(): void {
    if (this.dialogRef) {
      this.dialogRef.close({
        shopId: this.createdShopId,
        skippedVerification: true,
      });
    } else {
      // Tu peux rediriger ou laisser comme ça, selon ton flow
      // this.router.navigate(['/profile']);
    }
  }

  getStatusLabel(status?: string): string {
    switch (status) {
      case 'pending':
        return 'CREATION_SHOP.VERIF_STATUS_PENDING';
      case 'approved':
        return 'CREATION_SHOP.VERIF_STATUS_APPROVED';
      case 'rejected':
        return 'CREATION_SHOP.VERIF_STATUS_REJECTED';
      case 'missing':
      default:
        return 'CREATION_SHOP.VERIF_STATUS_MISSING';
    }
  }

  getStatusClass(status?: string): string {
    const value = status || 'missing';
    return `status-${value}`;
  }

  private normalizeHandle(input: any): string {
    const raw = String(input ?? "").trim().replace(/^@+/, "");
    if (!raw) return "";

    const noAccents = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const cleaned = noAccents
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[^a-z0-9._]/g, "");

    return cleaned.replace(/^[._]+|[._]+$/g, "");
  }

  onShopNameTyping() {
    if (this.handleTouchedByUser) return;

    const proposed = this.normalizeHandle(this.newShop.name || "");
    if (!proposed || proposed === this.newShop.handle) return;

    this.newShop.handle = proposed;
    this.handleAvailable = null;
    this.error.handle = null;

    // auto-check après pause (sans bouton)
    if (this.handleVerifyTimer) clearTimeout(this.handleVerifyTimer);

    if (proposed.length >= 3) {
      this.handleVerifyTimer = setTimeout(() => {
        this.checkHandleAvailabilityOnce(proposed);
      }, 900);
    }
  }

  onHandleTypingLocal(value: string) {
    this.handleTouchedByUser = true;

    const handle = this.normalizeHandle(value);
    this.newShop.handle = handle;

    // reset status (pas validé)
    this.handleAvailable = null;
    this.error.handle = null;

    // stop timer précédent
    if (this.handleVerifyTimer) clearTimeout(this.handleVerifyTimer);

    // garde-fous : pas de check si trop court
    if (!handle || handle.length < 3) {
      this.handleChecking = false;
      return;
    }

    // ✅ auto-check après pause
    this.handleVerifyTimer = setTimeout(() => {
      this.checkHandleAvailabilityOnce(handle);
    }, 900); // tu peux mettre 700-1200 selon ton feeling
  }

  validateHandle() {
    const handle = this.normalizeHandle(this.newShop.handle || "");
    this.newShop.handle = handle;

    if (!handle || handle.length < 3) {
      this.handleAvailable = false;
      this.error.handle = "Minimum 3 caractères.";
      return;
    }

    this.handleChecking = true;
    this.handleAvailable = null;
    this.error.handle = null;

    this.shopService.isHandleAvailable(handle).subscribe({
      next: (res: any) => {
        this.handleChecking = false;
        this.handleAvailable = !!res?.available;

        if (!this.handleAvailable) {
          this.error.handle = "Cet identifiant est déjà utilisé.";
        }
      },
      error: () => {
        this.handleChecking = false;
        this.handleAvailable = null;
        this.error.handle = "Erreur lors de la vérification.";
      },
    });
  }

  private checkHandleAvailabilityOnce(handle: string) {
    // anti-résultats obsolètes
    const seq = ++this.handleVerifySeq;

    this.handleChecking = true;
    this.handleAvailable = null;
    this.error.handle = null;

    this.shopService.isHandleAvailable(handle).subscribe({
      next: (res: any) => {
        // si entre-temps l'utilisateur a retapé, on ignore ce résultat
        if (seq !== this.handleVerifySeq) return;

        this.handleChecking = false;
        this.handleAvailable = !!res?.available;

        if (!this.handleAvailable) {
          this.error.handle = "Cet identifiant est déjà utilisé.";
        }
      },
      error: () => {
        if (seq !== this.handleVerifySeq) return;

        this.handleChecking = false;
        this.handleAvailable = null;
        this.error.handle = "Erreur lors de la vérification.";
      },
    });
  }

}
