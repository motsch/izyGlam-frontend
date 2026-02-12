import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  Output,
  EventEmitter,
} from '@angular/core';
import { ShopService } from '../../services/shop.service';
import { ImageService } from '../../services/image.service';
import { environment } from 'src/environments/environment';
import { VilleService } from '../../services/ville.service';
import { ToastrService } from 'ngx-toastr';
import { UserService } from '../../services/user.service';
import { SessionService } from '../../services/session.service';
import { TranslateService } from '@ngx-translate/core';

type ServiceMode = 'SALON' | 'DOMICILE';

export type ShopManagementSnapshot = {
  // ✅ IMPORTANT: pour que le parent puisse commit
  shop?: any;

  // snapshot minimal “step 4”
  shopId?: string;
  image?: string | null;
  description?: string;
  legal?: any;
  hours?: any;
  placeAddress?: any;
  serviceMode?: ServiceMode;

  // états “wizard”
  valid: boolean;
  descriptionValid: boolean;
  legalValid: boolean;
  hoursValid: boolean;
  placeAddressValid?: boolean;
  hasHandleError?: boolean;

  blockedElements?: string[];

  errors?: {
    description?: string | null;
    hours?: string | null;
    legal?: any;
    placeAddress?: any;
  };
};


@Component({
  selector: 'app-shop-management',
  templateUrl: './shop-management.component.html',
  styleUrls: ['./shop-management.component.scss'],
})
export class ShopManagementComponent implements OnInit, OnChanges {
  @Input() myShopData: any = {};
  @Input() me: any = {};
  @Input() stepper: boolean = false;

  @Output() shopUpdated: EventEmitter<string> = new EventEmitter<string>();

  // ✅ wizard: parent veut snapshot + validité
  @Output() snapshotChange: EventEmitter<ShopManagementSnapshot> =
    new EventEmitter<ShopManagementSnapshot>();
  @Output() validityChange = new EventEmitter<{
    valid: boolean;
    formValid: boolean;
    legalValid: boolean;
    hoursValid: boolean;
    placeAddressValid: boolean;
    hasHandleError: boolean;
    blockedElements: string[];
  }>();


  // ---------- Legal / Facturation ----------
  legalExpanded = true;
  legalValid = false;
  legalErrors: any = {};

  // ---------- UI / State ----------
  imageUsed: string | null = null;
  imagePreview: string | null = null;
  selectedFile: File | null = null;

  shopCopyData: any | null = null;
  formModified = false;

  // Form “full page” validity (non-stepper)
  formValid = false;

  // ---------- Localisation ----------
  selectedCountry = 'France';
  selectedCity: any = {};
  selectedArrondissement = '';
  availableCountries = ['France'];
  availableCities: any[] = [];
  postalCode = '';
  deliveryPostalCode = '';

  // ---------- Horaires ----------
  allowedMorningHours: string[] = [];
  allowedAfternoonHours: string[] = [];
  days: string[] = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ];

  // ---------- Employés ----------
  employees: any[] = [];

  // ---------- Divers ----------
  error: any = {};

  private autosaveTimer: any = null;
  saving = false;
  saved = true;

  // ---------- Adresse salon (placeAddress) ----------
  placeAddressErrors: any = {};
  placeAddressValid = true;

  placeSaving = false;
  placeSaved = true;
  placeHasErrors = false;

  // ---------- Handle ----------
  handleChecking = false;
  handleAvailable: boolean | null = null;

  private handleTouchedByUser = false;
  private initialHandle = '';

  private baseImgUrl = environment.APIimgStorageUrl.replace(/\/$/, '');

  constructor(
    private shopService: ShopService,
    private imageService: ImageService,
    private villeService: VilleService,
    private toastr: ToastrService,
    private userService: UserService,
    private sessionService: SessionService,
    private translate: TranslateService
  ) { }

  // ======================
  // Lifecycle
  // ======================

  ngOnInit(): void {
    try {
      if (!this.me) {
        this.me = this.sessionService.getCurrentUser();
      }

      if (this.me?.role === 'boss') {
        this.fetchEmployees();
      }

      this.allowedMorningHours = this.generateTimeSlots('05:00', '12:00');
      this.allowedAfternoonHours = this.generateTimeSlots('12:00', '23:00');

      localStorage.setItem('menu-param', 'management');

      if (this.myShopData && Object.keys(this.myShopData).length > 0) {
        this.bootstrapFromInput(this.myShopData);
      }

      // ✅ initial emit vers wizard
      this.emitValidityAndSnapshot();
    } catch (err) {
      console.error('[ShopManagement] ngOnInit error:', err);
      this.showCustomToast(this.t('CARD.ERROR1'), 'error');
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    try {
      if (changes['myShopData']?.currentValue) {
        this.bootstrapFromInput(changes['myShopData'].currentValue);
        this.emitValidityAndSnapshot();
      }
    } catch (err) {
      console.error('[ShopManagement] ngOnChanges error:', err);
    }
  }

  private bootstrapFromInput(shop: any): void {
    this.shopCopyData = { ...shop };

    this.initialHandle = this.shopCopyData.handle || '';
    this.handleTouchedByUser = false;
    this.handleAvailable = null;
    this.error.handle = null;

    this.imageUsed = this.buildImageUrl(this.shopCopyData.image);

    this.initHoursStructure();
    this.initLegalStructure();

    if (!this.shopCopyData.serviceMode) {
      this.shopCopyData.serviceMode = 'SALON';
    }

    // placeAddress existe peut-être déjà dans la DB : on le laisse,
    // mais en stepper on ne le bloque pas.
    if (this.shopCopyData.serviceMode === 'SALON') {
      this.initPlaceAddressStructure();
    }

    this.validatePlaceAddress();
    this.validateLegal(true);
    this.validateForm(); // full (page)
    // états adresse (à l'ouverture, on considère "saved" si pas d'erreurs)
    this.placeSaved = this.placeAddressValid;
    this.placeHasErrors = !this.placeAddressValid;

    this.formModified = false;
    this.saved = true;
    this.saving = false;
  }

  // ======================
  // Employés
  // ======================

  fetchEmployees(): void {
    try {
      this.userService.getMyEmployees().subscribe({
        next: (users: any[]) => (this.employees = users || []),
        error: (error: any) => {
          console.error('[ShopManagement] fetchEmployees error:', error);
          this.showCustomToast(
            this.t('EMPLOYEES.LOAD_ERROR') || 'Erreur chargement employés',
            'error'
          );
        },
      });
    } catch (err) {
      console.error('[ShopManagement] fetchEmployees try/catch error:', err);
      this.showCustomToast(
        this.t('EMPLOYEES.LOAD_ERROR') || 'Erreur chargement employés',
        'error'
      );
    }
  }

  // ======================
  // Horaires
  // ======================

  initHoursStructure(): void {
    try {
      if (!this.shopCopyData) return;

      const defaultSchedule = {
        morning: { start: '09:00', end: '12:00' },
        afternoon: { start: '13:00', end: '18:00' },
        closed: false,
      };

      const legacy = this.shopCopyData.hours || {};

      // si legacy.monday absent => ancienne structure (morning/afternoon global)
      if (!legacy.monday) {
        const fullWeek: any = {};
        this.days.forEach((day) => {
          fullWeek[day] = {
            morning: legacy.morning || defaultSchedule.morning,
            afternoon: legacy.afternoon || defaultSchedule.afternoon,
            closed: false,
          };
        });
        this.shopCopyData.hours = fullWeek;
      } else {
        // ✅ structure semaine présente : sécurise chaque jour
        this.days.forEach((day) => {
          this.shopCopyData.hours[day] = this.shopCopyData.hours[day] || {
            ...defaultSchedule,
          };

          const d = this.shopCopyData.hours[day];
          d.morning = d.morning || { ...defaultSchedule.morning };
          d.afternoon = d.afternoon || { ...defaultSchedule.afternoon };
          if (typeof d.closed !== 'boolean') d.closed = false;

          // fallback horaires manquants
          if (!d.morning.start) d.morning.start = defaultSchedule.morning.start;
          if (!d.morning.end) d.morning.end = defaultSchedule.morning.end;
          if (!d.afternoon.start)
            d.afternoon.start = defaultSchedule.afternoon.start;
          if (!d.afternoon.end)
            d.afternoon.end = defaultSchedule.afternoon.end;
        });
      }
    } catch (err) {
      console.error('[ShopManagement] initHoursStructure error:', err);
    }
  }

  generateTimeSlots(start: string, end: string): string[] {
    try {
      const times: string[] = [];
      let [h, m] = start.split(':').map(Number);
      const [endH, endM] = end.split(':').map(Number);

      while (h < endH || (h === endH && m <= endM)) {
        times.push(
          `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
        );
        m += 30;
        if (m >= 60) {
          m = 0;
          h++;
        }
      }
      return times;
    } catch (err) {
      console.error('[ShopManagement] generateTimeSlots error:', err);
      return [];
    }
  }

  // ======================
  // Validation / Wizard
  // ======================

  /**
   * ✅ Full validation (page gestion classique)
   * ⚠️ en stepper on ne s’en sert PAS pour bloquer.
   */
  validateForm(): void {
    try {
      if (!this.shopCopyData) {
        this.formValid = false;
        return;
      }

      const descriptionValid =
        !!this.shopCopyData.description && this.shopCopyData.description.length >= 25;

      const cityValid = !!this.shopCopyData.ville && !!this.shopCopyData.district;
      const maxDistanceValid =
        this.shopCopyData.maxDistance && Number(this.shopCopyData.maxDistance) > 0;

      const hoursValid = this.isHoursValid(this.shopCopyData.hours);

      this.formValid = descriptionValid && cityValid && maxDistanceValid && hoursValid;
    } catch (err) {
      console.error('[ShopManagement] validateForm error:', err);
      this.formValid = false;
    }
  }

  /**
   * ✅ Stepper validation (STEP 4) : Photo + Description + Legal + Hours
   * - Photo: non-bloquante (tu peux la laisser optionnelle)
   * - Description: min 25 (bloquante)
   * - Legal: bloquante si formats invalides (SIRET/TVA/email, etc.)
   * - Hours: chaque jour doit être cohérent ou closed
   */
  private computeStepperValidity() {
    const errors: any = {};
    const blockedElements: string[] = [];

    const desc = (this.shopCopyData?.description || '').toString();
    const descriptionValid = desc.trim().length >= 25;
    if (!descriptionValid) {
      errors.description = this.t('SHOP_MANAGEMENT.DESC_INFO') || 'Description trop courte';
      blockedElements.push('Description');
    }

    this.validateLegal(true);
    const legalValid = this.legalValid;
    if (!legalValid) {
      errors.legal = { ...this.legalErrors };
      blockedElements.push('Informations légales');
    }

    const hoursValid = this.isHoursValid(this.shopCopyData?.hours);
    if (!hoursValid) {
      errors.hours = 'Horaires invalides';
      blockedElements.push('Horaires');
    }

    // ✅ NEW: placeAddress obligatoire si SALON
    let placeAddressValid = true;
    if (this.shopCopyData?.serviceMode === 'SALON') {
      this.validatePlaceAddress();
      placeAddressValid = this.placeAddressValid;
      if (!placeAddressValid) {
        errors.placeAddress = { ...this.placeAddressErrors };
        blockedElements.push('Adresse du salon');
      }
    }

    const valid = descriptionValid && legalValid && hoursValid && placeAddressValid;

    return { valid, descriptionValid, legalValid, hoursValid, placeAddressValid, errors, blockedElements };
  }

  private isHoursValid(hours: any): boolean {
    try {
      if (!hours) return false;

      return this.days.every((d) => {
        const data = hours[d];
        if (!data) return false;

        // fermé => OK
        if (data.closed) return true;

        const ms = data.morning?.start;
        const me = data.morning?.end;
        const as = data.afternoon?.start;
        const ae = data.afternoon?.end;

        if (!(ms && me && as && ae)) return false;

        // cohérence start < end
        if (!this.isTimeBefore(ms, me)) return false;
        if (!this.isTimeBefore(as, ae)) return false;

        // optionnel : évite chevauchement matin/aprem (me <= as)
        if (!this.isTimeBeforeOrEqual(me, as)) return false;

        return true;
      });
    } catch (err) {
      console.error('[ShopManagement] isHoursValid error:', err);
      return false;
    }
  }

  private isTimeBefore(a: string, b: string): boolean {
    return this.timeToMinutes(a) < this.timeToMinutes(b);
  }

  private isTimeBeforeOrEqual(a: string, b: string): boolean {
    return this.timeToMinutes(a) <= this.timeToMinutes(b);
  }

  private timeToMinutes(t: string): number {
    const [h, m] = (t || '00:00').split(':').map((x) => Number(x));
    return (h || 0) * 60 + (m || 0);
  }

  private emitValidityAndSnapshot(): void {
    try {
      if (!this.shopCopyData) {
        this.validityChange.emit();
        this.snapshotChange.emit({
          valid: false,
          descriptionValid: false,
          legalValid: false,
          hoursValid: false,
          errors: { description: 'No data' },
        });
        return;
      }

      if (this.stepper) {
        const v = this.computeStepperValidity();

        this.validityChange.emit({
          valid: v.valid,
          formValid: true, // on ne bloque pas sur ton "validateForm" page
          legalValid: v.legalValid,
          hoursValid: v.hoursValid,
          placeAddressValid: v.placeAddressValid,
          hasHandleError: false, // handle pas géré en stepper
          blockedElements: v.blockedElements || [],
        });

        const snap: ShopManagementSnapshot = {
          shopId: this.shopCopyData?._id,
          shop: { ...this.shopCopyData }, // ✅ CRUCIAL

          image: this.shopCopyData?.image || null,
          description: this.shopCopyData?.description || '',
          legal: this.shopCopyData?.legal || {},
          hours: this.shopCopyData?.hours || {},
          placeAddress: this.shopCopyData?.placeAddress || {},
          serviceMode: this.shopCopyData?.serviceMode || 'SALON',

          valid: v.valid,
          descriptionValid: v.descriptionValid,
          legalValid: v.legalValid,
          hoursValid: v.hoursValid,
          placeAddressValid: v.placeAddressValid,

          blockedElements: v.blockedElements || [],
          errors: v.errors,
        };

        this.snapshotChange.emit(snap);
        return;
      }

      // mode normal : on peut quand même émettre un snapshot (non bloquant)
      this.validateForm();
      this.validateLegal(true);

      const snap: ShopManagementSnapshot = {
        shopId: this.shopCopyData?._id,
        image: this.shopCopyData?.image || null,
        description: this.shopCopyData?.description || '',
        legal: this.shopCopyData?.legal || {},
        hours: this.shopCopyData?.hours || {},
        valid: this.formValid && this.legalValid,
        descriptionValid:
          (this.shopCopyData?.description || '').toString().trim().length >= 25,
        legalValid: this.legalValid,
        hoursValid: this.isHoursValid(this.shopCopyData?.hours),
        errors: { legal: { ...this.legalErrors } },
      };

      this.validityChange.emit();
      this.snapshotChange.emit(snap);
    } catch (err) {
      console.error('[ShopManagement] emitValidityAndSnapshot error:', err);
    }
  }

  markFormModified(): void {
    try {
      this.formModified = true;
      this.validateForm();

      // ✅ en stepper, on ne veut pas “bloquer silencieusement” :
      // on émet l’état en live pendant la saisie
      this.emitValidityAndSnapshot();

      this.saveShop();
    } catch (err) {
      console.error('[ShopManagement] markFormModified error:', err);
    }
  }

  saveSocial(): void {
    try {
      this.validateForm();
      this.emitValidityAndSnapshot();
      this.saveShop();
    } catch (err) {
      console.error('[ShopManagement] saveSocial error:', err);
    }
  }

  // ======================
  // Localisation / Codes postaux
  // ======================

  onDistrictChange(): void {
    try {
      if (!this.shopCopyData?.district) return;

      const arr = (this.availableCities || []).find(
        (c: any) =>
          c.name === this.shopCopyData.district || c.nom === this.shopCopyData.district
      );
      if (arr) {
        this.shopCopyData.location = this.shopCopyData.location || {};
        this.shopCopyData.location.latitude = arr.latitude;
        this.shopCopyData.location.longitude = arr.longitude;
      }

      this.formModified = true;
      this.emitValidityAndSnapshot();
      this.saveShop();
    } catch (err) {
      console.error('[ShopManagement] onDistrictChange error:', err);
    }
  }

  onPostalCodeEntered(): void {
    try {
      if (!this.postalCode || this.postalCode.length < 4) return;

      this.villeService.getByPostalCode(this.postalCode, this.selectedCountry).subscribe({
        next: (cities: any[]) => {
          this.availableCities = cities || [];
          if (this.shopCopyData) this.shopCopyData.code_postal = this.postalCode;
          if (cities?.length === 1) this.selectedCity = cities[0];
        },
        error: (err: any) => {
          console.error('[ShopManagement] onPostalCodeEntered error:', err);
          this.showCustomToast(this.t('CARD.ERROR2'), 'error');
        },
      });
    } catch (err) {
      console.error('[ShopManagement] onPostalCodeEntered try/catch error:', err);
    }
  }

  addPostalCode(): void {
    try {
      if (!this.deliveryPostalCode) return;
      this.shopCopyData.deliveryPostalCodes = this.shopCopyData.deliveryPostalCodes || [];

      if (this.shopCopyData.deliveryPostalCodes.includes(this.deliveryPostalCode)) {
        this.error.deliveryPostalCode =
          this.t('CITY.ALREADY_ADDED') || 'Ce code postal est déjà ajouté.';
        return;
      }

      this.villeService.getByPostalCode(this.deliveryPostalCode).subscribe({
        next: (res) => {
          if (Array.isArray(res) && res.length > 0) {
            this.shopCopyData.deliveryPostalCodes.push(this.deliveryPostalCode);
            this.deliveryPostalCode = '';
            this.error.deliveryPostalCode = null;

            this.emitValidityAndSnapshot();
            this.saveShop();
          } else {
            this.error.deliveryPostalCode =
              this.t('CITY.NOT_FOUND') || 'Code postal introuvable dans la base';
          }
        },
        error: () => {
          this.showCustomToast(
            this.t('ERROR.GENERIC_ERROR') ||
            'Erreur lors de la recherche du code postal.',
            'error'
          );
        },
      });
    } catch (err) {
      console.error('[ShopManagement] addPostalCode error:', err);
      this.showCustomToast(this.t('ERROR.GENERIC_ERROR'), 'error');
    }
  }

  removePostalCode(index: number): void {
    try {
      if (!this.shopCopyData?.deliveryPostalCodes) return;
      this.shopCopyData.deliveryPostalCodes.splice(index, 1);

      this.emitValidityAndSnapshot();
      this.saveShop();
    } catch (err) {
      console.error('[ShopManagement] removePostalCode error:', err);
    }
  }

  // ======================
  // Upload d’image
  // ======================

  onFileSelected(event: any): void {
    try {
      const file: File = event?.target?.files?.[0];
      if (!file) return;

      this.selectedFile = file;

      const reader = new FileReader();
      reader.onload = () => (this.imagePreview = reader.result as string);
      reader.readAsDataURL(file);

      // image change => on sauvegarde
      this.formModified = true;
      this.emitValidityAndSnapshot();
      this.saveShop();
    } catch (err) {
      console.error('[ShopManagement] onFileSelected error:', err);
    }
  }

  // ======================
  // Génération IA (description boutique)
  // ======================

  generateIzyGlamDescription(): void {
    try {
      const type = this.shopCopyData?.type;
      const userDescription = this.shopCopyData?.description || null;

      if (!type) {
        console.warn('[ShopManagement] generateIzyGlamDescription: missing type');
        return;
      }

      this.shopService.generateIzyGlamShopDescription(type, userDescription).subscribe({
        next: (description: string) => {
          if (!this.shopCopyData) return;
          this.shopCopyData.description = description || '';
          this.formModified = true;

          this.emitValidityAndSnapshot();
          this.saveShop();

          this.showCustomToast(
            this.t('SHOP_MANAGEMENT.DESCRIPTION_OK') || 'Description générée ✅'
          );
        },
        error: (err) => {
          console.error('[ShopManagement] generateIzyGlamDescription error:', err);
          this.showCustomToast(
            this.t('SHOP_ARTICLES_MANAGEMENT.ERROR_GENERATE_DESC') ||
            'Erreur de génération ❌',
            'error'
          );
        },
      });
    } catch (err) {
      console.error('[ShopManagement] generateIzyGlamDescription try/catch error:', err);
      this.showCustomToast(this.t('ERROR.GENERIC_ERROR'), 'error');
    }
  }

  // ======================
  // Sauvegarde
  // ======================

  saveShop(): void {
    try {
      if (!this.shopCopyData) return;

      // ✅ STEPper: jamais de PUT, jamais d’upload
      if (this.isStepperMode()) {
        this.emitValidityAndSnapshot(); // on remonte l’état au parent
        return;
      }

      this.myShopData = { ...this.shopCopyData };
      this.emitValidityAndSnapshot();

      if (this.selectedFile) {
        this.imageService.uploadImage(this.selectedFile).subscribe({
          next: (response) => {
            const cleaned = (response?.imageUrl || '').replace(/^\/+/, '');
            this.myShopData.image = cleaned;
            this.persistShop('CARD.SALON');
          },
          error: (error) => {
            console.error('[ShopManagement] uploadImage error:', error);
            this.showCustomToast(this.t('CARD.ERROR2'), 'error');
          },
        });
        return;
      }

      this.persistShop('CARD.UPDATE');
    } catch (err) {
      console.error('[ShopManagement] saveShop error:', err);
      this.showCustomToast(this.t('CARD.ERROR1'), 'error');
    }
  }

  private persistShop(successKey: string): void {
    try {
      if (!this.myShopData?._id) {
        // en wizard, si jamais on passe un shop “draft” sans _id, on évite de crasher
        console.warn('[ShopManagement] persistShop: missing _id');
      }

      this.shopService.update(this.myShopData).subscribe({
        next: (data: any) => {
          this.shopCopyData = { ...data };
          this.myShopData = { ...data };

          this.imageUsed = this.buildImageUrl(this.shopCopyData.image);

          this.imagePreview = null;
          this.selectedFile = null;

          if (this.myShopData?._id) {
            this.shopUpdated.emit(this.myShopData._id);
          }

          this.formModified = false;

          // structures + validations
          if (!this.shopCopyData.serviceMode)
            this.shopCopyData.serviceMode = 'SALON';

          this.initHoursStructure();
          this.initLegalStructure();
          if (this.shopCopyData.serviceMode === 'SALON') {
            this.initPlaceAddressStructure();
            this.validatePlaceAddress();
            this.placeSaved = this.placeAddressValid;
            this.placeHasErrors = !this.placeAddressValid;
          }

          this.validateLegal(true);
          this.validateForm();

          // ✅ re-emit wizard snapshot/validité après save
          this.emitValidityAndSnapshot();

          // toast only (ton flow)
          this.showCustomToast(this.t(successKey));
        },
        error: (error: any) => {
          console.error('[ShopManagement] persistShop update error:', error);
          this.showCustomToast(this.t('CARD.ERROR1'), 'error');

          // ✅ même en erreur, on remonte l’état actuel
          this.emitValidityAndSnapshot();
        },
      });
    } catch (err) {
      console.error('[ShopManagement] persistShop try/catch error:', err);
      this.showCustomToast(this.t('CARD.ERROR1'), 'error');
    }
  }

  // ======================
  // Helpers
  // ======================

  private buildImageUrl(storedPath?: string): string | null {
    try {
      if (!storedPath) return null;
      const clean = storedPath.replace(/^\/+/, '');
      const finalPath = clean.startsWith('uploads/')
        ? clean
        : `uploads/images/${clean}`;
      return `${this.baseImgUrl}/${finalPath}`;
    } catch (err) {
      console.error('[ShopManagement] buildImageUrl error:', err);
      return null;
    }
  }

  private t(key: string): string {
    try {
      const tr = this.translate.instant(key);
      return tr && tr !== key ? tr : key;
    } catch {
      return key;
    }
  }

  private showCustomToast(
    message: string,
    type: 'success' | 'error' = 'success'
  ): void {
    try {
      if (type === 'success') this.toastr.success(message);
      else this.toastr.error(message);
    } catch (err) {
      console.warn('[ShopManagement] showCustomToast warn:', err, message);
    }
  }

  // ======================
  // Legal / Facturation
  // ======================

  private initLegalStructure(): void {
    try {
      if (!this.shopCopyData) return;
      this.shopCopyData.legal = this.shopCopyData.legal || {};
      if (!this.shopCopyData.legal.country) this.shopCopyData.legal.country = 'FR';
    } catch (err) {
      console.error('[ShopManagement] initLegalStructure error:', err);
    }
  }

  onLegalChange(field?: string): void {
    try {
      const l = this.shopCopyData?.legal;
      if (!l) return;

      if (field === 'siret' && l.siret) l.siret = this.onlyDigits(l.siret).slice(0, 14);
      if (field === 'siren' && l.siren) l.siren = this.onlyDigits(l.siren).slice(0, 9);

      if (field === 'vatNumber' && l.vatNumber) {
        l.vatNumber = l.vatNumber.toString().toUpperCase().replace(/\s+/g, '');
      }

      if (field === 'phone' && l.phone) l.phone = l.phone.toString().trim();
      if (field === 'email' && l.email) l.email = l.email.toString().trim();

      this.validateLegal(true);
      this.emitValidityAndSnapshot();
    } catch (err) {
      console.error('[ShopManagement] onLegalChange error:', err);
    }
  }

  private onlyDigits(v: string): string {
    return (v || '').toString().replace(/\D+/g, '');
  }

  private isValidEmail(email: string): boolean {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  private isValidSiret(siret: string): boolean {
    if (!siret) return true;
    return /^\d{14}$/.test(this.onlyDigits(siret));
  }

  private isValidSiren(siren: string): boolean {
    if (!siren) return true;
    return /^\d{9}$/.test(this.onlyDigits(siren));
  }

  private isValidVat(vat: string): boolean {
    if (!vat) return true;
    return /^FR[A-Z0-9]{2,13}$/i.test(vat.replace(/\s+/g, ''));
  }



  validateLegal(strict: boolean = false): void {
    try {
      const l = this.shopCopyData?.legal || {};
      this.legalErrors = {};

      const hasAny =
        !!l.companyName ||
        !!l.siret ||
        !!l.addressLine1 ||
        !!l.postalCode ||
        !!l.city ||
        !!l.email ||
        !!l.phone ||
        !!l.vatNumber;

      // ✅ STEP 4 (strict) => obligatoire même si vide
      if (strict && !hasAny) {
        this.legalErrors.companyName = 'Raison sociale obligatoire';
        this.legalErrors.addressLine1 = 'Adresse obligatoire';
        this.legalErrors.postalCode = 'Code postal obligatoire';
        this.legalErrors.city = 'Ville obligatoire';
      }

      // mode "soft" => seulement si l’utilisateur a commencé
      if (!strict && hasAny) {
        if (!l.companyName) this.legalErrors.companyName = 'Raison sociale recommandée';
        if (!l.addressLine1) this.legalErrors.addressLine1 = 'Adresse pro recommandée';
        if (!l.postalCode) this.legalErrors.postalCode = 'Code postal recommandé';
        if (!l.city) this.legalErrors.city = 'Ville recommandée';
      }

      if (!this.isValidSiret(l.siret)) this.legalErrors.siret = 'SIRET invalide (14 chiffres)';
      if (!this.isValidSiren(l.siren)) this.legalErrors.siren = 'SIREN invalide (9 chiffres)';
      if (!this.isValidVat(l.vatNumber)) this.legalErrors.vatNumber = 'TVA invalide (ex: FRXX...)';
      if (!this.isValidEmail(l.email)) this.legalErrors.email = 'Email invalide';

      this.legalValid = Object.keys(this.legalErrors).length === 0;
    } catch (err) {
      console.error('[ShopManagement] validateLegal error:', err);
      this.legalValid = false;
    }
  }

  saveLegal(): void {
    try {
      this.validateLegal(true);
      this.emitValidityAndSnapshot();

      if (!this.legalValid) {
        this.showCustomToast(
          'Merci de corriger les informations légales avant d’enregistrer.',
          'error'
        );
        return;
      }

      this.saveShop();
      this.showCustomToast('Informations légales enregistrées ✅', 'success');
    } catch (err) {
      console.error('[ShopManagement] saveLegal error:', err);
      this.showCustomToast(
        'Erreur lors de l’enregistrement des informations légales.',
        'error'
      );
    }
  }

  // ======================
  // Handle UX (non-stepper)
  // ======================

  onShopNameTyping() {
    // en stepper, tu ne gères pas le handle ici => on ignore ce flow
    if (this.stepper) return;

    if (!this.handleTouchedByUser && this.shopCopyData) {
      const proposed = this.normalizeHandle(this.shopCopyData.name || '');
      if (proposed && proposed !== this.shopCopyData.handle) {
        this.shopCopyData.handle = proposed;
        this.handleAvailable = null;
        this.error.handle = null;
      }
    }

    this.formModified = true;
    this.saved = false;

    if (this.me?.role !== 'boss') return;

    if (this.autosaveTimer) clearTimeout(this.autosaveTimer);

    this.autosaveTimer = setTimeout(() => {
      this.autosave();
    }, 800);
  }

  private autosave() {
    if (!this.shopCopyData) return;
    if (!this.formModified) return;

    this.saving = true;
    this.myShopData = { ...this.shopCopyData };

    this.shopService.update(this.myShopData).subscribe({
      next: (data: any) => {
        this.shopCopyData = { ...data };
        this.myShopData = { ...data };
        this.imageUsed = this.buildImageUrl(this.shopCopyData.image);

        this.formModified = false;
        this.saved = true;
        this.saving = false;

        this.emitValidityAndSnapshot();
      },
      error: (error: any) => {
        console.error('[ShopManagement] autosave error:', error);
        this.saving = false;
        this.saved = false;
        this.showCustomToast(this.t('CARD.ERROR1'), 'error');
        this.emitValidityAndSnapshot();
      },
    });
  }

  onHandleTypingLocal(value: string) {
    // en stepper, tu ne gères pas le handle
    if (this.stepper) return;

    if (!this.shopCopyData) return;

    this.handleTouchedByUser = true;
    this.shopCopyData.handle = this.normalizeHandle(value);

    this.handleAvailable = null;
    this.error.handle = null;

    this.formModified = true;
    this.saved = false;
  }

  validateAndSaveHandle() {
    // en stepper, tu ne gères pas le handle
    if (this.stepper) return;

    if (!this.shopCopyData) return;

    const handle = this.normalizeHandle(this.shopCopyData.handle || '');
    this.shopCopyData.handle = handle;

    if (!handle || handle.length < 3) {
      this.handleAvailable = false;
      this.error.handle = 'Minimum 3 caractères.';
      return;
    }

    this.handleChecking = true;
    this.handleAvailable = null;
    this.error.handle = null;

    this.shopService.isHandleAvailable(handle).subscribe({
      next: (res: any) => {
        const available = !!res?.available;

        this.handleChecking = false;
        this.handleAvailable = available;

        if (!available) {
          this.error.handle = 'Cet identifiant est déjà utilisé.';
          return;
        }

        this.shopService.update({ _id: this.shopCopyData._id, handle }).subscribe({
          next: (data: any) => {
            this.shopCopyData = { ...this.shopCopyData, ...data };
            this.myShopData = { ...this.shopCopyData };

            this.initialHandle = this.shopCopyData.handle || '';
            this.handleTouchedByUser = false;

            this.formModified = false;
            this.saved = true;

            this.showCustomToast('Identifiant public mis à jour ✅', 'success');
            this.emitValidityAndSnapshot();
          },
          error: () => {
            this.showCustomToast('Erreur lors de la mise à jour du handle.', 'error');
            this.emitValidityAndSnapshot();
          },
        });
      },
      error: (err: any) => {
        this.handleChecking = false;
        this.handleAvailable = null;

        if (err?.status === 429) {
          this.error.handle = 'Trop de requêtes. Réessaie dans 2 secondes.';
        } else {
          this.error.handle = 'Erreur lors de la vérification.';
        }
        this.emitValidityAndSnapshot();
      },
    });
  }

  normalizeHandle(input: string): string {
    const raw = (input || '').trim().replace(/^@+/, '');
    if (!raw) return '';

    const noAccents = raw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    const cleaned = noAccents
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9._]/g, '');

    return cleaned.replace(/^[._]+|[._]+$/g, '');
  }

  // ======================
  // Service Mode + Place Address
  // ======================

  private initPlaceAddressStructure(): void {
    if (!this.shopCopyData) return;

    this.shopCopyData.placeAddress = this.shopCopyData.placeAddress || {
      label: '',
      addressLine1: '',
      addressLine2: '',
      postalCode: '',
      city: '',
      country: 'FR',
    };

    if (!this.shopCopyData.placeAddress.country) this.shopCopyData.placeAddress.country = 'FR';
  }

  onServiceModeChange(mode: ServiceMode): void {
    if (!this.shopCopyData) return;

    this.shopCopyData.serviceMode = mode === 'SALON' ? 'SALON' : 'DOMICILE';

    // ⚠️ en stepper : tu ne traites PAS l’adresse SALON => on ne bloque pas le wizard
    if (this.shopCopyData.serviceMode === 'SALON') {
      this.initPlaceAddressStructure();
      this.validatePlaceAddress();
      this.placeSaved = this.placeAddressValid;
      this.placeHasErrors = !this.placeAddressValid;
      // on ne force pas de save ici, l’utilisateur clique
    } else {
      this.placeAddressErrors = {};
      this.placeAddressValid = true;
      this.placeHasErrors = false;
      this.placeSaved = true;
      this.saveShop();
    }

    this.emitValidityAndSnapshot();
  }

  onPlaceAddressChange(): void {
    this.placeSaved = false;
    this.validatePlaceAddress();
    this.emitValidityAndSnapshot();
  }

  private validatePlaceAddress(): void {
    try {
      const a = this.shopCopyData?.placeAddress || {};
      this.placeAddressErrors = {};

      if (this.shopCopyData?.serviceMode !== 'SALON') {
        this.placeAddressValid = true;
        this.placeHasErrors = false;
        return;
      }

      const addressLine1 = (a.addressLine1 || '').trim();
      const postalCode = (a.postalCode || '').trim();
      const city = (a.city || '').trim();
      const country = (a.country || 'FR').toString().trim().toUpperCase();

      a.country = country || 'FR';
      a.postalCode = postalCode.replace(/\s+/g, '').toUpperCase();

      if (!addressLine1 || addressLine1.length < 5) {
        this.placeAddressErrors.addressLine1 = 'Adresse invalide';
      }
      if (!a.postalCode || a.postalCode.length < 4) {
        this.placeAddressErrors.postalCode = 'Code postal invalide';
      }
      if (!city || city.length < 2) {
        this.placeAddressErrors.city = 'Ville invalide';
      }

      this.placeAddressValid = Object.keys(this.placeAddressErrors).length === 0;
      this.placeHasErrors = !this.placeAddressValid;
    } catch (err) {
      console.error('[ShopManagement] validatePlaceAddress error:', err);
      this.placeAddressValid = false;
      this.placeHasErrors = true;
    }
  }

  savePlaceAddress(): void {
    try {
      this.validatePlaceAddress();

      if (!this.placeAddressValid) {
        this.showCustomToast('Merci de corriger l’adresse du salon.', 'error');
        return;
      }

      if (!this.shopCopyData) return;

      this.placeSaving = true;

      this.saveShop();

      this.placeSaved = true;
      this.placeHasErrors = false;

      this.showCustomToast('Adresse du salon enregistrée ✅', 'success');
    } catch (err) {
      console.error('[ShopManagement] savePlaceAddress error:', err);
      this.showCustomToast('Erreur lors de l’enregistrement de l’adresse.', 'error');
    } finally {
      setTimeout(() => (this.placeSaving = false), 450);
      this.emitValidityAndSnapshot();
    }
  }

  private isStepperMode(): boolean {
    return !!this.stepper;
  }
}
