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
  legalExpanded = true;              // section ouverte par défaut
  legalValid = false;                // validité du bloc legal
  legalErrors: any = {};             // erreurs par champ

  // ---------- UI / State ----------
  imageUsed: string | null = null;              // URL d’aperçu finale utilisée par l’UI
  imagePreview: string | null = null;           // DataURL temporaire lors d’un upload
  selectedFile: File | null = null;             // Fichier sélectionné
  shopCopyData: any | null = null;              // Copie éditable du shop
  formModified = false;                         // Le formulaire a changé
  formValid = false;                            // Le formulaire est valide

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
  private baseImgUrl = environment.APIimgStorageUrl.replace(/\/$/, ''); // base sans slash final

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
      // Récupérer l'utilisateur depuis la session si pas injecté
      if (!this.me) {
        this.me = this.sessionService.getCurrentUser();
      }

      // Si boss → récupère les employés
      if (this.me?.role === 'boss') {
        this.fetchEmployees();
      }

      // Créneaux autorisés pour les selects d’horaires
      this.allowedMorningHours = this.generateTimeSlots('05:00', '12:00');
      this.allowedAfternoonHours = this.generateTimeSlots('12:00', '23:00');

      localStorage.setItem('menu-param', 'management');

      // Initialisation de la copie éditable si donnée dispo
      if (this.myShopData && Object.keys(this.myShopData).length > 0) {
        this.shopCopyData = { ...this.myShopData };

        // Uniformiser l’URL d’image (chemin relatif -> URL)
        this.imageUsed = this.buildImageUrl(this.shopCopyData.image);

        this.initHoursStructure(); // Normalisation de l’objet hours
        this.initLegalStructure();
        this.validateLegal();

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

  /**
   * S’assure que this.shopCopyData.hours a la structure complète attendue :
   * {
   *   monday: { morning:{start,end}, afternoon:{start,end}, closed:boolean },
   *   ...
   * }
   * Accepte l’ancien format { morning:{}, afternoon:{} } et duplique pour toute la semaine.
   */
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

  /**
   * Génère des créneaux horaires à pas de 30 minutes entre start et end (inclus).
   */
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

  /**
   * Évalue la validité du formulaire de boutique.
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

  /**
   * Marque le formulaire comme modifié, revalide et tente une sauvegarde auto.
   */
  markFormModified(): void {
    try {
      this.formModified = true;
      this.validateForm();
      // Sauvegarde optimiste (si tu préfères un bouton, commente la ligne ci-dessous)
      this.saveShop();
    } catch (err) {
      console.error('[ShopManagement] markFormModified error:', err);
    }
  }

  saveSocial(): void {
    try {
      this.validateForm();
      // Sauvegarde optimiste (si tu préfères un bouton, commente la ligne ci-dessous)
      this.saveShop();
    } catch (err) {
      console.error('[ShopManagement] markFormModified error:', err);
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

      // Doublon ?
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
            this.saveShop(); // persiste
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

      // Aperçu immédiat
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

      this.shopService
        .generateIzyGlamShopDescription(type, userDescription)
        .subscribe({
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

      // On pousse la copie vers l’objet “source” avant envoi
      this.myShopData = { ...this.shopCopyData };

      // Cas 1 : upload image nécessaire, on uploade d’abord
      if (this.selectedFile) {
        this.imageService.uploadImage(this.selectedFile).subscribe({
          next: (response) => {
            // response.imageUrl peut être "uploads/images/xxx.png" ou "/uploads/images/xxx.png"
            const cleaned = (response?.imageUrl || '').replace(/^\/+/, ''); // enlève les "/" au début
            this.myShopData.image = cleaned; // On stocke le chemin relatif normalisé

            this.persistShop('CARD.SALON'); // puis update du shop
          },
          error: (error) => {
            console.error("[ShopManagement] uploadImage error:", error);
            this.showCustomToast(this.t('CARD.ERROR2'), 'error');
          },
        });
        return;
      }

      // Cas 2 : pas d’upload, update direct
      this.persistShop('CARD.UPDATE');
    } catch (err) {
      console.error('[ShopManagement] saveShop error:', err);
      this.showCustomToast(this.t('CARD.ERROR1'), 'error');
    }
  }

  /**
   * Appelle l’API update du Shop et met à jour l’UI/cohérence des données.
   */
  private persistShop(successKey: string): void {
    try {
      this.shopService.update(this.myShopData).subscribe({
        next: (data: any) => {
          // Rafraîchit la copie editable et la source
          this.shopCopyData = { ...data };
          this.myShopData = { ...data };

          // Recalcule l’URL finale d’aperçu
          this.imageUsed = this.buildImageUrl(this.shopCopyData.image);

          // Reset upload preview
          this.imagePreview = null;
          this.selectedFile = null;

          // Émet un événement “update” pour le parent
          this.shopUpdated.emit(this.myShopData._id);

          this.formModified = false;
          this.validateForm();

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

  /**
   * Construit une URL d’image exploitable par l’UI à partir d’un chemin stocké en base.
   * - Accepte “logo.png”, “uploads/images/logo.png”, “/uploads/images/logo.png”.
   * - Retourne “{API}/uploads/images/logo.png”.
   */
  private buildImageUrl(storedPath?: string): string | null {
    try {
      if (!storedPath) return null;
      const clean = storedPath.replace(/^\/+/, ''); // supprime les "/" de début
      // Si le chemin ne commence pas par "uploads/", on le rajoute (défensif)
      const finalPath = clean.startsWith('uploads/') ? clean : `uploads/images/${clean}`;
      return `${this.baseImgUrl}/${finalPath}`;
    } catch (err) {
      console.error('[ShopManagement] buildImageUrl error:', err);
      return null;
    }
  }

  /** i18n safe */
  private t(key: string): string {
    try {
      const tr = this.translate.instant(key);
      return tr && tr !== key ? tr : key;
    } catch {
      return key;
    }
  }

  /** Toast centralisé */
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

      // Crée l'objet legal s'il n'existe pas
      this.shopCopyData.legal = this.shopCopyData.legal || {};

      // Valeurs par défaut
      if (!this.shopCopyData.legal.country) this.shopCopyData.legal.country = 'FR';
    } catch (err) {
      console.error('[ShopManagement] initLegalStructure error:', err);
    }
  }

  onLegalChange(field?: string): void {
    try {
      // Nettoyages légers
      const l = this.shopCopyData?.legal;
      if (!l) return;

      if (field === 'siret' && l.siret) l.siret = this.onlyDigits(l.siret).slice(0, 14);
      if (field === 'siren' && l.siren) l.siren = this.onlyDigits(l.siren).slice(0, 9);

      if (field === 'vatNumber' && l.vatNumber) {
        l.vatNumber = l.vatNumber.toString().toUpperCase().replace(/\s+/g, '');
      }

      if (field === 'phone' && l.phone) {
        l.phone = l.phone.toString().trim();
      }

      if (field === 'email' && l.email) {
        l.email = l.email.toString().trim();
      }

      this.validateLegal();
    } catch (err) {
      console.error('[ShopManagement] onLegalChange error:', err);
    }
  }

  private onlyDigits(v: string): string {
    return (v || '').toString().replace(/\D+/g, '');
  }

  private isValidEmail(email: string): boolean {
    if (!email) return true; // optionnel
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }

  private isValidSiret(siret: string): boolean {
    if (!siret) return true; // optionnel (mais recommandé)
    return /^\d{14}$/.test(this.onlyDigits(siret));
  }

  private isValidSiren(siren: string): boolean {
    if (!siren) return true; // optionnel
    return /^\d{9}$/.test(this.onlyDigits(siren));
  }

  private isValidVat(vat: string): boolean {
    if (!vat) return true; // optionnel
    // Simple check FR... (tu pourras renforcer plus tard)
    return /^FR[A-Z0-9]{2,13}$/i.test(vat.replace(/\s+/g, ''));
  }

  /**
   * Valide le bloc legal.
   * Ici on le rend "utile compta" : si un champ est rempli, on exige la cohérence des autres.
   * Tu peux durcir plus tard (ex: rendre SIRET obligatoire).
   */
  validateLegal(): void {
    try {
      const l = this.shopCopyData?.legal || {};
      this.legalErrors = {};

      // Champs "recommandés" pour documents comptables
      // (on ne bloque pas ton formulaire global, mais on affiche clairement si incomplet)
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

  /**
   * Enregistre uniquement la section légal (pour éviter l'auto-save à chaque frappe).
   */
  saveLegal(): void {
    try {
      this.validateLegal();

      if (!this.legalValid) {
        this.showCustomToast('Merci de corriger les informations légales avant d’enregistrer.', 'error');
        return;
      }

      // On déclenche une sauvegarde complète (car ton update envoie myShopData entier)
      // mais ça sera volontaire via bouton.
      this.saveShop();
      this.showCustomToast('Informations légales enregistrées ✅');
    } catch (err) {
      console.error('[ShopManagement] saveLegal error:', err);
      this.showCustomToast('Erreur lors de l’enregistrement des informations légales.', 'error');
    }
  }

}
