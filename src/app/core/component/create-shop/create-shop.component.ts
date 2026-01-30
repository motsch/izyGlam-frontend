import { Component, Inject, OnInit, Optional } from '@angular/core';
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
import { ShopTemplateService } from '../../services/shop-template.service';

// ✅ Auth existante (sign-in)
import { AuthenticationService } from 'src/app/core/services/authentication.service';
import { SessionService } from 'src/app/core/services/session.service';

// ✅ comme dans ton signup
import { v4 as uuidv4 } from 'uuid';

type WizardStep = 0 | 1 | 2 | 3 | 4;
type ServiceMode = 'SALON' | 'DOMICILE';

@Component({
  selector: 'app-create-shop',
  templateUrl: './create-shop.component.html',
  styleUrls: ['./create-shop.component.scss'],
})
export class CreateShopComponent implements OnInit {

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
  wizardHeaderImage = 'assets/images/onboarding/shop-0.png';

  // ============================================================
  // AUTH STEP (STEP 1)
  // ============================================================
  /**
   * authUser = mini form
   * - si email existe => password seulement
   * - si email n'existe pas => register complet
   *
   * (ngModel partout → simple)
   */
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

  // ✅ spinner refresh activation
  checkingActivation = false;
  lastActivationCheckAt: Date | null = null;

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
  selectedCountry = 'France';
  selectedCity: any = {};
  selectedArrondissement = '';
  availableCountries: any[] = [];
  availableCities: any[] = [];
  postalCode = '';

  // ============================================================
  // WIZARD
  // ============================================================
  wizardOpen = false;
  wizardStep: WizardStep = 0;
  showErrors = false;
  busy = false;

  wizardSteps: Array<{ title: string; subtitle: string; image: string }> = [
    { title: 'CREATION_SHOP_WIZARD.S0_TITLE', subtitle: 'CREATION_SHOP_WIZARD.S0_SUBTITLE', image: 'assets/images/onboarding/shop-0.png' },
    { title: 'CREATION_SHOP_WIZARD.AUTH_TITLE', subtitle: 'CREATION_SHOP_WIZARD.AUTH_SUBTITLE', image: 'assets/images/onboarding/shop-auth.png' },
    { title: 'CREATION_SHOP_WIZARD.S1_TITLE', subtitle: 'CREATION_SHOP_WIZARD.S1_SUBTITLE', image: 'assets/images/onboarding/shop-1.png' },
    { title: 'CREATION_SHOP_WIZARD.S2_TITLE', subtitle: 'CREATION_SHOP_WIZARD.S2_SUBTITLE', image: 'assets/images/onboarding/shop-2.png' },
    { title: 'CREATION_SHOP_WIZARD.S3_TITLE', subtitle: 'CREATION_SHOP_WIZARD.S3_SUBTITLE', image: 'assets/images/onboarding/shop-3.png' },
  ];

  get progressPercent(): number {
    const max = this.wizardSteps.length - 1;
    return Math.round((this.wizardStep / max) * 100);
  }

  createdShopId: string | null = null;

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

  // ============================================================
  // HANDLE
  // ============================================================
  handleChecking = false;
  handleAvailable: boolean | null = null;

  constructor(
    private userService: UserService,
    private shopService: ShopService,
    private shopTemplateService: ShopTemplateService,
    private countryService: CountryService,
    private router: Router,
    private villeService: VilleService,
    private categoryService: CategoryService,
    private translate: TranslateService,
    private toastr: ToastrService,

    // ✅ auth services
    private authenticationService: AuthenticationService,
    private sessionService: SessionService,

    @Optional() public dialogRef?: MatDialogRef<CreateShopComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: any
  ) { }

  ngOnInit() {
    // ----------------------------------------------------------
    // 1) Catégories
    // ----------------------------------------------------------
    this.categoryService.getAll().subscribe({
      next: (data: any) => (this.categories = data || []),
      error: () => this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR')),
    });

    // ----------------------------------------------------------
    // 2) Defaults shop
    // ----------------------------------------------------------
    this.newShop.companyType = 'coiffure';
    this.newShop.countryIndication = 'FR';
    this.newShop.serviceMode = 'SALON' as ServiceMode;

    // ----------------------------------------------------------
    // 3) "Me" : si token déjà présent, on est connecté
    // ----------------------------------------------------------
    this.userService.getMe().subscribe({
      next: (data: any) => {
        this.me = { ...data };
        this.isUserConnected = true;
        this.alreadyProfessionnal = this.me.role === 'professionnel' || this.me.role === 'entreprise';
      },
      error: () => {
        // pas connecté -> OK, le wizard gère l'auth
        this.isUserConnected = false;
      },
    });

    // ----------------------------------------------------------
    // 4) Pays
    // ----------------------------------------------------------
    this.countryService.getAll({ active: true }).subscribe({
      next: (countries: any[]) => (this.availableCountries = countries || []),
      error: (err) => console.error('Erreur pays :', err),
    });
  }

  // ============================================================
  // WIZARD CONTROLS
  // ============================================================

  openWizard() {
    // ✅ si déjà pro -> on bloque (tu gardes ta logique)
    if (this.alreadyProfessionnal) return;

    this.wizardOpen = true;
    this.wizardStep = 0;

    // reset UI state
    this.showErrors = false;
    this.error = {};
    this.authError = {};
    this.verificationError = {};
    this.busy = false;

    // reset creation state
    this.createdShopId = null;
    this.verification = null;

    // reset auth state
    this.authEmailExists = null;
    this.pendingEmailVerification = false;
    this.checkingActivation = false;
    this.lastActivationCheckAt = null;

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

    // reset shop fields (valeurs par défaut)
    this.newShop = {
      companyType: this.newShop.companyType || 'coiffure',
      countryIndication: 'FR',
      serviceMode: (this.newShop.serviceMode || 'SALON') as ServiceMode,
      ccvaccepted: false,
      maxDistance: this.newShop.maxDistance || 15,
    };

    // reset address fields
    this.deliveryPostalCodesList = [];
    this.deliveryPostalCode = '';
    this.postalCode = '';
    this.selectedCity = {};
    this.selectedArrondissement = '';
    this.availableCities = [];
    this.availableArrondissements = [];
    this.latitude = 0.0;
    this.longitude = 0.0;

    // reset handle validation
    this.resetHandleValidation();
  }

  closeWizard() {
    if (this.busy || this.isUploadingDocs) return;
    this.wizardOpen = false;
  }

  prev() {
    if (this.busy) return;
    this.showErrors = false;
    this.wizardStep = (Math.max(0, this.wizardStep - 1) as WizardStep);
  }

  /**
   * NEXT
   * - step0 : si connecté -> skip auth (go step2)
   * - step1 : login OU register (puis attente validation mail)
   * - step3 : create shop avant docs
   */
  async next() {
    if (this.busy) return;

    // ✅ on affiche les erreurs si besoin (pas bloquant partout, mais utile)
    this.showErrors = true;
    this.validateCurrentStep();

    // -------------------------------------------
    // Step 0 -> Step 1 (auth) OU Step 2 (si connecté)
    // -------------------------------------------
    if (this.wizardStep === 0) {
      this.showErrors = false;

      // si déjà connecté, pas besoin auth
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

      // ✅ si on est en attente email, on bloque totalement la suite
      if (this.pendingEmailVerification) {
        this.showCustomToast("Validez d'abord votre email, puis cliquez sur ↻.");
        return;
      }

      const ok = await this.ensureAuthenticatedBeforeShop();
      if (!ok) return; // reste sur step 1

      // après login : on passe aux infos shop
      this.showErrors = false;
      this.wizardStep = 2;
      return;
    }

    // -------------------------------------------
    // Step 3 -> Step 4 : create shop avant docs
    // -------------------------------------------
    if (this.wizardStep === 3) {
      await this.ensureShopCreated();
      if (!this.createdShopId) return;

      this.showErrors = false;
      this.wizardStep = 4;
      this.loadVerificationStatus();
      return;
    }

    // -------------------------------------------
    // Step normal : +1
    // -------------------------------------------
    this.showErrors = false;
    this.wizardStep = (Math.min(4, (this.wizardStep + 1)) as WizardStep);

    // si on arrive aux docs : on récupère statut
    if (this.wizardStep === 4) {
      this.loadVerificationStatus();
    }
  }

  hideBrokenImg(ev: Event) {
    const img = ev.target as HTMLImageElement;
    img.style.display = 'none';
  }

  // ============================================================
  // AUTH STEP LOGIC
  // ============================================================

  /**
   * (blur email)
   * - reset erreurs
   * - si email valid => check exists in DB
   * - et reset le mode "pending" (si user change l'email)
   */
  onAuthEmailBlur() {
    this.authError.email = null;

    // si user retape un email, on sort du mode "pending"
    this.pendingEmailVerification = false;
    this.lastActivationCheckAt = null;

    const email = this.str(this.authUser.email);

    if (!email) {
      this.authEmailExists = null;
      return;
    }

    if (!this.isValidEmail(email)) {
      this.authEmailExists = null;
      this.authError.email = "L'email doit ressembler à xx@xx.xx";
      return;
    }

    // ✅ check exists
    this.checkEmailExists(email);
  }

  /**
   * Appel backend -> "email exists"
   * (retour attendu: { exists: true/false })
   */
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

  /**
   * Version async (utile quand on veut forcer un check avant de continuer)
   */
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

  /**
   * ✅ Flow auth simple + robuste
   *
   * - si email existe => login (password obligatoire)
   * - si email n'existe pas => register (puis on attend validation email, on reste sur step 1)
   */
  private async ensureAuthenticatedBeforeShop(): Promise<boolean> {
    // reset erreurs
    this.authError = {};

    const email = this.str(this.authUser.email);
    const password = this.str(this.authUser.password);

    // ----------------------------------------------------------
    // 1) validations simples
    // ----------------------------------------------------------
    if (!email) {
      this.authError.email = "L'email est obligatoire";
      return false;
    }
    if (!this.isValidEmail(email)) {
      this.authError.email = "L'email doit ressembler à xx@xx.xx";
      return false;
    }

    // si on ne sait pas si l'email existe encore -> on check
    if (this.authEmailExists === null) {
      await this.checkEmailExistsAsync(email);

      if (this.authEmailExists === null) {
        this.authError.email = "Impossible de vérifier cet email (endpoint email-exists).";
        return false;
      }
    }

    // ----------------------------------------------------------
    // 2) email existe => login
    // ----------------------------------------------------------
    if (this.authEmailExists === true) {
      if (!password) {
        this.authError.password = "Le mot de passe est obligatoire";
        return false;
      }
      return await this.loginAndLoadMe(email, password);
    }

    // ----------------------------------------------------------
    // 3) email n'existe pas => register puis attente mail
    // ----------------------------------------------------------
    if (this.authEmailExists === false) {

      // champs register minimum
      if (!this.isNonEmpty(this.authUser.sex)) this.authError.sex = "Le genre est obligatoire";
      if (!this.isNonEmpty(this.authUser.firstname) || this.str(this.authUser.firstname).length < 2) this.authError.firstname = "Le prénom est obligatoire (min 2)";
      if (!this.isNonEmpty(this.authUser.lastname) || this.str(this.authUser.lastname).length < 2) this.authError.lastname = "Le nom est obligatoire (min 2)";
      if (!this.isValidPhoneFR(this.authUser.phone)) this.authError.phone = "Téléphone invalide (ex: 0612345678)";
      if (!this.isNonEmpty(this.authUser.password)) this.authError.password = "Mot de passe obligatoire";
      if (!this.isNonEmpty(this.authUser.passwordConfirmed)) this.authError.passwordConfirmed = "Confirmation obligatoire";
      if (this.str(this.authUser.passwordConfirmed) !== this.str(this.authUser.password)) this.authError.passwordConfirmed = "Les mots de passe ne correspondent pas";
      if (!this.isNonEmpty(this.authUser.country)) this.authError.country = "Pays obligatoire";

      // si erreur -> stop
      const hasError = Object.values(this.authError).some(v => !!v);
      if (hasError) return false;

      // payload (comme ton signup)
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

      // ✅ ICI : nouveau comportement
      // On NE login PAS / On ne quitte PAS le stepper.
      // On attend active=true (email validé)
      this.pendingEmailVerification = true;
      this.lastActivationCheckAt = null;

      this.showSuccessToast(
        this.translate.instant('SIGNUP.VERIFICATION_EMAIL_SENT') || "Email envoyé. Vérifiez votre boîte mail."
      );

      // false => next() restera sur le step 1
      return false;
    }

    return false;
  }

  /**
   * ✅ Register no token
   */
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

  /**
   * ✅ Login + set token + load me
   * (exactement l'esprit de ton SignIn)
   */
  private loginAndLoadMe(email: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.busy = true;

      this.authenticationService.login(email, password).subscribe({
        next: (user: any) => {
          // ✅ stock token
          this.sessionService.setCurrentUser(user.token, true);

          // ✅ reload me
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

  /**
   * ✅ input phone : digits only (comme ton signup)
   */
  onAuthPhoneInput() {
    this.authUser.phone = this.onlyDigits(this.authUser.phone).slice(0, 10);
  }

  /**
   * ✅ Refresh activation (active=true)
   * ⚠️ endpoint à faire plus tard, mais tout le front est prêt
   */
  checkIfUserIsActivated() {
    if (this.checkingActivation || this.busy) return;

    const email = this.str(this.authUser.email);
    if (!email || !this.isValidEmail(email)) {
      this.authError.email = "Email invalide";
      return;
    }

    this.checkingActivation = true;
    this.lastActivationCheckAt = new Date();

    // ⚠️ backend à faire plus tard : POST /users-check-active { email }
    this.userService.checkUserActiveByEmail(email).subscribe({
      next: (res: any) => {
        this.checkingActivation = false;

        const isActive = !!res?.active;

        if (!isActive) {
          this.showCustomToast("Pas encore activé. Cliquez à nouveau après avoir validé l'email.");
          return;
        }

        // ✅ actif => on sort du pending
        this.pendingEmailVerification = false;

        // ✅ l'email existe forcément maintenant
        this.authEmailExists = true;

        // UX : on reset password (optionnel)
        this.authUser.password = '';

        this.showSuccessToast("Compte activé ✅ Entrez votre mot de passe pour continuer.");
      },
      error: (err: any) => {
        this.checkingActivation = false;
        console.error(err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });
  }

  /**
   * Optionnel : renvoyer l'email d'activation (tu as déjà la route)
   */
  resendActivationEmail() {
    const email = this.str(this.authUser.email);
    if (!email || !this.isValidEmail(email)) {
      this.authError.email = "Email invalide";
      return;
    }

    this.busy = true;
    this.userService.resendVerificationEmail(email).subscribe({
      next: () => {
        this.busy = false;
        this.showSuccessToast("Email renvoyé ✅");
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

    // ----------------------------------------------------------
    // Step 0 : intro -> rien
    // ----------------------------------------------------------
    if (step === 0) return;

    // ----------------------------------------------------------
    // Step 1 : Auth
    // ----------------------------------------------------------
    if (step === 1) {
      // reset
      this.authError.email = null;
      this.authError.password = null;
      this.authError.passwordConfirmed = null;
      this.authError.firstname = null;
      this.authError.lastname = null;
      this.authError.phone = null;
      this.authError.sex = null;
      this.authError.country = null;

      // email
      if (!this.isNonEmpty(this.authUser.email)) {
        this.authError.email = "L'email est obligatoire";
      } else if (!this.isValidEmail(this.authUser.email)) {
        this.authError.email = "L'email doit ressembler à xx@xx.xx";
      }

      // si on est pending => pas besoin de valider le reste ici
      if (this.pendingEmailVerification) return;

      // email existe => password requis
      if (this.authEmailExists === true) {
        if (!this.isNonEmpty(this.authUser.password)) {
          this.authError.password = "Le mot de passe est obligatoire";
        }
      }

      // email n'existe pas => register minimal
      if (this.authEmailExists === false) {
        if (!this.isNonEmpty(this.authUser.sex)) this.authError.sex = "Le genre est obligatoire";
        if (!this.isNonEmpty(this.authUser.firstname) || this.str(this.authUser.firstname).length < 2) this.authError.firstname = "Prénom obligatoire (min 2)";
        if (!this.isNonEmpty(this.authUser.lastname) || this.str(this.authUser.lastname).length < 2) this.authError.lastname = "Nom obligatoire (min 2)";
        if (!this.isValidPhoneFR(this.authUser.phone)) this.authError.phone = "Téléphone invalide (ex: 0612345678)";
        if (!this.isNonEmpty(this.authUser.password)) this.authError.password = "Mot de passe obligatoire";
        if (!this.isNonEmpty(this.authUser.passwordConfirmed)) this.authError.passwordConfirmed = "Confirmation obligatoire";
        if (this.isNonEmpty(this.authUser.passwordConfirmed) && this.str(this.authUser.passwordConfirmed) !== this.str(this.authUser.password)) {
          this.authError.passwordConfirmed = "Les mots de passe ne correspondent pas";
        }
        if (!this.isNonEmpty(this.authUser.country)) this.authError.country = "Pays obligatoire";
      }
      return;
    }

    // ----------------------------------------------------------
    // Step 2 : infos shop
    // ----------------------------------------------------------
    if (step === 2) {
      this.error.name = null;
      this.error.companyType = null;
      this.error.handle = null;

      if (!this.isNonEmpty(this.newShop?.name)) this.error.name = this.translate.instant('CREATION_SHOP.ERROR1');
      if (!this.isNonEmpty(this.newShop?.companyType)) this.error.companyType = this.translate.instant('CREATION_SHOP.ERROR3');

      const h = this.normalizeHandle(this.newShop?.handle);
      if (!this.isNonEmpty(h)) this.error.handle = this.translate.instant('CREATION_SHOP_WIZARD.HANDLE_REQUIRED');
      else if (!this.isValidHandle(h)) this.error.handle = this.translate.instant('CREATION_SHOP_WIZARD.HANDLE_MIN');
      return;
    }

    // ----------------------------------------------------------
    // Step 3 : adresse
    // ----------------------------------------------------------
    if (step === 3) {
      this.error.selectedCountry = null;
      this.error.postalCode = null;
      this.error.selectedCity = null;
      this.error.street = null;
      this.error.ccvaccepted = null;

      if (!this.isNonEmpty(this.selectedCountry)) this.error.selectedCountry = this.translate.instant('CREATION_SHOP.CHOOSE_COUNTRY');

      if (!this.isNonEmpty(this.postalCode)) this.error.postalCode = "Code postal obligatoire";
      else if (!this.isValidPostalCode(this.postalCode)) this.error.postalCode = "Code postal invalide";

      if (!this.selectedCity || !this.isNonEmpty(this.selectedCity?.nom)) this.error.selectedCity = this.translate.instant('CREATION_SHOP.CHOOSE_CITY');

      if (!this.isNonEmpty(this.newShop?.street)) this.error.street = this.translate.instant('CREATION_SHOP.ERROR2');

      if (!this.newShop?.ccvaccepted) this.error.ccvaccepted = this.translate.instant('CREATION_SHOP.ERROR8');
      return;
    }

    // ----------------------------------------------------------
    // Step 4 : docs
    // ----------------------------------------------------------
    if (step === 4) {
      this.verificationError.identityDoc = null;
      this.verificationError.insuranceDoc = null;

      if (!this.identityDocFile) this.verificationError.identityDoc = this.translate.instant('CREATION_SHOP.VERIF_ID_REQUIRED');
      if (!this.insuranceDocFile) this.verificationError.insuranceDoc = this.translate.instant('CREATION_SHOP.VERIF_INSURANCE_REQUIRED');
      return;
    }
  }

  // ============================================================
  // SHOP CREATION / ADDRESS / ZONES
  // ============================================================

  private async ensureShopCreated(): Promise<void> {
    if (this.createdShopId) return;

    // sécurité : impossible de créer shop si pas connecté
    if (!this.me?._id) {
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      return;
    }

    this.busy = true;

    try {
      // 1) Update user role + shopCompany
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

      // 2) Create shop
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
  }

  addPostalCode() {
    try {
      if (!this.deliveryPostalCode) return;

      // duplication
      if (this.deliveryPostalCodesList.includes(this.deliveryPostalCode)) {
        this.error.deliveryPostalCode = this.translate.instant('CREATION_SHOP_WIZARD.POSTAL_DUP');
        return;
      }

      // check DB postal code
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

          // si une seule ville => auto select
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

    // champs essentiels
    newShopToCreate.name = this.newShop.name;
    newShopToCreate.handle = this.newShop.handle;
    newShopToCreate.serviceMode = this.newShop.serviceMode || 'SALON';

    // pays
    newShopToCreate.country =
      this.selectedCountry || this.newShop.country || this.newShop.countryIndication || 'France';

    // catégorie
    let categoryToSelect = this.categories.find((x: any) => x.filter === type);
    if (!categoryToSelect) {
      categoryToSelect = { descriptionTrad: 'Description par défaut', trad: 'Autres', filter: type };
    }

    const description = categoryToSelect.descriptionTrad || 'Description par défaut';
    newShopToCreate.description_original = description;
    newShopToCreate.description = description;
    newShopToCreate.filter = categoryToSelect.filter || type;

    // valeurs par défaut
    newShopToCreate.image = 'default.png';
    newShopToCreate.note = '5';
    newShopToCreate.type = type;

    // localisation
    newShopToCreate.ville = this.selectedCity?.nom || this.newAddress?.city || 'Paris';
    newShopToCreate.district = this.selectedArrondissement || this.newAddress?.district || undefined;

    // options
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

    // horaires par défaut
    newShopToCreate.hours = {
      monday: { morning: { start: '09:00', end: '12:00' }, afternoon: { start: '13:00', end: '18:00' }, closed: false },
      tuesday: { morning: { start: '09:00', end: '12:00' }, afternoon: { start: '13:00', end: '18:00' }, closed: false },
      wednesday: { morning: { start: '09:00', end: '12:00' }, afternoon: { start: '13:00', end: '18:00' }, closed: false },
      thursday: { morning: { start: '09:00', end: '12:00' }, afternoon: { start: '13:00', end: '18:00' }, closed: false },
      friday: { morning: { start: '09:00', end: '12:00' }, afternoon: { start: '13:00', end: '18:00' }, closed: false },
      saturday: { morning: { start: '09:00', end: '12:00' }, afternoon: { start: '13:00', end: '18:00' }, closed: false },
      sunday: { morning: { start: '09:00', end: '12:00' }, afternoon: { start: '13:00', end: '18:00' }, closed: false },
    };

    // create shop
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
      this.finishAndGoLogin();
    }
  }

  finishAndGoLogin() {
    this.wizardOpen = false;
    this.router.navigate(['/login']);
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

    // ✅ auto propose handle (simple)
    const proposed = this.normalizeHandle(this.newShop.name || "");
    this.newShop.handle = proposed;

    // reset handle status
    this.resetHandleValidation();
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

    // validations handle simples
    if (!handle || handle.length < 3) {
      this.handleAvailable = false;
      this.error.handle = this.translate.instant('CREATION_SHOP_WIZARD.HANDLE_MIN');
      return;
    }

    // call backend
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

  /**
   * téléphone FR simple (comme ton pattern signup)
   */
  private isValidPhoneFR(phone: any): boolean {
    const digits = this.onlyDigits(phone);
    return /^0[1-9][0-9]{8}$/.test(digits);
  }

  /**
   * email simple
   */
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim().toLowerCase());
  }

}
