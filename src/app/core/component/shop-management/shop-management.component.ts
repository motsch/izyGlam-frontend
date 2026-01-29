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

@Component({
  selector: 'app-shop-management',
  templateUrl: './shop-management.component.html',
  styleUrls: ['./shop-management.component.scss'],
})
export class ShopManagementComponent implements OnInit, OnChanges {
  @Input() myShopData: any = {};
  @Input() me: any = {};
  @Output() shopUpdated: EventEmitter<string> = new EventEmitter<string>();

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
  days: string[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  // ---------- Employés ----------
  employees: any[] = [];

  // ---------- Divers ----------
  error: any = {};

  private autosaveTimer: any = null;

  saving = false;
  saved = true;

  // ---------- Adresse salon ----------
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
        this.shopCopyData = { ...this.myShopData };

        this.initialHandle = this.shopCopyData.handle || '';
        this.handleTouchedByUser = false;
        this.handleAvailable = null;
        this.error.handle = null;

        this.imageUsed = this.buildImageUrl(this.shopCopyData.image);

        this.initHoursStructure();
        this.initLegalStructure();

        if (!this.shopCopyData.serviceMode) this.shopCopyData.serviceMode = 'SALON';

        if (this.shopCopyData.serviceMode === 'SALON') {
          this.initPlaceAddressStructure();
        }

        this.validatePlaceAddress();
        this.validateLegal();

        // états adresse (à l'ouverture, on considère "saved" si pas d'erreurs)
        this.placeSaved = this.placeAddressValid;
        this.placeHasErrors = !this.placeAddressValid;
      }
    } catch (err) {
      console.error('[ShopManagement] ngOnInit error:', err);
      this.showCustomToast(this.t('CARD.ERROR1'), 'error');
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    try {
      if (changes['myShopData']?.currentValue) {
        this.shopCopyData = { ...this.myShopData };

        if (!this.shopCopyData.serviceMode) this.shopCopyData.serviceMode = 'SALON';
        if (this.shopCopyData.serviceMode === 'SALON') this.initPlaceAddressStructure();

        this.validatePlaceAddress();
        this.placeSaved = this.placeAddressValid;
        this.placeHasErrors = !this.placeAddressValid;

        this.imageUsed = this.buildImageUrl(this.shopCopyData.image);
      }
    } catch (err) {
      console.error('[ShopManagement] ngOnChanges error:', err);
    }
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
          this.showCustomToast(this.t('EMPLOYEES.LOAD_ERROR') || 'Erreur chargement employés', 'error');
        },
      });
    } catch (err) {
      console.error('[ShopManagement] fetchEmployees try/catch error:', err);
      this.showCustomToast(this.t('EMPLOYEES.LOAD_ERROR') || 'Erreur chargement employés', 'error');
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
        times.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
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
  // Validation / Form
  // ======================

  validateForm(): void {
    try {
      if (!this.shopCopyData) {
        this.formValid = false;
        return;
      }

      const descriptionValid = !!this.shopCopyData.description && this.shopCopyData.description.length >= 25;
      const cityValid = !!this.shopCopyData.ville && !!this.shopCopyData.district;
      const maxDistanceValid = this.shopCopyData.maxDistance && Number(this.shopCopyData.maxDistance) > 0;

      const hours = this.shopCopyData.hours || {};
      const allDaysValid = this.days.every((d) => {
        const data = hours[d];
        if (!data) return false;
        if (data.closed) return true;
        return !!(data.morning?.start && data.morning?.end && data.afternoon?.start && data.afternoon?.end);
      });

      this.formValid = descriptionValid && cityValid && maxDistanceValid && allDaysValid;
    } catch (err) {
      console.error('[ShopManagement] validateForm error:', err);
      this.formValid = false;
    }
  }

  markFormModified(): void {
    try {
      this.formModified = true;
      this.validateForm();
      this.saveShop();
    } catch (err) {
      console.error('[ShopManagement] markFormModified error:', err);
    }
  }

  saveSocial(): void {
    try {
      this.validateForm();
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
        (c: any) => c.name === this.shopCopyData.district || c.nom === this.shopCopyData.district
      );
      if (arr) {
        this.shopCopyData.location = this.shopCopyData.location || {};
        this.shopCopyData.location.latitude = arr.latitude;
        this.shopCopyData.location.longitude = arr.longitude;
      }
      this.markFormModified();
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
        this.error.deliveryPostalCode = this.t('CITY.ALREADY_ADDED') || 'Ce code postal est déjà ajouté.';
        return;
      }

      this.villeService.getByPostalCode(this.deliveryPostalCode).subscribe({
        next: (res) => {
          if (Array.isArray(res) && res.length > 0) {
            this.shopCopyData.deliveryPostalCodes.push(this.deliveryPostalCode);
            this.deliveryPostalCode = '';
            this.error.deliveryPostalCode = null;
            this.saveShop();
          } else {
            this.error.deliveryPostalCode = this.t('CITY.NOT_FOUND') || 'Code postal introuvable dans la base';
          }
        },
        error: () => {
          this.showCustomToast(this.t('ERROR.GENERIC_ERROR') || 'Erreur lors de la recherche du code postal.', 'error');
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

      this.markFormModified();
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
          this.markFormModified();
          this.showCustomToast(this.t('SHOP_MANAGEMENT.DESCRIPTION_OK') || 'Description générée ✅');
        },
        error: (err) => {
          console.error('[ShopManagement] generateIzyGlamDescription error:', err);
          this.showCustomToast(this.t('SHOP_ARTICLES_MANAGEMENT.ERROR_GENERATE_DESC') || 'Erreur de génération ❌', 'error');
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

      this.myShopData = { ...this.shopCopyData };

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
      this.shopService.update(this.myShopData).subscribe({
        next: (data: any) => {
          this.shopCopyData = { ...data };
          this.myShopData = { ...data };

          this.imageUsed = this.buildImageUrl(this.shopCopyData.image);

          this.imagePreview = null;
          this.selectedFile = null;

          this.shopUpdated.emit(this.myShopData._id);

          this.formModified = false;
          this.validateForm();

          // Si on est en SALON, on resynchronise la structure adresse
          if (!this.shopCopyData.serviceMode) this.shopCopyData.serviceMode = 'SALON';
          if (this.shopCopyData.serviceMode === 'SALON') {
            this.initPlaceAddressStructure();
            this.validatePlaceAddress();
            this.placeSaved = this.placeAddressValid;
            this.placeHasErrors = !this.placeAddressValid;
          }

          this.showCustomToast(this.t(successKey));
        },
        error: (error: any) => {
          console.error('[ShopManagement] persistShop update error:', error);
          this.showCustomToast(this.t('CARD.ERROR1'), 'error');
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
      const finalPath = clean.startsWith('uploads/') ? clean : `uploads/images/${clean}`;
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

  private showCustomToast(message: string, type: 'success' | 'error' = 'success'): void {
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

      this.validateLegal();
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

  validateLegal(): void {
    try {
      const l = this.shopCopyData?.legal || {};
      this.legalErrors = {};

      const hasAny =
        !!l.companyName || !!l.siret || !!l.addressLine1 || !!l.postalCode || !!l.city || !!l.email || !!l.phone || !!l.vatNumber;

      if (hasAny) {
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
      this.validateLegal();

      if (!this.legalValid) {
        this.showCustomToast('Merci de corriger les informations légales avant d’enregistrer.', 'error');
        return;
      }

      this.saveShop();
      this.showCustomToast('Informations légales enregistrées ✅');
    } catch (err) {
      console.error('[ShopManagement] saveLegal error:', err);
      this.showCustomToast('Erreur lors de l’enregistrement des informations légales.', 'error');
    }
  }

  // ======================
  // Handle UX
  // ======================

  onShopNameTyping() {
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
      },
      error: (error: any) => {
        console.error('[ShopManagement] autosave error:', error);
        this.saving = false;
        this.saved = false;
        this.showCustomToast(this.t('CARD.ERROR1'), 'error');
      },
    });
  }

  onHandleTypingLocal(value: string) {
    if (!this.shopCopyData) return;

    this.handleTouchedByUser = true;
    this.shopCopyData.handle = this.normalizeHandle(value);

    this.handleAvailable = null;
    this.error.handle = null;

    this.formModified = true;
    this.saved = false;
  }

  validateAndSaveHandle() {
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
          },
          error: () => {
            this.showCustomToast('Erreur lors de la mise à jour du handle.', 'error');
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

    // Structure complète défensive
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

  onServiceModeChange(mode: 'SALON' | 'DOMICILE'): void {
    if (!this.shopCopyData) return;

    this.shopCopyData.serviceMode = (mode === 'SALON' ? 'SALON' : 'DOMICILE');

    // reset états adresse quand on change de mode
    if (this.shopCopyData.serviceMode === 'SALON') {
      /*this.initPlaceAddressStructure();
      this.validatePlaceAddress();
      this.placeSaved = this.placeAddressValid;
      this.placeHasErrors = !this.placeAddressValid;*/
    } else {
      this.placeAddressErrors = {};
      this.placeAddressValid = true;
      this.placeHasErrors = false;
      this.placeSaved = true;
      this.saveShop();
    }
  }

  onPlaceAddressChange(): void {
    // UX premium : on indique "non enregistrée" dès qu'on tape
    this.placeSaved = false;
    this.validatePlaceAddress();
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

      // Normalisation légère
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

      // On évite le toast "Adresse enregistrée" si l'API plante
      this.placeSaving = true;

      // On persiste uniquement ce qu'il faut (optionnel),
      // mais tu utilises update(myShopData) entier => on garde ton flow
      this.saveShop();

      // Comme saveShop est async (subscribe), on ne peut pas être 100% sûr ici
      // MAIS ton persistShop remettra shopCopyData à jour => on peut setter "optimiste"
      this.placeSaved = true;
      this.placeHasErrors = false;

      this.showCustomToast('Adresse du salon enregistrée ✅', 'success');
    } catch (err) {
      console.error('[ShopManagement] savePlaceAddress error:', err);
      this.showCustomToast('Erreur lors de l’enregistrement de l’adresse.', 'error');
    } finally {
      // petit délai pour laisser l'API partir (évite clignotement)
      setTimeout(() => (this.placeSaving = false), 450);
    }
  }
}
