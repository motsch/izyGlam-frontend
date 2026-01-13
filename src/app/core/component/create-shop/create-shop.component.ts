import { Component, Inject, OnInit, Optional } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ShopService } from '../../services/shop.service';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';
import { VilleService } from '../../services/ville.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { CountryService } from '../../services/country.service';
import { ShopTemplateService } from '../../services/shop-template.service';

type WizardStep = 0 | 1 | 2 | 3;

@Component({
  selector: 'app-create-shop',
  templateUrl: './create-shop.component.html',
  styleUrls: ['./create-shop.component.scss'],
})
export class CreateShopComponent implements OnInit {

  error: any = {};
  verificationError: any = {};

  me: any = {};
  newShop: any = {};

  isUserConnected = false;
  alreadyProfessionnal = false;

  categories: any[] = [];

  newAddress: any = {};
  deliveryPostalCode = '';
  deliveryPostalCodesList: string[] = [];

  latitude = 0.0;
  longitude = 0.0;

  allCitiesData: any[] = [];
  availableArrondissements: string[] = [];
  selectedCountry = 'France';
  selectedCity: any = {};
  selectedArrondissement = '';
  availableCountries: any[] = [];
  availableCities: any[] = [];
  postalCode = '';

  // ✅ wizard
  wizardOpen = false;
  wizardStep: WizardStep = 0;
  showErrors = false;
  busy = false;

  wizardSteps: Array<{ title: string; subtitle: string; image: string }> = [
    {
      title: 'CREATION_SHOP_WIZARD.S0_TITLE',
      subtitle: 'CREATION_SHOP_WIZARD.S0_SUBTITLE',
      image: 'assets/images/onboarding/shop-0.png',
    },
    {
      title: 'CREATION_SHOP_WIZARD.S1_TITLE',
      subtitle: 'CREATION_SHOP_WIZARD.S1_SUBTITLE',
      image: 'assets/images/onboarding/shop-1.png',
    },
    {
      title: 'CREATION_SHOP_WIZARD.S2_TITLE',
      subtitle: 'CREATION_SHOP_WIZARD.S2_SUBTITLE',
      image: 'assets/images/onboarding/shop-2.png',
    },
    {
      title: 'CREATION_SHOP_WIZARD.S3_TITLE',
      subtitle: 'CREATION_SHOP_WIZARD.S3_SUBTITLE',
      image: 'assets/images/onboarding/shop-3.png',
    },
  ];

  get progressPercent(): number {
    const max = this.wizardSteps.length - 1;
    return Math.round((this.wizardStep / max) * 100);
  }

  createdShopId: string | null = null;

  // Fichiers
  identityDocFile: File | null = null;
  insuranceDocFile: File | null = null;
  kbisDocFile: File | null = null;

  identityDocFileName: string | null = null;
  insuranceDocFileName: string | null = null;
  kbisDocFileName: string | null = null;

  verification: any = null;
  isUploadingDocs = false;

  // Handle
  handleChecking = false;
  handleAvailable: boolean | null = null;

  constructor(
    private userService: UserService,
    private shopService: ShopService,
    private shopTemplateService: ShopTemplateService,
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

  ngOnInit() {
    this.categoryService.getAll().subscribe({
      next: (data: any) => (this.categories = data || []),
      error: () => this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR')),
    });

    // defaults
    this.newShop.companyType = 'coiffure';
    this.newShop.countryIndication = 'FR';

    this.userService.getMe().subscribe({
      next: (data: any) => {
        this.me = { ...data };
        this.isUserConnected = true;
        this.alreadyProfessionnal = this.me.role === 'professionnel' || this.me.role === 'entreprise';
      },
      error: () => {
        this.isUserConnected = false;
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      },
    });

    this.countryService.getAll({ active: true }).subscribe({
      next: (countries: any[]) => (this.availableCountries = countries || []),
      error: (err) => console.error('Erreur pays :', err),
    });
  }

  // ---------------------------
  // Wizard controls
  // ---------------------------
  openWizard() {
    if (!this.isUserConnected || this.alreadyProfessionnal) return;

    this.wizardOpen = true;
    this.wizardStep = 0;
    this.showErrors = false;
    this.error = {};
    this.verificationError = {};
    this.busy = false;

    // reset creation state
    this.createdShopId = null;
    this.verification = null;
  }

  closeWizard() {
    if (this.busy || this.isUploadingDocs) return;
    this.wizardOpen = false;
  }

  prev() {
    console.log("back")
    this.showErrors = false;
    this.wizardStep = (Math.max(0, this.wizardStep - 1) as WizardStep);
  }

  private refreshStepErrorsIfNeeded() {
    // Si l’utilisateur a déjà tenté de continuer (showErrors = true),
    // on peut recalculer proprement pour enlever les erreurs disparues.
    if (this.showErrors) {
      this.validateCurrentStep(true);
    }
  }


  async next() {
    if (this.busy) return;

    this.showErrors = true;
    this.validateCurrentStep();
    if (!this.canContinue()) return;

    // Si on va vers l’étape docs => on s’assure que le shop est créé
    if (this.wizardStep === 2) {
      await this.ensureShopCreated();
      if (!this.createdShopId) return;
    }

    this.showErrors = false;
    this.wizardStep = (Math.min(3, this.wizardStep + 1) as WizardStep);

    // À l'arrivée sur docs : charge le statut
    if (this.wizardStep === 3) {
      this.loadVerificationStatus();
    }
  }

  canContinue(): boolean {
    if (this.wizardStep === 0) return true;

    if (this.wizardStep === 1) {
      return !this.error.name && !this.error.handle && !this.error.companyType;
    }

    if (this.wizardStep === 2) {
      return !this.error.street && !this.error.selectedCountry && !this.error.selectedCity && !this.error.ccvaccepted;
    }

    return true;
  }

  canJumpTo(target: number): boolean {
    if (this.busy) return false;
    if (target <= this.wizardStep) return true;

    // pas de saut en avant si invalide
    for (let i = 0; i < target; i++) {
      this.wizardStep = i as WizardStep;
      this.validateCurrentStep(false);
      if (!this.canContinue()) {
        return false;
      }
    }

    // si on veut aller docs, il faut un shop créé
    if (target === 3 && !this.createdShopId) return false;

    return true;
  }

  goToStep(target: number) {
    if (!this.canJumpTo(target)) return;
    this.showErrors = false;
    this.wizardStep = target as WizardStep;
    if (this.wizardStep === 3) this.loadVerificationStatus();
  }

  hideBrokenImg(ev: Event) {
    const img = ev.target as HTMLImageElement;
    img.style.display = 'none';
  }

  // ---------------------------
  // Step validations
  // ---------------------------
  private validateCurrentStep(setErrors = true) {
    if (!setErrors) {
      // on n’affiche pas les erreurs en mode "check background"
      // mais on calcule quand même pour canJumpTo()
    }

    if (this.wizardStep === 1) {
      if (!this.newShop.name) this.error.name = this.translate.instant('CREATION_SHOP.ERROR1');
      if (!this.newShop.companyType) this.error.companyType = this.translate.instant('CREATION_SHOP.ERROR3');
      if (!this.newShop.handle) {
        this.error.handle = this.translate.instant('CREATION_SHOP_WIZARD.HANDLE_REQUIRED');
      } else if (this.handleAvailable !== true) {
        this.error.handle = this.translate.instant('CREATION_SHOP_WIZARD.HANDLE_NOT_VALID');
      }
    }

    if (this.wizardStep === 2) {
      this.error.street = null;
      this.error.selectedCountry = null;
      this.error.selectedCity = null;
      this.error.ccvaccepted = null;
      this.error.postalCode = null;

      if (!this.newShop.street) this.error.street = this.translate.instant('CREATION_SHOP.ERROR2');
      if (!this.selectedCountry) this.error.selectedCountry = this.translate.instant('CREATION_SHOP.CHOOSE_COUNTRY');
      if (!this.selectedCity || !this.selectedCity.nom) this.error.selectedCity = this.translate.instant('CREATION_SHOP.CHOOSE_CITY');

      if (!this.newShop.ccvaccepted) {
        this.error.ccvaccepted = this.translate.instant('CREATION_SHOP.ERROR8');
      }
    }
  }

  // ---------------------------
  // Ensure shop created before docs
  // ---------------------------
  private async ensureShopCreated(): Promise<void> {
    if (this.createdShopId) return;
    if (!this.me?._id) {
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      return;
    }

    this.busy = true;

    try {
      // 1) Update user role + shopCompany (comme ton submitVerificationDocs)
      const meToUpdate = { ...this.me };
      meToUpdate.shopCompany = this.newShop;
      meToUpdate.role = 'professionnel';

      await new Promise<void>((resolve, reject) => {
        this.userService.update(meToUpdate).subscribe({
          next: (data: any) => {
            this.me = { ...data };
            resolve();
          },
          error: (err: any) => reject(err),
        });
      });

      // 2) Create shop (wrappé en Promise)
      await new Promise<void>((resolve, reject) => {
        const type = this.newShop.companyType;
        const userId = this.me._id;

        this.createShop(type, userId, () => resolve());
      });

      if (!this.createdShopId) {
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    } catch (e) {
      console.error('ensureShopCreated error', e);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    } finally {
      this.busy = false;
    }
  }

  // ---------------------------
  // Keep your existing business methods below
  // (onCountryChange, addPostalCode, removePostalCode, onPostalCodeEntered, onCityChange...)
  // ---------------------------

  onCountryChange() {
    this.postalCode = '';
    this.availableCities = [];
    this.selectedCity = {};
    this.availableArrondissements = [];
    this.selectedArrondissement = '';
    this.newAddress.code_postal = '';
  }

  addPostalCode() {
    try {
      if (!this.deliveryPostalCode) return;

      if (this.deliveryPostalCodesList.includes(this.deliveryPostalCode)) {
        this.error.deliveryPostalCode = this.translate.instant('CREATION_SHOP_WIZARD.POSTAL_DUP');
        return;
      }

      this.villeService.getByPostalCode(this.deliveryPostalCode, this.selectedCountry).subscribe({
        next: (res) => {
          if (Array.isArray(res) && res.length > 0) {
            this.deliveryPostalCodesList.push(this.deliveryPostalCode);
            this.newShop.deliveryPostalCodes = this.deliveryPostalCodesList;
            this.deliveryPostalCode = '';
            this.error.deliveryPostalCode = null;
          } else {
            this.error.deliveryPostalCode = this.translate.instant('CREATION_SHOP_WIZARD.POSTAL_NOT_FOUND');
          }
        },
        error: (err) => {
          console.error(err);
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        },
      });
    } catch (err) {
      console.error(err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  removePostalCode(index: number) {
    this.deliveryPostalCodesList.splice(index, 1);
    this.newShop.deliveryPostalCodes = this.deliveryPostalCodesList;
  }

  onPostalCodeEntered() {
    try {
      if (!this.postalCode || this.postalCode.length < 4) return;

      this.villeService.getByPostalCode(this.postalCode, this.selectedCountry).subscribe({
        next: (cities: any[]) => {
          this.availableCities = cities;
          this.newAddress.code_postal = this.postalCode;

          if (cities.length === 1) {
            this.selectedCity = cities[0];
            this.onCityChange();
          }
        },
        error: (err) => {
          console.error(err);
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        },
      });
    } catch (err) {
      console.error(err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  onCityChange() {
    try {
      const filteredByCity = this.allCitiesData.filter(
        (v) => v.pays === this.selectedCountry && v.city === this.selectedCity.nom
      );

      if (filteredByCity.length > 1) {
        this.availableArrondissements = [...new Set(filteredByCity.map((v) => v.name))];
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
      console.error(err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // ---------------------------
  // Your existing createShop 그대로 유지
  // ---------------------------
  createShop(type: string, idUser: string, onAfterCreate?: () => void): any {
    // ⬇️ garde ton code EXACT (je n’y touche pas)
    const newShopToCreate: any = {};
    newShopToCreate.name = this.newShop.name;
    newShopToCreate.handle = this.newShop.handle;

    newShopToCreate.country =
      this.selectedCountry || this.newShop.country || this.newShop.countryIndication || 'France';

    let categoryToSelect = this.categories.find((x: any) => x.filter === type);

    if (!categoryToSelect) {
      categoryToSelect = { descriptionTrad: 'Description par défaut', trad: 'Autres', filter: type };
    }

    const description = categoryToSelect.descriptionTrad || 'Description par défaut';
    newShopToCreate.description_original = description;
    newShopToCreate.description = description;
    newShopToCreate.filter = categoryToSelect.filter || type;

    newShopToCreate.image = 'default.png';
    newShopToCreate.note = '5';
    newShopToCreate.type = type;

    newShopToCreate.ville = this.selectedCity?.nom || this.newAddress?.city || 'Paris';
    newShopToCreate.district = this.selectedArrondissement || this.newAddress?.district || undefined;

    newShopToCreate.ondaybooking = this.newShop.ondaybooking ?? false;
    newShopToCreate.maxDistance = this.newShop.maxDistance || 15;
    newShopToCreate.idUser = idUser;
    newShopToCreate.services = [];
    newShopToCreate.deliveryPostalCodes = this.deliveryPostalCodesList;
    newShopToCreate.trad = categoryToSelect.trad;
    newShopToCreate.promo = { active: false, type: '1' };
    newShopToCreate.location = { latitude: this.latitude, longitude: this.longitude };
    newShopToCreate.averagePrice = this.newShop.averagePrice || '';
    newShopToCreate.minimumDelay = this.newShop.minimumDelay || '30';

    newShopToCreate.hours = {
      monday: { morning: { start: '09:00', end: '12:00' }, afternoon: { start: '13:00', end: '18:00' }, closed: false },
      tuesday: { morning: { start: '09:00', end: '12:00' }, afternoon: { start: '13:00', end: '18:00' }, closed: false },
      wednesday: { morning: { start: '09:00', end: '12:00' }, afternoon: { start: '13:00', end: '18:00' }, closed: false },
      thursday: { morning: { start: '09:00', end: '12:00' }, afternoon: { start: '13:00', end: '18:00' }, closed: false },
      friday: { morning: { start: '09:00', end: '12:00' }, afternoon: { start: '13:00', end: '18:00' }, closed: false },
      saturday: { morning: { start: '09:00', end: '12:00' }, afternoon: { start: '13:00', end: '18:00' }, closed: false },
      sunday: { morning: { start: '09:00', end: '12:00' }, afternoon: { start: '13:00', end: '18:00' }, closed: false },
    };

    this.shopService.create(newShopToCreate).subscribe({
      next: (data: any) => {
        const createdShop = data?.shop || data;
        this.createdShopId = createdShop?._id || null;

        this.showSuccessToast(this.translate.instant('SUCCESS.SUBSCRIBE_SUCCESS'));

        if (this.dialogRef) {
          this.dialogRef.close(data);
        }

        if (onAfterCreate) onAfterCreate();
      },
      error: (error: any) => {
        console.error(error);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        return error;
      },
    });
  }

  // ---------------------------
  // Docs upload : tu peux garder tel quel
  // ---------------------------
  private loadVerificationStatus(): void {
    if (!this.createdShopId) return;

    this.shopService.getShopVerificationStatus(this.createdShopId).subscribe({
      next: (verification: any) => (this.verification = verification),
      error: (err) => console.error(err),
    });
  }

  onFileSelected(event: Event, type: 'identity' | 'insurance' | 'kbis'): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    if (type === 'identity') {
      this.identityDocFile = file;
      this.identityDocFileName = file.name;
      this.verificationError.identityDoc = null;
    }
    if (type === 'insurance') {
      this.insuranceDocFile = file;
      this.insuranceDocFileName = file.name;
      this.verificationError.insuranceDoc = null;
    }
    if (type === 'kbis') {
      this.kbisDocFile = file;
      this.kbisDocFileName = file.name;
    }
  }

  submitVerificationDocs(): void {
    // ton code fonctionne, mais on s’assure shop créé
    if (!this.createdShopId) {
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      return;
    }

    this.verificationError = {};
    if (!this.identityDocFile) {
      this.verificationError.identityDoc = this.translate.instant('CREATION_SHOP.VERIF_ID_REQUIRED');
    }
    if (!this.insuranceDocFile) {
      this.verificationError.insuranceDoc = this.translate.instant('CREATION_SHOP.VERIF_INSURANCE_REQUIRED');
    }
    if (this.verificationError.identityDoc || this.verificationError.insuranceDoc) return;

    this.isUploadingDocs = true;

    this.shopService.uploadVerificationDocs(this.createdShopId, {
      identityDoc: this.identityDocFile,
      insuranceDoc: this.insuranceDocFile,
      kbisDoc: this.kbisDocFile,
    }).subscribe({
      next: (resp: any) => {
        this.isUploadingDocs = false;
        this.verification = resp?.verification || this.verification;
        this.showSuccessToast(this.translate.instant('CREATION_SHOP.VERIF_TOAST_SUCCESS'));
      },
      error: (err) => {
        this.isUploadingDocs = false;
        console.error(err);
        this.showCustomToast(this.translate.instant('CREATION_SHOP.VERIF_TOAST_ERROR'));
      },
    });
  }

  skipVerification(): void {
    if (this.dialogRef) {
      this.dialogRef.close({ shopId: this.createdShopId, skippedVerification: true });
    } else {
      // libre selon ton flow
      this.finishAndGoLogin();
    }
  }

  finishAndGoLogin() {
    this.wizardOpen = false;
    this.router.navigate(['/login']);
  }

  // ---------------------------
  // Toasts
  // ---------------------------
  private showCustomToast(message: string) {
    this.toastr.error(message);
  }
  private showSuccessToast(message: string) {
    this.toastr.success(message);
  }

  // ---------------------------
  // Status pills (tu avais déjà)
  // ---------------------------
  getStatusLabel(status?: string): string {
    switch (status) {
      case 'pending': return 'CREATION_SHOP.VERIF_STATUS_PENDING';
      case 'approved': return 'CREATION_SHOP.VERIF_STATUS_APPROVED';
      case 'rejected': return 'CREATION_SHOP.VERIF_STATUS_REJECTED';
      case 'missing':
      default: return 'CREATION_SHOP.VERIF_STATUS_MISSING';
    }
  }
  getStatusClass(status?: string): string {
    const value = status || 'missing';
    return `status-${value}`;
  }

  // ---------------------------
  // HANDLE: garde ta logique
  // ---------------------------
  private normalizeHandle(input: any): string {
    const raw = String(input ?? "").trim().replace(/^@+/, "");
    if (!raw) return "";
    const noAccents = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const cleaned = noAccents.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9._]/g, "");
    return cleaned.replace(/^[._]+|[._]+$/g, "");
  }

  onShopNameTyping(value?: string) {
    // le nom change => on nettoie l'erreur du nom
    this.error.name = null;

    // handle auto
    const proposed = this.normalizeHandle(this.newShop.name || "");
    this.newShop.handle = proposed;

    // dès que ça change => handle doit être re-testé
    this.resetHandleValidation();

    // si user avait déjà cliqué "Continuer", on recalc juste pour nettoyer l'UI
    this.refreshStepErrorsIfNeeded();
  }


  resetHandleValidation() {
    this.handleAvailable = null;
    this.handleChecking = false;
    this.error.handle = null;
    this.refreshStepErrorsIfNeeded();
  }


  canTestHandle(): boolean {
    const handle = this.normalizeHandle(this.newShop.handle || "");
    // On exige un minimum + un nom rempli
    return !!this.newShop.name && !!handle && handle.length >= 3;
  }

  testHandle() {
    const handle = this.normalizeHandle(this.newShop.handle || "");
    this.newShop.handle = handle;

    // nettoie l’erreur avant de retester
    this.error.handle = null;
    if (!handle || handle.length < 3) {
      this.handleAvailable = false;
      this.error.handle = this.translate.instant('CREATION_SHOP_WIZARD.HANDLE_MIN');
      // this.refreshStepErrorsIfNeeded();
      return;
    }

    this.handleChecking = true;
    this.handleAvailable = null;

    this.shopService.isHandleAvailable(handle).subscribe({
      next: (res: any) => {
        this.handleChecking = false;
        this.handleAvailable = !!res?.available;

        if (this.handleAvailable) {
          // ✅ super important : on supprime l'erreur précédente
          this.error.handle = null;
        } else {
          this.error.handle = this.translate.instant('CREATION_SHOP_WIZARD.HANDLE_TAKEN');
        }

        this.refreshStepErrorsIfNeeded();
      },
      error: () => {
        this.handleChecking = false;
        this.handleAvailable = null;
        this.error.handle = this.translate.instant('CREATION_SHOP_WIZARD.HANDLE_CHECK_ERROR');
        this.refreshStepErrorsIfNeeded();
      }
    });
  }

  onCompanyTypeChange() {
    this.error.companyType = null;
    this.resetHandleValidation(); // pas obligatoire mais ok si ton handle dépend aussi de la logique
    this.refreshStepErrorsIfNeeded();
  }
}
