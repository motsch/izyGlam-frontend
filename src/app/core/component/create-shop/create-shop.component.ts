import { Component, Inject, OnInit, Optional, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

// Services métier
import { UserService } from '../../services/user.service';
import { ShopService } from '../../services/shop.service';
import { CategoryService } from '../../services/category.service';
import { VilleService } from '../../services/ville.service';
import { CountryService } from '../../services/country.service';
import { ProductService } from '../../services/product.service';

// ✅ Auth existante (sign-in)
import { AuthenticationService } from 'src/app/core/services/authentication.service';
import { SessionService } from 'src/app/core/services/session.service';

// ✅ comme dans ton signup
import { v4 as uuidv4 } from 'uuid';
import { StripeService } from '../../services/stripe.service';
import { CreateShopDraft, WizardDraftService } from '../../services/wizard-draft.service';

// ✅ NEW: child step 4
import { ShopManagementComponent, ShopManagementSnapshot } from '../shop-management/shop-management.component';
import { BookingCategoryService } from '../../services/booking-category.service';
import { CalendarSyncService } from '../../services/calendar-sync.service';
import { finalize } from 'rxjs';

type WizardStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
type ServiceMode = 'SALON' | 'DOMICILE';

/**
 * ✅ Type local SAFE (car ShopManagementSnapshot ne déclare pas forcément validity)
 * -> évite l’erreur TS "Property 'validity' does not exist"
 */
type ShopManagementValidity = {
  formValid: boolean;
  legalValid: boolean;
  hoursValid?: boolean;
  placeAddressValid?: boolean;
  hasHandleError?: boolean;
  blockedElements?: string[]; // ✅ pour l’UI "éléments bloqués"
};

@Component({
  selector: 'app-create-shop',
  templateUrl: './create-shop.component.html',
  styleUrls: ['./create-shop.component.scss'],
})
export class CreateShopComponent implements OnInit {

  // ✅ NEW: reference du composant Step 4
  @ViewChild(ShopManagementComponent) shopManagementCmp?: ShopManagementComponent;

  // ✅ NEW: snapshots step 4 (pour draft + blocage)
  shopManagementSnapshot: any | null = null;
  shopManagementValidity: any | null = null;

  // ============================================================
  // ERREURS (pour afficher sous les champs)
  // ============================================================
  error: any = {};              // erreurs steps shop/adresse/docs
  authError: any = {};          // erreurs step auth
  verificationError: any = {};  // erreurs docs

  // ============================================================
  // DATA USER / SHOP
  // ============================================================
  me: any = {};                 // user connecté (si token)
  newShop: any = {};            // data shop en cours

  isUserConnected = false;
  alreadyProfessionnal = false;

  categories: any[] = [];
  // ✅ image FIXE en haut à gauche, ne bouge jamais
  wizardHeaderImage = 'assets/images/logo.png';

  // ============================================================
  // AUTH STEP (STEP 1)
  // ============================================================
  authUser: any = {
    email: '',
    password: '',
    passwordConfirmed: '',
    firstname: '',
    lastname: '',
    phone: '',
    sex: 'female',
    country: 'France',
  };

  /**
   * null = pas encore check
   * true = email existe
   * false = email inconnu -> register
   */
  authEmailExists: boolean | null = null;

  // UI show/hide password
  authPasswordVisible = false;
  authPasswordVisible2 = false;

  // ✅ nouveau : après register, on attend validation email
  pendingEmailVerification = false;
  icsUrl = "ics lien";
  icsLoading = false;

  // ✅ spinner refresh activation
  checkingActivation = false;

  // ============================================================
  // ADRESSE / ZONES
  // ============================================================
  newAddress: any = {};
  deliveryPostalCode = '';
  deliveryPostalCodesList: string[] = [];

  latitude = 0.0;
  longitude = 0.0;

  allCitiesData: any[] = [];
  availableArrondissements: string[] = [];
  selectedCountry: string = 'France';

  selectedCity: any = {};
  selectedArrondissement = '';
  availableCountries: any[] = [];
  countries: any[] = [];
  availableCities: any[] = [];
  postalCode = '';

  // ============================================================
  // WIZARD
  // ============================================================
  wizardOpen = false;
  wizardStep: WizardStep = 0;
  showErrors = false;
  busy = false;

  wizardSteps: Array<{ title: string; subtitle: string }> = [
    { title: 'CREATION_SHOP_WIZARD.S0_TITLE', subtitle: 'CREATION_SHOP_WIZARD.S0_SUBTITLE' },
    { title: 'CREATION_SHOP_WIZARD.AUTH_TITLE', subtitle: 'CREATION_SHOP_WIZARD.AUTH_SUBTITLE' },
    { title: 'CREATION_SHOP_WIZARD.S1_TITLE', subtitle: 'CREATION_SHOP_WIZARD.S1_SUBTITLE' },
    { title: 'CREATION_SHOP_WIZARD.S2_TITLE', subtitle: 'CREATION_SHOP_WIZARD.S2_SUBTITLE' },
    { title: 'CREATION_SHOP_WIZARD.S3_TITLE', subtitle: 'CREATION_SHOP_WIZARD.S3_SUBTITLE' },
    { title: 'CREATION_SHOP_WIZARD.S4_TITLE', subtitle: 'CREATION_SHOP_WIZARD.S4_SUBTITLE' },
    { title: 'CREATION_SHOP_WIZARD.S5_TITLE', subtitle: 'CREATION_SHOP_WIZARD.S5_SUBTITLE' },
    { title: 'CREATION_SHOP_WIZARD.S6_TITLE', subtitle: 'CREATION_SHOP_WIZARD.S6_SUBTITLE' },
    { title: 'CREATION_SHOP_WIZARD.S7_TITLE', subtitle: 'CREATION_SHOP_WIZARD.S7_SUBTITLE' },
    { title: 'CREATION_SHOP_WIZARD.S8_TITLE', subtitle: 'CREATION_SHOP_WIZARD.S8_SUBTITLE' },
  ];

  get progressPercent(): number {
    const max = this.wizardSteps.length - 1;
    return Math.round((this.wizardStep / max) * 100);
  }

  createdShopId: string | null = null;
  createdShopData: any | null = null;
  myArticlesData: any[] = [];

  // ============================================================
  // DOCS
  // ============================================================
  identityDocFile: File | null = null;
  insuranceDocFile: File | null = null;
  kbisDocFile: File | null = null;


  identityDocFileName: string | null = null;
  insuranceDocFileName: string | null = null;
  kbisDocFileName: string | null = null;

  verification: any = null;
  isUploadingDocs = false;
  shopCategoriesCount = 0;
  stripeLoading = false;
  lastActivationCheckAt: string | null = null;


  // ============================================================
  // HANDLE
  // ============================================================
  handleChecking = false;
  handleAvailable: boolean | null = null;

  // ============================================================
  // ✅ STEP 4 EVENTS (snapshots + validity)
  // ============================================================

  private extractValidityFromSnapshot(snap: any): ShopManagementValidity | null {
    if (!snap) return null;
    // snap.validity peut exister en runtime même si le type TS ne le déclare pas
    const v = (snap as any)?.validity;
    if (!v) return null;
    return {
      formValid: !!v.formValid,
      legalValid: !!v.legalValid,
      hoursValid: v.hoursValid === undefined ? undefined : !!v.hoursValid,
      placeAddressValid: v.placeAddressValid === undefined ? undefined : !!v.placeAddressValid,
      hasHandleError: v.hasHandleError === undefined ? undefined : !!v.hasHandleError,
      blockedElements: Array.isArray(v.blockedElements) ? v.blockedElements : undefined,
    };
  }



  // ============================================================
  // ✅ STEP 5 EVENTS (DOCUMENTS + sending)
  // ============================================================
  private areAllDocsUploaded(v: any): boolean {
    return !!v?.identity?.file && !!v?.insurance?.file && !!v?.kbis?.file;
  }

  private getMissingDocsMessage(v: any): string {
    const missing: string[] = [];
    if (!v?.identity?.file) missing.push("Pièce d’identité");
    if (!v?.insurance?.file) missing.push("Assurance");
    if (!v?.kbis?.file) missing.push("KBIS");
    return missing.length ? `Documents manquants : ${missing.join(', ')}.` : '';
  }


  // ============================================================
  // ✅ STEP 6 EVENTS (CATEGORIES + At least one)
  // ============================================================


  private getCategoriesCountAsync(shopId: string): Promise<number> {
    return new Promise((resolve) => {
      this.bookingCategoryService.getBookingCategoryByShopId(shopId).subscribe({
        next: (cats) => resolve((cats || []).length),
        error: (err) => {
          console.error('[Wizard S6] getBookingCategoryByShopId ERROR:', err);
          resolve(-1); // -1 = erreur réseau/serveur
        },
      });
    });
  }

  // ============================================================
  // ✅ STEP 8 EVENTS (Stripe KYC)
  // ============================================================

  private isStripeReady(me: any): boolean {
    return !!me?.stripe?.chargesEnabled && !!me?.stripe?.payoutsEnabled;
  }

  private getStripeBlockedMessage(me: any): string {
    const missing: string[] = [];
    if (!me?.stripe?.chargesEnabled) missing.push('Paiements (charges)');
    if (!me?.stripe?.payoutsEnabled) missing.push('Virements (payouts)');

    if (missing.length) {
      return `Stripe incomplet : ${missing.join(' + ')}. Termine l’activation Stripe pour continuer.`;
    }
    return `Stripe incomplet.`;
  }

  // ✅ NEW: reçoit snapshot du step 4
  onShopManagementSnapshot(snap: ShopManagementSnapshot) {
    this.shopManagementSnapshot = snap || null;

    const extracted = this.extractValidityFromSnapshot(snap as any);
    if (extracted) this.shopManagementValidity = extracted;

    // on synchronise le shop courant avec celui du child
    const shopFromChild = (snap as any)?.shop;
    if (shopFromChild) {
      this.createdShopData = { ...shopFromChild };
      this.createdShopId = shopFromChild?._id || this.createdShopId;
    }

    this.persistDraft();
  }

  // ✅ NEW: reçoit juste la validité (utile pour UI)
  onShopManagementValidity(v: any) {
    // ---------- 0) Reset si null/undefined ----------
    if (v === null || v === undefined) {
      this.shopManagementValidity = null;
      console.log('[Wizard S4] validityChange: null/undefined => reset');
      this.persistDraft();
      return;
    }

    // ---------- 1) Support ancien mode: boolean ----------
    if (typeof v === 'boolean') {
      this.shopManagementValidity = {
        valid: v,

        // normalisés (pas d’undefined)
        formValid: v,
        legalValid: v,
        hoursValid: v,
        placeAddressValid: true,   // on ne bloque pas sur ça si pas géré
        hasHandleError: false,

        blockedElements: [],
        errors: undefined,
        missing: [],

        rawType: 'boolean',
        raw: v,
      };

      console.log('[Wizard S4] validityChange(boolean):', v, '=> valid:', v);

      if (!v) {
        console.warn(
          '[Wizard S4] BLOQUÉ (boolean=false). Astuce: utilise snapshotChange pour voir les erreurs détaillées.'
        );
      }

      this.persistDraft();
      return;
    }

    // ---------- 2) Mode object: on normalise / sécurise ----------
    const missing: string[] = [];

    const pickBool = (key: string, fallback: boolean) => {
      if (v[key] === undefined) {
        missing.push(key);
        return fallback;
      }
      return !!v[key];
    };

    // ✅ ici: QUE des booleans (pas d'undefined)
    const formValid = pickBool('formValid', false);             // si absent => on considère non valide (safe)
    const legalValid = pickBool('legalValid', false);           // idem
    const hoursValid = pickBool('hoursValid', false);           // idem
    const placeAddressValid = pickBool('placeAddressValid', true); // si absent => on ne bloque pas
    const hasHandleError = pickBool('hasHandleError', false);   // si absent => pas d'erreur handle

    const blockedElements = Array.isArray(v.blockedElements) ? v.blockedElements : [];
    const errors = v.errors ? v.errors : undefined;

    // "valid" peut exister sur v, sinon on le reconstruit
    const computedValid =
      v.valid !== undefined
        ? !!v.valid
        : (formValid && legalValid && hoursValid && placeAddressValid && !hasHandleError);

    // ---------- 3) On stocke ton objet + extras debug ----------
    this.shopManagementValidity = {
      valid: computedValid,

      formValid,
      legalValid,
      hoursValid,
      placeAddressValid,
      hasHandleError,

      blockedElements,
      errors,
      missing,

      rawType: 'object',
      raw: v,
    };

    // ---------- 4) Logs debug ultra lisibles ----------
    const reasons: string[] = [];

    if (!formValid) reasons.push('formValid=false');
    if (!legalValid) reasons.push('legalValid=false');
    if (!hoursValid) reasons.push('hoursValid=false');
    if (!placeAddressValid) reasons.push('placeAddressValid=false');
    if (hasHandleError) reasons.push('hasHandleError=true');

    console.groupCollapsed(`[Wizard S4] validityChange(object) => valid=${computedValid}`);
    console.log('payload:', v);
    console.log('normalized:', this.shopManagementValidity);

    if (missing.length) {
      console.warn('champs manquants (fallback appliqué):', missing.join(', '));
    }

    if (!computedValid) {
      console.warn('BLOQUÉ - raisons:', reasons.length ? reasons : '(non déterminées)');
      if (blockedElements.length) console.warn('blockedElements:', blockedElements);
      if (errors) console.warn('errors:', errors);
    }
    console.groupEnd();

    // ---------- 5) Ton flow existant ----------
    this.persistDraft();
  }



  // ============================================================
  // DRAFT
  // ============================================================
  private persistDraft(): void {
    // ✅ garantit les defaults avant sauvegarde
    this.ensureStep2Defaults();
    this.ensureStep3Defaults();

    const draft: CreateShopDraft = {
      updatedAt: Date.now(),
      wizardOpen: false, // ✅ pas "true" en dur
      wizardStep: 0,

      auth: {
        email: this.authUser?.email || '',
        authEmailExists: this.authEmailExists ?? null,
        pendingEmailVerification: this.pendingEmailVerification ?? false,
        lastActivationCheckAt: this.lastActivationCheckAt ?? null,

        userSnapshot: this.me
          ? {
            _id: this.me._id,
            firstname: this.me.firstname,
            lastname: this.me.lastname,
            phone: this.me.phone,
            country: this.me.country,
            sex: this.me.sex,
            stripe: this.me.stripe || null,
          }
          : null,
      },

      // ✅ on sauvegarde le brouillon (step 2/3), pas createdShopData
      shop: this.newShop || null,

      address: {
        selectedCountry: this.selectedCountry,
        postalCode: this.postalCode,
        selectedCity: this.selectedCity,
        selectedArrondissement: this.selectedArrondissement,
        deliveryPostalCodesList: this.deliveryPostalCodesList || [],
        latitude: this.latitude,
        longitude: this.longitude,
      },

      created: {
        createdShopId: this.createdShopId || null,
        createdShopData: this.createdShopData || null,
      },
    };

    this.wizardDraft.save(draft);
  }



  private async restoreDraft(forceOpen = false) {
    const draft: any = this.wizardDraft.load();
    if (!draft) return;

    if (forceOpen) {
    } else {
      this.wizardOpen = !!draft.wizardOpen;
    }
    this.wizardStep = 0;

    // --- auth ---
    this.authUser.email = draft.auth?.email || '';
    this.authEmailExists = draft.auth?.authEmailExists ?? null;
    this.pendingEmailVerification = !!draft.auth?.pendingEmailVerification;
    this.lastActivationCheckAt = draft.auth?.lastActivationCheckAt ?? null;

    // ✅ defaults d'abord
    this.ensureStep2Defaults();
    this.ensureStep3Defaults();

    // --- STEP2/3 : restore newShop draft (merge) ---
    // rétro-compat: si draft.shop ressemble à un shop créé (a un _id), on ne l’écrase pas dans newShop
    const shopLike = draft.shop;
    const looksLikeCreatedShop = !!shopLike?._id;

    if (shopLike && !looksLikeCreatedShop) {
      this.newShop = draft.shop && typeof draft.shop === 'object' ? { ...draft.shop } : {};
      this.ensureStep2Defaults();
      this.ensureStep3Defaults();
      this.deliveryPostalCodesList = Array.isArray(draft.address?.deliveryPostalCodesList)
        ? draft.address.deliveryPostalCodesList
        : [];

    } else if (shopLike && looksLikeCreatedShop) {
      // ancienne version: draft.shop contenait parfois createdShopData
      this.createdShopData = { ...(this.createdShopData || {}), ...shopLike };
      this.createdShopId = this.createdShopData?._id || this.createdShopId;
    }

    // ✅ re-default après merge (au cas où)
    this.ensureStep2Defaults();

    // --- address ---
    this.selectedCountry = draft.address?.selectedCountry ?? this.selectedCountry;
    this.postalCode = draft.address?.postalCode ?? this.postalCode;
    this.selectedCity = draft.address?.selectedCity ?? this.selectedCity;
    this.selectedArrondissement = draft.address?.selectedArrondissement ?? this.selectedArrondissement;

    this.deliveryPostalCodesList = Array.isArray(draft.address?.deliveryPostalCodesList)
      ? draft.address.deliveryPostalCodesList
      : [];

    this.latitude = draft.address?.latitude ?? 0;
    this.longitude = draft.address?.longitude ?? 0;

    // ✅ defaults step3 après restore
    this.ensureStep3Defaults();

    // --- created (source de vérité serveur) ---
    this.createdShopId = draft.created?.createdShopId ?? this.createdShopId;
    this.createdShopData = draft.created?.createdShopData ?? this.createdShopData;

    if (this.createdShopId) {
      this.reloadArticles();
      this.loadVerificationStatus();
    }

    this.handleAvailable = null;
    this.handleChecking = false;

    this.getCountries();
  }


  constructor(
    private userService: UserService,
    private stripeService: StripeService,
    private shopService: ShopService,
    private productService: ProductService,
    private countryService: CountryService,
    private router: Router,
    private villeService: VilleService,
    private categoryService: CategoryService,
    private translate: TranslateService,
    private calendarSyncService: CalendarSyncService,
    private wizardDraft: WizardDraftService,
    private toastr: ToastrService,
    private bookingCategoryService: BookingCategoryService,

    // ✅ auth services
    private authenticationService: AuthenticationService,
    private sessionService: SessionService,

    @Optional() public dialogRef?: MatDialogRef<CreateShopComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: any
  ) { }

  ngOnInit(): void {
    const draft = this.wizardDraft.load();

    // ✅ si draft existe : on restaure TOUT proprement
    if (draft) {
      this.restoreDraft();
      return;
    }

    // ✅ sinon : on prépare un état clean (important pour step2/3)
    this.ensureStep2Defaults();
    this.ensureStep3Defaults();
    this.getCountries();
  }

  async generateICSLinkForStep9(): Promise<void> {
    try {
      if (!this.me?._id) {
        this.showCustomToast('Utilisateur introuvable. Merci de vous reconnecter.');
        return;
      }

      // évite double call
      if (this.icsLoading) return;

      this.icsLoading = true;

      this.calendarSyncService
        .getOrCreateMyCalendarLink(this.me._id)
        .pipe(finalize(() => (this.icsLoading = false)))
        .subscribe({
          next: (data: any) => {
            this.icsUrl = data?.icsUrl || '';

            if (!this.icsUrl) {
              this.showCustomToast(
                this.translate.instant('SETTINGS.ICS.TOAST.LINK_NOT_FOUND') || 'Lien .ics introuvable.'
              );
              return;
            }

            this.persistDraft();
          },
          error: (err: any) => {
            console.error('[Wizard S9] generateICSLinkForStep9 error:', err);
            this.showCustomToast(
              this.translate.instant('SETTINGS.ICS.TOAST.GENERATE_ERROR') || 'Impossible de générer le lien .ics.'
            );
          },
        });
    } catch (e) {
      console.error('[Wizard S9] generateICSLinkForStep9 fatal:', e);
      this.icsLoading = false;
      this.showCustomToast(
        this.translate.instant('SETTINGS.ICS.TOAST.GENERATE_ERROR') || 'Impossible de générer le lien .ics.'
      );
    }
  }


  // ============================================================
  // WIZARD CONTROLS
  // ============================================================

  openWizard() {
    console.log('🟣 [Wizard] openWizard() called');

    if (this.alreadyProfessionnal) {
      console.warn('🟡 [Wizard] alreadyProfessionnal = true → abort');
      return;
    }

    // ✅ toujours ouvrir ici
    this.wizardOpen = true;
    this.wizardStep = 0;

    console.log('🟢 [Wizard] wizardOpen set to true, step = 0');

    // reset errors/states
    this.showErrors = false;
    this.error = {};
    this.authError = {};
    this.verificationError = {};
    this.busy = false;

    this.createdShopId = null;
    this.createdShopData = null;
    this.verification = null;

    this.authEmailExists = null;
    this.pendingEmailVerification = false;
    this.checkingActivation = false;
    this.lastActivationCheckAt = null;

    this.shopManagementSnapshot = null;
    this.shopManagementValidity = null;

    // reset auth user
    this.authUser = {
      email: '',
      password: '',
      passwordConfirmed: '',
      firstname: '',
      lastname: '',
      phone: '',
      sex: 'female',
      country: 'France',
    };

    console.log('🟢 [Wizard] authUser reset');

    // ✅ reset step 3 state AVANT ensure defaults
    this.deliveryPostalCodesList = [];
    this.deliveryPostalCode = '';
    this.postalCode = '';
    this.selectedCity = {};
    this.selectedArrondissement = '';
    this.availableCities = [];
    this.availableArrondissements = [];
    this.latitude = 0.0;
    this.longitude = 0.0;

    console.log('🟢 [Wizard] address reset');

    // reset step 2 draft
    this.newShop = {
      companyType: 'coiffure',
      countryIndication: 'FR',
      serviceMode: 'SALON',
      ccvaccepted: false,
      maxDistance: 15,
    };

    console.log('🟢 [Wizard] newShop initialized:', this.newShop);

    // ✅ force defaults
    this.ensureStep2Defaults();
    this.ensureStep3Defaults();

    console.log('🟢 [Wizard] after ensure defaults:', {
      companyType: this.newShop.companyType,
      serviceMode: this.newShop.serviceMode,
      deliveryPostalCodesList: this.deliveryPostalCodesList
    });

    this.resetHandleValidation();
    console.log('🟢 [Wizard] handle validation reset');

    const draft = this.wizardDraft.load();
    console.log('🔎 [Wizard] draft loaded:', draft);

    if (draft && draft.wizardOpen === false) {
      console.warn('🟡 [Wizard] draft has wizardOpen=false, forcing open anyway');
    }

    if (draft) {
      console.log('🟣 [Wizard] restoring draft...');
      try {
        this.restoreDraft(true); // ✅ voir patch plus bas
        console.log('🟢 [Wizard] restoreDraft() completed');
      } catch (e) {
        console.error('🔴 [Wizard] restoreDraft() CRASHED:', e);
      }
      return;
    }

    console.log('🟢 [Wizard] no draft → persisting fresh state');
    this.persistDraft();
    console.log('🟢 [Wizard] draft persisted (fresh)');
  }



  closeWizard() {
    if (this.busy || this.isUploadingDocs) return;
    this.wizardOpen = false;
    this.persistDraft();
  }

  prev() {
    if (this.busy) return;
    this.showErrors = false;
    this.wizardStep = (Math.max(0, this.wizardStep - 1) as WizardStep);
  }

  // ============================================================
  // ✅ STEP 4 COMMIT (le stepper est le seul qui push en BDD)
  // ============================================================

  private getBlockedElementsMessage(v: ShopManagementValidity | null, isSalon: boolean): string {
    const blocked: string[] = [];

    if (!v) return this.translate.instant('CREATION_SHOP_WIZARD.S4_INVALID') ||
      "Merci de compléter la configuration du salon avant de continuer.";

    if (!v.formValid) blocked.push('Formulaire');
    if (!v.legalValid) blocked.push('Informations légales');
    if (v.hoursValid === false) blocked.push("Horaires d'ouverture");
    if (isSalon && v.placeAddressValid === false) blocked.push("Adresse du salon");
    if (v.hasHandleError) blocked.push("Handle");

    if (Array.isArray(v.blockedElements) && v.blockedElements.length) {
      // si le child envoie déjà des libellés propres, on les priorise
      return `Éléments bloqués : ${v.blockedElements.join(' • ')}`;
    }

    if (!blocked.length) {
      return this.translate.instant('CREATION_SHOP_WIZARD.S4_INVALID') ||
        "Merci de compléter la configuration du salon avant de continuer.";
    }

    return `Éléments bloqués : ${blocked.join(' • ')}`;
  }

  /**
   * ✅ Met à jour le shop via le ShopService.update(shop)
   * (ton service ne prend qu'un param)
   */
  private updateShopAsync(shopId: string, payload: any): Promise<any | null> {
    return new Promise((resolve) => {
      this.busy = true;

      const body = { _id: shopId, ...(payload || {}) };

      this.shopService.update(body).subscribe({
        next: (updatedShop: any) => {
          this.busy = false;
          resolve(updatedShop || null);
        },
        error: (err: any) => {
          this.busy = false;
          console.error('[CreateShop] updateShopAsync error:', err);
          const msg = err?.error?.message || this.translate.instant('ERROR.GENERIC_ERROR');
          this.showCustomToast(msg);
          resolve(null);
        },
      });
    });
  }

  /**
   * Construit un objet shop complet à envoyer au backend
   * -> on part du shop actuel + ce qui vient du snapshot step4
   */
  private buildStep4ShopToUpdate(): any | null {
    const base = this.createdShopData || {};
    const snapShop = (this.shopManagementSnapshot as any)?.shop;

    const merged = {
      ...base,
      ...(snapShop ? snapShop : {}),
    };

    if (!merged?._id) return null;

    return merged;
  }

  private ensureStep2Defaults(): void {
    if (!this.newShop || typeof this.newShop !== 'object') this.newShop = {};

    // ✅ Step 2 defaults
    if (!this.newShop.companyType) this.newShop.companyType = 'coiffure';

    // (optionnel mais utile)
    if (!this.newShop.countryIndication) this.newShop.countryIndication = 'FR';
    if (this.newShop.ccvaccepted === undefined) this.newShop.ccvaccepted = false;

    // distance par défaut
    if (!this.newShop.maxDistance) this.newShop.maxDistance = 15;
  }

  private ensureStep3Defaults(): void {
    if (!this.newShop || typeof this.newShop !== 'object') this.newShop = {};

    // ✅ Step 3 defaults
    if (!this.newShop.serviceMode) this.newShop.serviceMode = 'SALON';

    if (!Array.isArray(this.deliveryPostalCodesList)) this.deliveryPostalCodesList = [];
    if (!this.deliveryPostalCode) this.deliveryPostalCode = '';
  }


  private validateStep3PlaceAddress(): boolean {
    // Si domicile, pas d'adresse salon obligatoire
    if ((this.newShop?.serviceMode || 'SALON') !== 'SALON') return true;

    const street = (this.newShop?.street || '').trim();
    const postal = (this.postalCode || '').trim();
    const city = (this.selectedCity?.nom || '').trim();

    let ok = true;

    // reset erreurs
    this.error.street = null;
    this.error.postalCode = null;
    this.error.selectedCity = null;

    if (!street || street.length < 5) {
      this.error.street = "Adresse invalide (min 5 caractères)";
      ok = false;
    }
    if (!postal || postal.length < 4) {
      this.error.postalCode = "Code postal invalide";
      ok = false;
    }
    if (!city) {
      this.error.selectedCity = "Ville obligatoire";
      ok = false;
    }

    return ok;
  }


  /**
   * NEXT
   * - step0 : si connecté -> skip auth (go step2)
   * - step1 : login OU register (puis attente validation mail)
   * - step3 : create shop avant step4
   * - step4 : VALIDATE + COMMIT (unique) via stepper
   */

  async next() {
    if (this.busy) return;

    this.showErrors = true;
    this.validateCurrentStep();

    // ✅ STEP 8 : CLICK NEXT => validate Stripe then go step 9
    if (this.wizardStep === 8) {
      console.log('🔎 [WIZARD] next() clicked on step 8');

      // 0) Bloque si refresh en cours
      if (this.stripeLoading) {
        this.showCustomToast(this.translate.instant('CREATION_SHOP_WIZARD.PLEASE_WAIT'));
        return;
      }

      // 1) Source de vérité : refresh Stripe status (safe)
      const updatedMe = await this.refreshStripeStatusAsync({ silentError: true });

      // Si refresh a échoué, on utilise quand même this.me (dernier état connu)
      const meToCheck = updatedMe || this.me;

      // 2) Validation Stripe (STRICT)
      const stripeReady = this.isStripeReady(meToCheck);
      console.log('🔐 [WIZARD] stripeReady:', stripeReady, 'stripe:', meToCheck?.stripe);

      if (!stripeReady) {
        this.showCustomToast(this.getStripeBlockedMessage(meToCheck));
        return;
      }

      // ✅ OK => on peut passer au step 9
      this.showErrors = false;
      this.wizardStep = 9 as WizardStep;

      // ✅ génération ICS à l’entrée step 9
      this.generateICSLinkForStep9();

      this.persistDraft();
      return;
    }

    // ✅ STEP 4 : le stepper est le seul qui push en BDD (STRICT)
    if (this.wizardStep === 4) {
      const isSalon = (this.createdShopData?.serviceMode || 'SALON') === 'SALON';

      // 1) récup validité (priorité: state local)
      const v =
        this.shopManagementValidity ||
        this.extractValidityFromSnapshot(this.shopManagementSnapshot as any);

      // 2) règles de blocage (STRICT)
      const mustBeValid =
        !!v &&
        v.formValid === true &&
        v.legalValid === true &&
        v.hoursValid === true &&
        (!isSalon || v.placeAddressValid === true) &&
        v.hasHandleError !== true;

      if (!mustBeValid) {
        this.showCustomToast(this.getBlockedElementsMessage(v || null, isSalon));
        return;
      }

      // 3) commit BDD UNIQUE ici
      const shopToUpdate = this.buildStep4ShopToUpdate();
      if (!shopToUpdate) {
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        return;
      }

      const updated = await this.updateShopAsync(this.createdShopData._id, shopToUpdate);
      if (!updated) return;

      // ✅ vérité serveur pour quand on revient en step 4
      this.createdShopData = { ...updated };

      // optionnel : réaligne snapshot si présent
      this.shopManagementSnapshot = this.shopManagementSnapshot
        ? { ...(this.shopManagementSnapshot as any), shop: updated }
        : this.shopManagementSnapshot;

      // 4) go docs
      this.showErrors = false;
      this.wizardStep = 5;
      this.loadVerificationStatus();
      this.persistDraft();
      return;
    }

    // ✅ STEP 5 : bloqué tant que les 3 docs ne sont pas envoyés (STRICT)
    if (this.wizardStep === 5) {
      // si upload en cours, on bloque
      if (this.isUploadingDocs || this.busy) {
        this.showCustomToast(this.translate.instant('CREATION_SHOP_WIZARD.PLEASE_WAIT'));
        return;
      }

      // refresh depuis le backend (source de vérité)
      const verification = await this.loadVerificationStatusAsync();

      const hasIdentity = !!verification?.identity?.file;
      const hasInsurance = !!verification?.insurance?.file;
      const hasKbis = !!verification?.kbis?.file;

      if (!hasIdentity || !hasInsurance || !hasKbis) {
        const missing: string[] = [];
        if (!hasIdentity) missing.push(this.translate.instant('CREATION_SHOP.VERIF_ID_TITLE'));
        if (!hasInsurance) missing.push(this.translate.instant('CREATION_SHOP.VERIF_INSURANCE_TITLE'));
        if (!hasKbis) missing.push(this.translate.instant('CREATION_SHOP.VERIF_KBIS_TITLE'));

        this.showCustomToast(
          (this.translate.instant('CREATION_SHOP.VERIF_ALL_REQUIRED') || 'Merci d’envoyer les 3 documents.') +
          (missing.length ? ` (${missing.join(', ')})` : '')
        );
        return;
      }

      // ✅ OK : on peut passer à la suite
      this.showErrors = false;

      const nextStep = (Math.min(this.wizardSteps.length - 1, this.wizardStep + 1) as WizardStep);
      this.wizardStep = nextStep;

      this.persistDraft();
      return;
    }

    // ✅ STEP 6 : bloquer si aucune catégorie
    if (this.wizardStep === 6) {
      if (!this.createdShopId) {
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        return;
      }

      // vérité serveur
      const count = await this.getCategoriesCountAsync(this.createdShopId);

      if (count === -1) {
        this.showCustomToast('Impossible de vérifier les catégories (réseau/serveur).');
        return;
      }

      if (count < 1) {
        this.showCustomToast('Ajoute au moins 1 catégorie pour continuer.');
        return;
      }

      // OK ✅
      this.showErrors = false;

      const nextStep = (Math.min(this.wizardSteps.length - 1, (this.wizardStep + 1)) as WizardStep);
      this.wizardStep = nextStep;

      this.persistDraft();
      return;
    }

    // ✅ Bloque si le step courant n'est pas valide
    if (!this.isStepValid(this.wizardStep)) {
      return;
    }

    // ✅ snapshot avant transition
    this.persistDraft();

    // -------------------------------------------
    // Step 0 -> Step 1 (auth) OU Step 2 (si connecté)
    // -------------------------------------------
    if (this.wizardStep === 0) {
      this.showErrors = false;

      if (this.isUserConnected) {
        this.wizardStep = 2;
        return;
      }

      this.wizardStep = 1;
      return;
    }

    // -------------------------------------------
    // Step 1 (auth)
    // -------------------------------------------
    if (this.wizardStep === 1) {
      if (this.pendingEmailVerification) {
        this.showCustomToast(this.translate.instant('CREATION_SHOP_WIZARD.VALIDATE_EMAIL'));
        return;
      }

      const ok = await this.ensureAuthenticatedBeforeShop();
      if (!ok) return;

      this.showErrors = false;
      this.ensureStep2Defaults();
      this.ensureStep3Defaults();
      this.wizardStep = 2;
      return;
    }

    // -------------------------------------------
    // Step 3 -> Step 4 : create shop avant docs
    // -------------------------------------------
    if (this.wizardStep === 2) {
      // this.setServiceMode("SALON");
      // this.newShop.companyType = "coiffure";
    }

    // -------------------------------------------
    // Step 3 -> Step 4 : create shop avant docs
    // -------------------------------------------
    if (this.wizardStep === 3) {
      await this.ensureShopCreated();
      if (!this.createdShopId) return;

      // ✅ blocage adresse step 3 si salon
      if (!this.validateStep3PlaceAddress()) {
        this.showCustomToast('Merci de compléter l’adresse du salon.');
        return;
      }

      // ✅ IMPORTANT : sync + persist placeAddress/serviceMode AVANT d'afficher le step 4
      // 1) sync (local)
      this.createdShopData = this.syncPlaceAddressFromStep3IntoShop(this.createdShopData);

      // 2) persist BDD (minimal, mais ici tu peux envoyer tout le shop si tu veux)
      const updated = await this.updateShopAsync(this.createdShopData._id, this.createdShopData);
      if (!updated) return;

      // ✅ vérité serveur pour quand on revient en step 4
      this.createdShopData = { ...updated };

      // optionnel : réaligne snapshot si présent
      this.shopManagementSnapshot = this.shopManagementSnapshot
        ? { ...(this.shopManagementSnapshot as any), shop: updated }
        : this.shopManagementSnapshot;

      this.persistDraft();

      this.showErrors = false;
      this.wizardStep = 4;
      this.persistDraft();
      return;
    }

    // après avoir restauré me + createdShopId etc...
    if (this.wizardStep === 9) {
      this.generateICSLinkForStep9();
    }

    // -------------------------------------------
    // Step normal : +1
    // -------------------------------------------
    this.showErrors = false;

    const nextStep = (Math.min(this.wizardSteps.length - 1, this.wizardStep + 1) as WizardStep);
    this.wizardStep = nextStep;

    // ✅ en entrant en step 5 : charge status
    if (this.wizardStep === 5) {
      this.loadVerificationStatus();
    }

    // ✅ en entrant en step 8 : auto refresh Stripe (quand on arrive depuis 7)
    if (this.wizardStep === 8) {
      console.log('🟣 [WIZARD] entering step 8 -> auto refresh Stripe');

      // évite double refresh
      if (!this.stripeLoading) {
        await this.refreshStripeStatusAsync({ silentError: true });
      } else {
        console.log('🟡 [WIZARD] stripeLoading already true, skip auto refresh');
      }
    }

    this.persistDraft();
    return;
  }


  private async enterStep8(): Promise<void> {
    console.log('🟣 [WIZARD] entering step 8 -> auto refresh Stripe status');

    // si pas de user => impossible
    if (!this.me?._id) {
      console.warn('🔴 [WIZARD] no me._id, cannot refresh stripe');
      return;
    }

    // évite double refresh si ça spam
    if (this.stripeLoading) {
      console.log('🟡 [WIZARD] stripeLoading already true, skip refresh');
      return;
    }

    // refresh silencieux (pas de toast d'erreur si tu veux)
    const updatedMe = await this.refreshStripeStatusAsync({ silentError: true });

    const meToCheck = updatedMe || this.me;
    console.log('🧠 [WIZARD] Stripe status refreshed on enter step 8:', meToCheck?.stripe);
  }


  hideBrokenImg(ev: Event) {
    const img = ev.target as HTMLImageElement;
    img.style.display = 'none';
  }

  // ============================================================
  // Prestations (services)
  // ============================================================
  reloadArticles(): void {
    try {
      if (!this.createdShopId) {
        this.myArticlesData = [];
        return;
      }

      this.productService.getProductsByShop(this.createdShopId).subscribe({
        next: (prods: any[]) => (this.myArticlesData = prods || []),
        error: (err: any) => {
          console.error('[CreateShop] reloadArticles error:', err);
          this.myArticlesData = [];
        },
      });
    } catch (e) {
      console.error('[CreateShop] reloadArticles fatal:', e);
      this.myArticlesData = [];
    }
  }

  onShopUpdated(shopId: string) {
    this.createdShopId = shopId || this.createdShopId;
    this.reloadArticles();
    this.persistDraft();
  }

  // ============================================================
  // AUTH STEP LOGIC
  // ============================================================

  onAuthEmailBlur() {
    this.authError.email = null;

    this.pendingEmailVerification = false;
    this.lastActivationCheckAt = null;

    const email = this.str(this.authUser.email);

    if (!email) {
      this.authEmailExists = null;
      return;
    }

    if (!this.isValidEmail(email)) {
      this.authEmailExists = null;
      this.authError.email = this.translate.instant("CREATION_SHOP_WIZARD.EMAIL_NOT_VALID");
      return;
    }

    this.checkEmailExists(email);
    this.persistDraft();
  }

  private checkEmailExists(email: string) {
    this.busy = true;
    this.authEmailExists = null;

    this.userService.checkEmailExists(email).subscribe({
      next: (res: any) => {
        this.busy = false;
        this.authEmailExists = !!res?.exists;
      },
      error: (err: any) => {
        this.busy = false;
        console.error(err);
        this.authEmailExists = null;
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });
  }

  private checkEmailExistsAsync(email: string): Promise<void> {
    return new Promise((resolve) => {
      this.busy = true;
      this.authEmailExists = null;

      this.userService.checkEmailExists(email).subscribe({
        next: (res: any) => {
          this.busy = false;
          this.authEmailExists = !!res?.exists;
          resolve();
        },
        error: (err: any) => {
          this.busy = false;
          console.error(err);
          this.authEmailExists = null;
          resolve();
        }
      });
    });
  }

  private refreshStripeStatusAsync(opts?: { silentError?: boolean }): Promise<any | null> {
    return new Promise((resolve) => {
      if (!this.me?._id) return resolve(null);
      if (this.stripeLoading) return resolve(this.me);

      this.stripeLoading = true;
      console.log("ID DE MON USER :")
      console.log(this.me._id)
      this.stripeService.refreshStripeStatus(this.me._id).subscribe({
        next: (updatedUser) => {
          this.me = updatedUser;          // ✅ vérité backend
          this.stripeLoading = false;
          this.persistDraft();            // ✅ garde l’état en reload
          resolve(updatedUser);
        },
        error: (e) => {
          console.error(e);
          this.stripeLoading = false;
          if (!opts?.silentError) {
            this.toastr.error(this.translate.instant("FINANCE.REFRESH_STRIPE"));
          }
          resolve(null);
        }
      });
    });
  }


  // ------------------------------------------------------
  // 🗺️ Charger les pays actifs, sélectionner le pays stocké, charger ses langues
  // ------------------------------------------------------
  getCountries(): void {
    this.countryService.getAll({ active: true }).subscribe({
      next: (countries: any[]) => {
        this.countries = countries || [];
        this.availableCountries = this.countries;

        // country stocké côté user (string)
        let storedCountry = this.me?.country ? String(this.me.country).trim() : 'France';
        storedCountry = storedCountry.replace(/^"(.*)"$/, '$1').trim(); // sécurité si quotes

        // On retrouve le pays (objet) mais on stocke UNIQUEMENT son name (string)
        const found = this.findCountryByNameOrTranslation(storedCountry);
        this.selectedCountry = found?.name || 'France';

        this.sessionService.setCountry(this.selectedCountry);

        console.log('[getCountries] selectedCountry (string):', this.selectedCountry);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des pays', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      },
    });
  }

  private findCountryByNameOrTranslation(raw: string): any | undefined {
    const norm = String(raw || '').trim().toLowerCase();
    return this.countries.find(
      (c) => String(c.name || '').toLowerCase() === norm || String(c.translation || '').toLowerCase() === norm
    );
  }



  private async ensureAuthenticatedBeforeShop(): Promise<boolean> {
    this.authError = {};

    const email = this.str(this.authUser.email);
    const password = this.str(this.authUser.password);

    if (!email) {
      this.authError.email = this.translate.instant("CREATION_SHOP_WIZARD.EMAIL_HAVE_TO");
      return false;
    }
    if (!this.isValidEmail(email)) {
      this.authError.email = this.translate.instant("CREATION_SHOP_WIZARD.EMAIL_NOT_VALID");
      return false;
    }

    if (this.authEmailExists === null) {
      await this.checkEmailExistsAsync(email);

      if (this.authEmailExists === null) {
        this.authError.email = this.translate.instant("CREATION_SHOP_WIZARD.NOT_VERIFY_EMAIL");
        return false;
      }
    }

    if (this.authEmailExists === true) {
      if (!password) {
        this.authError.password = this.translate.instant("CREATION_SHOP_WIZARD.MDP_HAVE_TO");
        return false;
      }
      return await this.loginAndLoadMe(email, password);
    }

    if (this.authEmailExists === false) {
      if (!this.isNonEmpty(this.authUser.sex)) this.authError.sex = this.translate.instant("CREATION_SHOP_WIZARD.SEX_HAVE_TO");
      if (!this.isNonEmpty(this.authUser.firstname) || this.str(this.authUser.firstname).length < 2) this.authError.firstname = this.translate.instant("CREATION_SHOP_WIZARD.FIRSTNAME_HAVE_TO");
      if (!this.isNonEmpty(this.authUser.lastname) || this.str(this.authUser.lastname).length < 2) this.authError.lastname = this.translate.instant("CREATION_SHOP_WIZARD.NAME_HAVE_TO");
      if (!this.isValidPhoneFR(this.authUser.phone)) this.authError.phone = this.translate.instant("CREATION_SHOP_WIZARD.PHONE_NOT_VALID");
      if (!this.isNonEmpty(this.authUser.password)) this.authError.password = this.translate.instant("CREATION_SHOP_WIZARD.MDP_HAVE_TO");
      if (!this.isNonEmpty(this.authUser.passwordConfirmed)) this.authError.passwordConfirmed = this.translate.instant("CREATION_SHOP_WIZARD.CONFIRM_HAVE_TO");
      if (this.str(this.authUser.passwordConfirmed) !== this.str(this.authUser.password)) this.authError.passwordConfirmed = this.translate.instant("CREATION_SHOP_WIZARD.MDP_NOT_MATCHING");
      if (!this.isNonEmpty(this.authUser.country)) this.authError.country = this.translate.instant("CREATION_SHOP_WIZARD.COUNTRY_HAVE_TO");

      const hasError = Object.values(this.authError).some(v => !!v);
      if (hasError) return false;

      const payload: any = {
        sex: this.authUser.sex,
        firstname: this.authUser.firstname,
        lastname: this.authUser.lastname,
        phone: this.onlyDigits(this.authUser.phone),
        email,
        password,
        passwordConfirmed: this.authUser.passwordConfirmed,
        country: this.authUser.country,

        role: 'user',
        conversationId: uuidv4(),

        fidelity: {
          stars: 0,
          card_expiration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          rewards_history: [],
        },
      };

      const created = await this.registerNoToken(payload);
      if (!created) return false;

      this.pendingEmailVerification = true;
      this.lastActivationCheckAt = null;

      this.showSuccessToast(
        this.translate.instant('SIGNUP.VERIFICATION_EMAIL_SENT') || "Email envoyé. Vérifiez votre boîte mail."
      );

      return false;
    }

    return false;
  }

  private registerNoToken(payload: any): Promise<boolean> {
    return new Promise((resolve) => {
      this.busy = true;

      this.userService.createNoToken(payload).subscribe({
        next: () => {
          this.busy = false;
          resolve(true);
        },
        error: (err: any) => {
          this.busy = false;
          console.error(err);
          this.showCustomToast(this.translate.instant('ERROR.USERNOTCREATED') || "Impossible de créer l'utilisateur");
          resolve(false);
        }
      });
    });
  }

  private syncPlaceAddressFromStep3IntoShop(shop: any): any {
    const serviceMode = (this.newShop?.serviceMode || shop?.serviceMode || 'SALON') as 'SALON' | 'DOMICILE';

    // si DOMICILE, on peut nettoyer l'adresse salon (optionnel)
    if (serviceMode !== 'SALON') {
      return {
        ...shop,
        serviceMode,
        placeAddress: shop.placeAddress || null,
      };
    }

    const cityName =
      (this.selectedCity && (this.selectedCity.nom || this.selectedCity.name)) ||
      shop?.placeAddress?.city ||
      '';

    const countryCode =
      (this.selectedCountry || '').toString().toUpperCase().startsWith('FR') ? 'FR' : 'FR';


    const postal =
      (this.postalCode || shop?.placeAddress?.postalCode || '').toString().trim();

    const addressLine1 =
      (this.newShop?.street || shop?.placeAddress?.addressLine1 || '').toString().trim();

    const addressLine2 =
      (this.newShop?.floor || shop?.placeAddress?.addressLine2 || '').toString().trim();

    return {
      ...shop,
      serviceMode,
      placeAddress: {
        ...(shop.placeAddress || {}),
        country: this.selectedCountry || 'France',
        postalCode: postal,
        city: cityName,
        addressLine1,
        addressLine2,
      },
    };

  }

  private loginAndLoadMe(email: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.busy = true;

      this.authenticationService.login(email, password).subscribe({
        next: (user: any) => {
          this.sessionService.setAuthToken(user.token, true);

          this.userService.getMe().subscribe({
            next: (me: any) => {
              this.me = { ...me };
              this.isUserConnected = true;
              this.alreadyProfessionnal = this.me.role === 'professionnel' || this.me.role === 'entreprise';
              this.busy = false;
              resolve(true);
            },
            error: (err: any) => {
              this.busy = false;
              console.error(err);
              this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
              resolve(false);
            }
          });
        },
        error: (err: any) => {
          this.busy = false;
          console.error(err);
          this.authError.password = err?.error?.message || "Mot de passe incorrect";
          resolve(false);
        }
      });
    });
  }

  onAuthPhoneInput() {
    this.authUser.phone = this.onlyDigits(this.authUser.phone).slice(0, 10);
  }

  checkIfUserIsActivated() {
    if (this.checkingActivation || this.busy) return;

    const email = this.str(this.authUser.email);
    if (!email || !this.isValidEmail(email)) {
      this.authError.email = this.translate.instant("CREATION_SHOP_WIZARD.EMAIL_VALID");
      return;
    }

    this.checkingActivation = true;

    // ✅ on marque le moment où l’utilisateur clique sur ↻
    this.lastActivationCheckAt = new Date().toISOString();
    this.persistDraft();

    this.userService.checkUserActiveByEmail(email).subscribe({
      next: (res: any) => {
        this.checkingActivation = false;

        const isActive = !!res?.active;

        // ✅ on garde la trace du check (déjà set juste avant, mais on persist encore)
        this.persistDraft();

        if (!isActive) {
          this.showCustomToast(this.translate.instant("CREATION_SHOP_WIZARD.NOT_ACTIVATED"));
          return;
        }

        this.pendingEmailVerification = false;
        this.authEmailExists = true;
        this.authUser.password = '';

        this.showSuccessToast(this.translate.instant("CREATION_SHOP_WIZARD.ACCOUNT_ACTIVATED"));
        this.persistDraft();
      },
      error: (err: any) => {
        this.checkingActivation = false;
        console.error(err);

        // ✅ on garde quand même lastActivationCheckAt (ça prouve qu’on a essayé)
        this.persistDraft();

        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });
  }


  resendActivationEmail() {
    const email = this.str(this.authUser.email);
    if (!email || !this.isValidEmail(email)) {
      this.authError.email = this.translate.instant("CREATION_SHOP_WIZARD.EMAIL_VALID");
      return;
    }

    this.busy = true;
    this.userService.resendVerificationEmail(email).subscribe({
      next: () => {
        this.busy = false;
        this.showSuccessToast(this.translate.instant("CREATION_SHOP_WIZARD.EMAIL_RESEND"));
      },
      error: (err: any) => {
        this.busy = false;
        console.error(err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });
  }

  // ============================================================
  // SERVICE MODE
  // ============================================================
  setServiceMode(mode: ServiceMode) {
    this.newShop.serviceMode = mode;
  }

  // ============================================================
  // VALIDATIONS (simple + commentée)
  // ============================================================
  private validateCurrentStep(step: WizardStep = this.wizardStep): void {

    if (step === 0) return;

    if (step === 1) {
      this.authError.email = null;
      this.authError.password = null;
      this.authError.passwordConfirmed = null;
      this.authError.firstname = null;
      this.authError.lastname = null;
      this.authError.phone = null;
      this.authError.sex = null;
      this.authError.country = null;

      if (!this.isNonEmpty(this.authUser.email)) {
        this.authError.email = this.translate.instant("CREATION_SHOP_WIZARD.EMAIL_HAVE_TO");
      } else if (!this.isValidEmail(this.authUser.email)) {
        this.authError.email = this.translate.instant("CREATION_SHOP_WIZARD.EMAIL_NOT_VALID");
      }

      if (this.pendingEmailVerification) return;

      if (this.authEmailExists === true) {
        if (!this.isNonEmpty(this.authUser.password)) {
          this.authError.password = this.translate.instant("CREATION_SHOP_WIZARD.MDP_HAVE_TO");
        }
      }

      if (this.authEmailExists === false) {
        if (!this.isNonEmpty(this.authUser.sex)) this.authError.sex = this.translate.instant("CREATION_SHOP_WIZARD.SEX_HAVE_TO");
        if (!this.isNonEmpty(this.authUser.firstname) || this.str(this.authUser.firstname).length < 2) this.authError.firstname = this.translate.instant("CREATION_SHOP_WIZARD.FIRSTNAME_HAVE_TO");
        if (!this.isNonEmpty(this.authUser.lastname) || this.str(this.authUser.lastname).length < 2) this.authError.lastname = this.translate.instant("CREATION_SHOP_WIZARD.NAME_HAVE_TO");
        if (!this.isValidPhoneFR(this.authUser.phone)) this.authError.phone = this.translate.instant("CREATION_SHOP_WIZARD.PHONE_NOT_VALID");
        if (!this.isNonEmpty(this.authUser.password)) this.authError.password = this.translate.instant("CREATION_SHOP_WIZARD.MDP_HAVE_TO");
        if (!this.isNonEmpty(this.authUser.passwordConfirmed)) this.authError.passwordConfirmed = this.translate.instant("CREATION_SHOP_WIZARD.CONFIRM_HAVE_TO");
        if (this.isNonEmpty(this.authUser.passwordConfirmed) && this.str(this.authUser.passwordConfirmed) !== this.str(this.authUser.password)) {
          this.authError.passwordConfirmed = this.translate.instant("CREATION_SHOP_WIZARD.MDP_NOT_MATCHING");
        }
        if (!this.isNonEmpty(this.authUser.country)) this.authError.country = this.translate.instant("CREATION_SHOP_WIZARD.COUNTRY_HAVE_TO");
      }
      return;
    }

    if (step === 2) {
      this.error.name = null;
      this.error.companyType = null;
      this.error.handle = null;

      if (!this.isNonEmpty(this.newShop?.name)) this.error.name = this.translate.instant('CREATION_SHOP.ERROR1');
      if (!this.isNonEmpty(this.newShop?.companyType)) this.error.companyType = this.translate.instant('CREATION_SHOP.ERROR3');

      this.newShop.handle = this.normalizeHandle(this.newShop?.handle);
      const h = this.newShop.handle;

      if (!this.isNonEmpty(h)) {
        this.error.handle = this.translate.instant('CREATION_SHOP_WIZARD.HANDLE_REQUIRED');
        return;
      }

      if (!this.isValidHandle(h)) {
        this.error.handle = this.translate.instant('CREATION_SHOP_WIZARD.HANDLE_MIN');
        return;
      }

      if (this.handleAvailable !== true) {
        this.error.handle = this.translate.instant('CREATION_SHOP_WIZARD.HANDLE_MUST_BE_AVAILABLE')
          || "Veuillez tester le handle et choisir un identifiant disponible.";
        return;
      }

      return;
    }

    if (step === 3) {
      this.error.selectedCountry = null;
      this.error.postalCode = null;
      this.error.selectedCity = null;
      this.error.street = null;
      this.error.ccvaccepted = null;

      if (!this.isNonEmpty(this.selectedCountry)) this.error.selectedCountry = this.translate.instant('CREATION_SHOP.CHOOSE_COUNTRY');

      if (!this.isNonEmpty(this.postalCode)) this.error.postalCode = this.translate.instant("CREATION_SHOP_WIZARD.CP_HAVE_TO");
      else if (!this.isValidPostalCode(this.postalCode)) this.error.postalCode = this.translate.instant("CREATION_SHOP_WIZARD.CP_NOT_VALID");

      if (!this.selectedCity || !this.isNonEmpty(this.selectedCity?.nom)) this.error.selectedCity = this.translate.instant('CREATION_SHOP.CHOOSE_CITY');

      if (!this.isNonEmpty(this.newShop?.street)) this.error.street = this.translate.instant('CREATION_SHOP.ERROR2');

      if (!this.newShop?.ccvaccepted) this.error.ccvaccepted = this.translate.instant('CREATION_SHOP.ERROR8');
      return;
    }

    if (step === 5) {
      this.verificationError.identityDoc = null;
      this.verificationError.insuranceDoc = null;
      this.verificationError.kbisDoc = null;

      if (!this.identityDocFile) this.verificationError.identityDoc = this.translate.instant('CREATION_SHOP.VERIF_ID_REQUIRED');
      if (!this.insuranceDocFile) this.verificationError.insuranceDoc = this.translate.instant('CREATION_SHOP.VERIF_INSURANCE_REQUIRED');
      if (!this.kbisDocFileName) this.verificationError.kbisDoc = this.translate.instant('CREATION_SHOP.VERIF_KBIS_REQUIRED');
      return;
    }
  }

  // ============================================================
  // SHOP CREATION / ADDRESS / ZONES
  // ============================================================

  private async ensureShopCreated(): Promise<void> {
    if (this.createdShopId) return;

    if (!this.me?._id) {
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      return;
    }

    this.busy = true;

    try {
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

      await new Promise<void>((resolve) => {
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

  onCountryChange() {
    this.postalCode = '';
    this.availableCities = [];
    this.selectedCity = {};
    this.availableArrondissements = [];
    this.selectedArrondissement = '';
    this.newAddress.code_postal = '';
    this.persistDraft();
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
            this.persistDraft();
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
      this.error.selectedCity = null;
    } catch (err) {
      console.error(err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  createShop(type: string, idUser: string, onAfterCreate?: () => void): any {
    const newShopToCreate: any = {};

    newShopToCreate.name = this.newShop.name;
    newShopToCreate.handle = this.newShop.handle;
    newShopToCreate.serviceMode = this.newShop.serviceMode || 'SALON';

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

    // ✅ IMPORTANT: éviter ton 400 backend en SALON
    // On initialise placeAddress depuis step 3 (adresse & zones)
    if ((newShopToCreate.serviceMode || 'SALON') === 'SALON') {
      newShopToCreate.placeAddress = {
        addressLine1: this.str(this.newShop?.street) || undefined,
        postalCode: this.str(this.postalCode) || undefined,
        city: this.str(this.selectedCity?.nom || this.newAddress?.city) || undefined,
        country: this.selectedCountry || 'France',
        addressLine2: this.str(this.newShop?.addressLine2) || undefined,
        label: undefined,
      };
    }

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
        this.createdShopData = createdShop || null;

        this.reloadArticles();

        this.showSuccessToast(this.translate.instant('SUCCESS.SUBSCRIBE_SUCCESS'));

        if (this.dialogRef) {
          this.dialogRef.close(data);
        }

        if (onAfterCreate) onAfterCreate();

        this.persistDraft();
      },
      error: (error: any) => {
        console.error(error);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        return error;
      },
    });
  }

  // ============================================================
  // DOCS
  // ============================================================

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
      this.verificationError.kbisDoc = null;
    }
  }

  submitVerificationDocs(): void {
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
    if (!this.kbisDocFile) {
      this.verificationError.kbisDoc = this.translate.instant('CREATION_SHOP.VERIF_KBIS_REQUIRED');
    }

    // ✅ bloque si un des 3 manque
    if (this.verificationError.identityDoc || this.verificationError.insuranceDoc || this.verificationError.kbisDoc) {
      return;
    }

    this.isUploadingDocs = true;

    this.shopService.uploadVerificationDocs(this.createdShopId, {
      identityDoc: this.identityDocFile,
      insuranceDoc: this.insuranceDocFile,
      kbisDoc: this.kbisDocFile,
    }).subscribe({
      next: (resp: any) => {
        this.isUploadingDocs = false;

        // ✅ important : on refresh l’état depuis l’API (source de vérité)
        // si ton endpoint renvoie déjà verification, ok, sinon on reload
        this.verification = resp?.verification || this.verification;

        // ✅ refresh backend pour être 100% sûr
        this.loadVerificationStatus();

        this.showSuccessToast(this.translate.instant('CREATION_SHOP.VERIF_TOAST_SUCCESS'));
      },
      error: (err) => {
        this.isUploadingDocs = false;
        console.error(err);
        this.showCustomToast(this.translate.instant('CREATION_SHOP.VERIF_TOAST_ERROR'));
      },
    });
  }

  private loadVerificationStatusAsync(): Promise<any> {
    return new Promise((resolve) => {
      if (!this.createdShopId) return resolve(null);

      this.shopService.getShopVerificationStatus(this.createdShopId).subscribe({
        next: (verification: any) => {
          this.verification = verification;
          resolve(verification);
        },
        error: (err) => {
          console.error(err);
          resolve(this.verification || null);
        },
      });
    });
  }

  skipVerification(): void {
    if (this.dialogRef) {
      this.dialogRef.close({ shopId: this.createdShopId, skippedVerification: true });
    } else {
      this.finishAndGoLogin();
    }
  }


  onCategoriesUpdated() {
    // optionnel : tu peux refresh un count server ou juste laisser l’enfant émettre
  }

  async finishAndGoLogin() {
    if (this.busy || this.isUploadingDocs) return;

    this.busy = true;

    try {
      // ✅ Sauvegarde finale du shop (tout ce qu’on peut)
      const ok = await this.saveShopBeforeExit();

      if (!ok) {
        // si l’update a échoué, on NE quitte PAS (sinon tu perds l’intention de save)
        this.showCustomToast(
          this.translate.instant('ERROR.GENERIC_ERROR') || "Impossible de sauvegarder la boutique. Réessaie."
        );
        return;
      }

      // ✅ seulement après une sauvegarde OK :
      this.wizardDraft.clear();
      this.wizardOpen = false;

      this.router.navigate(['/login']);
    } catch (e) {
      console.error('[Finish] fatal:', e);
      this.showCustomToast(
        this.translate.instant('ERROR.GENERIC_ERROR') || "Une erreur est survenue. Réessaie."
      );
    } finally {
      this.busy = false;
    }
  }

  private getSelectedCountryCode(): string {
    const c: any = this.selectedCountry;

    // Si c'est déjà un code "FR", "BE", etc.
    if (typeof c === 'string') {
      const s = c.trim().toUpperCase();
      // si ton "name" est "France", on ne peut pas déduire => fallback FR
      if (s.length === 2) return s;
      return 'FR';
    }

    // Si c'est un objet (cas getCountries)
    const code =
      c?.code || c?.iso2 || c?.alpha2 || c?.countryCode || c?.name;

    if (typeof code === 'string') {
      const s = code.trim().toUpperCase();
      return s.length >= 2 ? s.slice(0, 2) : 'FR';
    }

    return 'FR';
  }



  /**
 * ✅ Force une dernière sauvegarde complète du shop (si possible)
 * - merge createdShopData + snapshot.step4.shop (priorité au snapshot)
 * - tente aussi un "flush" si le child expose une méthode (optionnel, safe)
 */
  private async saveShopBeforeExit(): Promise<boolean> {
    // Rien à sauver si pas de shop créé
    const shopId = this.createdShopData?._id || this.createdShopId;
    if (!shopId) return true;

    // 1) (Optionnel) si ton child a une méthode pour forcer la sauvegarde / flush debounce
    // -> on n'assume rien : on check au runtime
    try {
      const cmp: any = this.shopManagementCmp as any;

      // Exemples de noms possibles : adapte si tu as déjà une méthode dans le child
      if (cmp && typeof cmp.flushPendingSave === 'function') {
        await cmp.flushPendingSave();
      } else if (cmp && typeof cmp.forceSave === 'function') {
        await cmp.forceSave();
      } else if (cmp && typeof cmp.saveNow === 'function') {
        await cmp.saveNow();
      }
    } catch (e) {
      // On ne bloque pas la sortie pour ça, on log juste
      console.warn('[Finish] Child flush save failed (ignored):', e);
    }

    // 2) Build payload le + complet possible (merge)
    const mergedShop = this.buildStep4ShopToUpdate() || this.createdShopData;
    if (!mergedShop?._id) return true;

    // 3) Update backend (source de vérité)
    const updated = await this.updateShopAsync(mergedShop._id, mergedShop);
    if (!updated) return false;

    // 4) On garde la vérité serveur dans le parent (important si on revient)
    this.createdShopData = { ...updated };
    this.createdShopId = updated?._id || this.createdShopId;

    // réaligne snapshot si présent
    if (this.shopManagementSnapshot) {
      this.shopManagementSnapshot = { ...(this.shopManagementSnapshot as any), shop: updated };
    }

    this.persistDraft();
    return true;
  }

  // ============================================================
  // TOASTS
  // ============================================================

  private showCustomToast(message: string) {
    this.toastr.error(message);
  }

  private showSuccessToast(message: string) {
    this.toastr.success(message);
  }

  // ============================================================
  // STATUS PILLS
  // ============================================================

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

  // ============================================================
  // HANDLE
  // ============================================================

  private normalizeHandle(input: any): string {
    const raw = String(input ?? "").trim().replace(/^@+/, "");
    if (!raw) return "";
    const noAccents = raw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const cleaned = noAccents.toLowerCase().replace(/\s+/g, "").replace(/[^a-z0-9._]/g, "");
    return cleaned.replace(/^[._]+|[._]+$/g, "");
  }

  onShopNameTyping(value?: string) {
    this.error.name = null;

    const proposed = this.normalizeHandle(this.newShop.name || "");
    this.newShop.handle = proposed;

    this.resetHandleValidation();
    this.persistDraft();
  }

  resetHandleValidation() {
    this.handleAvailable = null;
    this.handleChecking = false;
    this.error.handle = null;
  }

  canTestHandle(): boolean {
    const handle = this.normalizeHandle(this.newShop.handle || "");
    return !!this.newShop.name && !!handle && handle.length >= 3;
  }

  testHandle() {
    const handle = this.normalizeHandle(this.newShop.handle || "");
    this.newShop.handle = handle;

    this.error.handle = null;

    if (!handle || handle.length < 3) {
      this.handleAvailable = false;
      this.error.handle = this.translate.instant('CREATION_SHOP_WIZARD.HANDLE_MIN');
      return;
    }

    this.handleChecking = true;
    this.handleAvailable = null;

    this.shopService.isHandleAvailable(handle).subscribe({
      next: (res: any) => {
        this.handleChecking = false;
        this.handleAvailable = !!res?.available;

        if (this.handleAvailable) {
          this.error.handle = null;
        } else {
          this.error.handle = this.translate.instant('CREATION_SHOP_WIZARD.HANDLE_TAKEN');
        }
      },
      error: () => {
        this.handleChecking = false;
        this.handleAvailable = null;
        this.error.handle = this.translate.instant('CREATION_SHOP_WIZARD.HANDLE_CHECK_ERROR');
      }
    });
  }

  onCompanyTypeChange() {
    this.error.companyType = null;
    this.resetHandleValidation();
  }

  // ============================================================
  // HELPERS (validation simple)
  // ============================================================

  private str(value: any): string {
    return String(value ?? '').trim();
  }

  private isNonEmpty(value: any): boolean {
    return this.str(value).length > 0;
  }

  private isValidHandle(handle: any): boolean {
    const v = this.normalizeHandle(handle);
    if (!v) return false;
    if (v.length < 3) return false;
    return /^[a-z0-9._]+$/.test(v);
  }

  private isValidPostalCode(postal: any): boolean {
    const v = this.str(postal);
    if (!v) return false;
    return /^[a-zA-Z0-9\- ]{4,10}$/.test(v);
  }

  private onlyDigits(v: any): string {
    return this.str(v).replace(/\D/g, '');
  }

  private isValidPhoneFR(phone: any): boolean {
    const digits = this.onlyDigits(phone);
    return /^0[1-9][0-9]{8}$/.test(digits);
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim().toLowerCase());
  }

  private hasAnyError(obj: any): boolean {
    if (!obj) return false;
    return Object.values(obj).some(v => !!v);
  }

  private isStepValid(step: WizardStep = this.wizardStep): boolean {
    if (step === 0) return true;

    if (step === 1) return !this.hasAnyError(this.authError);
    if (step === 2) return !this.hasAnyError(this.error);
    if (step === 3) return !this.hasAnyError(this.error);
    if (step === 5) return !this.hasAnyError(this.verificationError);

    // ✅ step 4 géré par this.shopManagementValidity + commit unique dans next()
    return true;
  }

  startStripeOnboarding(): void {
    this.stripeLoading = true;

    this.stripeService.createStripeOnboardingLink(this.me._id).subscribe({
      next: ({ url }) => {
        window.location.href = url;
      },
      error: (e) => {
        console.error(e);
        this.stripeLoading = false;
        this.toastr.error(this.translate.instant("FINANCE.START_ACTIVATION"));
      }
    });
  }

  refreshStripeStatus(): void {
    this.stripeLoading = true;

    this.stripeService.refreshStripeStatus(this.me._id).subscribe({
      next: (updatedUser) => {
        this.me = updatedUser;
        this.stripeLoading = false;
      },
      error: (e) => {
        console.error(e);
        this.stripeLoading = false;
        this.toastr.error(this.translate.instant("FINANCE.REFRESH_STRIPE"));
      }
    });
  }

  copyToClipboard(text: string) {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    this.toastr.success(this.translate.instant("FINANCE.HANDLE_COPY"));
  }

  async copyIcsLink() {
    if (!this.icsUrl) {
      this.showCustomToast(
        this.translate.instant('SETTINGS.ICS.TOAST.NO_LINK') || 'Aucun lien .ics à copier.'
      );
      return;
    }

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(this.icsUrl);
        this.showSuccessToast(
          this.translate.instant('SETTINGS.ICS.TOAST.COPY_SUCCESS') || 'Lien .ics copié.'
        );
        return;
      }

      // fallback old browsers
      const textarea = document.createElement('textarea');
      textarea.value = this.icsUrl;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);

      this.showSuccessToast(
        this.translate.instant('SETTINGS.ICS.TOAST.HANDLE_COPY') || 'Lien .ics copié.'
      );
    } catch (e) {
      console.error(e);
      this.showCustomToast(
        this.translate.instant('SETTINGS.ICS.TOAST.COPY_ERROR') || 'Impossible de copier le lien.'
      );
    }
  }
}
