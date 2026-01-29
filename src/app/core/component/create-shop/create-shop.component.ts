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

// ✅ on reprend ton auth existante (sign-in)
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

  // ------------------------------------------------------------
  // ERREURS
  // ------------------------------------------------------------
  error: any = {};
  verificationError: any = {};

  // ✅ erreurs dédiées au step AUTH
  authError: any = {};

  // ------------------------------------------------------------
  // DATA USER / SHOP
  // ------------------------------------------------------------
  me: any = {};
  newShop: any = {};

  isUserConnected = false;
  alreadyProfessionnal = false;

  categories: any[] = [];

  // ------------------------------------------------------------
  // AUTH STEP (nouveau)
  // ------------------------------------------------------------

  /**
   * authUser = "mini form" pour :
   * - login si email existe
   * - register si email n'existe pas
   *
   * On garde un objet simple (ngModel partout).
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
   * null = pas encore testé
   * true = email existe en BDD
   * false = email inconnu → on proposera les champs de register
   */
  authEmailExists: boolean | null = null;

  authPasswordVisible = false;
  authPasswordVisible2 = false;

  // ------------------------------------------------------------
  // ADRESSE / ZONES
  // ------------------------------------------------------------
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

  // ------------------------------------------------------------
  // WIZARD
  // ------------------------------------------------------------
  wizardOpen = false;
  wizardStep: WizardStep = 0;
  showErrors = false;
  busy = false;

  wizardSteps: Array<{ title: string; subtitle: string; image: string }> = [
    { title: 'CREATION_SHOP_WIZARD.S0_TITLE', subtitle: 'CREATION_SHOP_WIZARD.S0_SUBTITLE', image: 'assets/images/onboarding/shop-0.png' },
    // ✅ nouveau step auth
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

  // ------------------------------------------------------------
  // DOCS
  // ------------------------------------------------------------
  identityDocFile: File | null = null;
  insuranceDocFile: File | null = null;
  kbisDocFile: File | null = null;

  identityDocFileName: string | null = null;
  insuranceDocFileName: string | null = null;
  kbisDocFileName: string | null = null;

  verification: any = null;
  isUploadingDocs = false;

  // ------------------------------------------------------------
  // HANDLE
  // ------------------------------------------------------------
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

    // ✅ auth services
    private authenticationService: AuthenticationService,
    private sessionService: SessionService,

    @Optional() public dialogRef?: MatDialogRef<CreateShopComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: any
  ) { }

  ngOnInit() {
    // -----------------------------------------
    // 1) Catégories (inchangé)
    // -----------------------------------------
    this.categoryService.getAll().subscribe({
      next: (data: any) => (this.categories = data || []),
      error: () => this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR')),
    });

    // -----------------------------------------
    // 2) Defaults shop (inchangé)
    // -----------------------------------------
    this.newShop.companyType = 'coiffure';
    this.newShop.countryIndication = 'FR';
    this.newShop.serviceMode = 'SALON' as ServiceMode;

    // -----------------------------------------
    // 3) "Me" : si token déjà présent, on est connecté
    // Sinon ça fail → normal : on laisse le wizard gérer l'auth
    // -----------------------------------------
    this.userService.getMe().subscribe({
      next: (data: any) => {
        this.me = { ...data };
        this.isUserConnected = true;
        this.alreadyProfessionnal = this.me.role === 'professionnel' || this.me.role === 'entreprise';
      },
      error: () => {
        // Pas connecté → OK, on ne bloque plus
        this.isUserConnected = false;
      },
    });

    // -----------------------------------------
    // 4) Pays (inchangé)
    // -----------------------------------------
    this.countryService.getAll({ active: true }).subscribe({
      next: (countries: any[]) => (this.availableCountries = countries || []),
      error: (err) => console.error('Erreur pays :', err),
    });
  }

  // ============================================================
  // WIZARD CONTROLS
  // ============================================================

  openWizard() {
    // ✅ vérif 1 (on garde)
    if (this.alreadyProfessionnal) return;

    this.wizardOpen = true;
    this.wizardStep = 0;

    this.showErrors = false;
    this.error = {};
    this.authError = {};
    this.verificationError = {};
    this.busy = false;

    // reset creation state
    this.createdShopId = null;
    this.verification = null;

    // reset shop fields
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

    // reset auth step
    this.authEmailExists = null;
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

    this.resetHandleValidation();
  }

  closeWizard() {
    if (this.busy || this.isUploadingDocs) return;
    this.wizardOpen = false;
  }

  prev() {
    if (this.busy) return;
    this.showErrors = false;

    // simple step - 1
    this.wizardStep = (Math.max(0, this.wizardStep - 1) as WizardStep);
  }

  /**
   * NEXT ultra simple, MAIS avec 2 exceptions indispensables :
   * - step0 : si déjà connecté -> on skip le step auth, on va direct à step2
   * - step1 : on exécute l'auth (login ou register+login)
   * - step3 : on crée le shop avant d'aller au step docs (sinon pas d'ID)
   */
  async next() {
    if (this.busy) return;

    // Tu veux connecter les validations plus tard.
    // Mais tu peux déjà afficher les erreurs :
    this.showErrors = true;
    this.validateCurrentStep();

    // -------------------------------------------
    // Step 0 -> Step 1 (auth) OU Step 2 (si connecté)
    // -------------------------------------------
    if (this.wizardStep === 0) {
      this.showErrors = false;

      // Si déjà connecté (token déjà présent), pas besoin de step auth
      if (this.isUserConnected) {
        this.wizardStep = 2;
        return;
      }

      // Sinon on passe au step auth
      this.wizardStep = 1;
      return;
    }

    // -------------------------------------------
    // Step 1 (auth) : on doit obtenir un user connecté
    // -------------------------------------------
    if (this.wizardStep === 1) {
      const ok = await this.ensureAuthenticatedBeforeShop();
      if (!ok) return; // on reste sur le step 1, erreurs affichées

      // Après login/register : on passe aux infos shop
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
    // Sinon : step + 1 simple
    // -------------------------------------------
    this.showErrors = false;
    this.wizardStep = (Math.min(4, (this.wizardStep + 1)) as WizardStep);

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
   * Au blur de l'email :
   * - si email invalide -> on ne fait rien
   * - sinon -> check en BDD si existe
   */
  onAuthEmailBlur() {
    // reset erreurs UI
    this.authError.email = null;

    const email = this.str(this.authUser.email);

    // Si vide -> pas d'appel
    if (!email) {
      this.authEmailExists = null;
      return;
    }

    // Email mal formé -> on affiche une erreur simple
    if (!this.isValidEmail(email)) {
      this.authEmailExists = null;
      this.authError.email = "L'email doit ressembler à xx@xx.xx";
      return;
    }

    // ✅ check "email exists"
    this.checkEmailExists(email);
  }

  /**
   * IMPORTANT :
   * Ici tu dois brancher ton endpoint "email exists".
   *
   * Je te donne 2 approches :
   * A) tu as déjà une méthode côté UserService => tu l'appelles.
   * B) tu n'en as pas => tu la crées côté backend (simple route) puis ici.
   *
   * Pour éviter que ton TS casse si le nom est différent, je passe par (this.userService as any)
   * --> Tu pourras remplacer par la vraie méthode quand tu veux.
   */
  private checkEmailExists(email: string) {
    this.busy = true;
    this.authEmailExists = null;

    // ⚠️ Remplace "existsByEmail" par TA vraie méthode si besoin.
    // Exemple attendu : return { exists: true/false }
    const service: any = this.userService as any;

    // Si tu as une méthode du style:
    // userService.existsByEmail(email).subscribe(...)
    if (typeof service.existsByEmail === 'function') {
      service.existsByEmail(email).subscribe({
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
      return;
    }

    // Sinon : fallback → tu n'as pas encore la route.
    // On log pour que tu le voies immédiatement.
    this.busy = false;
    console.warn('[CreateShop] Il manque une méthode userService.existsByEmail(email). Branche ton endpoint "email exists".');
    // Valeur par défaut : on ne sait pas → on force l'utilisateur à tester via bouton ou tu branches la route.
    this.authEmailExists = null;
  }

  /**
   * Ce bloc fait EXACTEMENT ce que tu veux :
   * - si email inconnu -> register (createNoToken) -> login -> set session -> getMe
   * - si email connu -> login -> set session -> getMe
   *
   * On fait SIMPLE, avec des messages simples.
   */
  private async ensureAuthenticatedBeforeShop(): Promise<boolean> {
    this.authError = {};

    const email = this.str(this.authUser.email);
    const password = this.str(this.authUser.password);

    // ----------------------------------------------------------
    // 1) Validations ultra simples (sans se prendre la tête)
    // ----------------------------------------------------------

    if (!email) {
      this.authError.email = "L'email est obligatoire";
      return false;
    }
    if (!this.isValidEmail(email)) {
      this.authError.email = "L'email doit ressembler à xx@xx.xx";
      return false;
    }

    // Si on ne sait pas encore si l'email existe : on force un check
    if (this.authEmailExists === null) {
      // On tente de check ; si ça ne marche pas (pas branché), on demandera un choix
      await this.checkEmailExistsAsync(email);
      if (this.authEmailExists === null) {
        this.authError.email = "Impossible de vérifier cet email. (endpoint email-exists à brancher)";
        return false;
      }
    }

    // ----------------------------------------------------------
    // 2) Si email existe → on fait un login
    // ----------------------------------------------------------
    if (this.authEmailExists === true) {

      if (!password) {
        this.authError.password = "Le mot de passe est obligatoire";
        return false;
      }

      const ok = await this.loginAndLoadMe(email, password);
      return ok;
    }

    // ----------------------------------------------------------
    // 3) Si email n'existe pas → on crée un user puis login
    // ----------------------------------------------------------
    if (this.authEmailExists === false) {

      // Champs minimum (comme ton signup)
      if (!this.isNonEmpty(this.authUser.sex)) this.authError.sex = "Le genre est obligatoire";
      if (!this.isNonEmpty(this.authUser.firstname) || this.authUser.firstname.length < 2) this.authError.firstname = "Le prénom est obligatoire (min 2)";
      if (!this.isNonEmpty(this.authUser.lastname) || this.authUser.lastname.length < 2) this.authError.lastname = "Le nom est obligatoire (min 2)";
      if (!this.isValidPhoneFR(this.authUser.phone)) this.authError.phone = "Le numéro de téléphone n'est pas valide (ex: 0612345678)";
      if (!password) this.authError.password = "Le mot de passe est obligatoire";
      if (!this.isNonEmpty(this.authUser.passwordConfirmed)) this.authError.passwordConfirmed = "La confirmation de mot de passe est obligatoire";
      if (this.str(this.authUser.passwordConfirmed) !== password) this.authError.passwordConfirmed = "Les mots de passe ne correspondent pas";
      if (!this.isNonEmpty(this.authUser.country)) this.authError.country = "Le pays est obligatoire";

      // S'il y a au moins une erreur → stop
      const hasError = Object.values(this.authError).some(v => !!v);
      if (hasError) return false;

      // Payload user comme ton signup
      const payload: any = {
        sex: this.authUser.sex,
        firstname: this.authUser.firstname,
        lastname: this.authUser.lastname,
        phone: this.onlyDigits(this.authUser.phone),
        email,
        password,
        passwordConfirmed: this.authUser.passwordConfirmed,
        country: this.authUser.country,

        // user classique
        role: 'user',

        // conversationId obligatoire chez toi
        conversationId: uuidv4(),

        // fidelity comme ton signup
        fidelity: {
          stars: 0,
          card_expiration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          rewards_history: [],
        },
      };

      const created = await this.registerNoToken(payload);
      if (!created) return false;

      // Après register : login pour obtenir le token
      const ok = await this.loginAndLoadMe(email, password);
      return ok;
    }

    return false;
  }

  /**
   * Petit utilitaire : checkEmailExists en "await"
   * - on wrap en Promise pour garder next() clean
   */
  private checkEmailExistsAsync(email: string): Promise<void> {
    return new Promise((resolve) => {
      this.busy = true;
      const service: any = this.userService as any;

      if (typeof service.existsByEmail !== 'function') {
        this.busy = false;
        this.authEmailExists = null;
        resolve();
        return;
      }

      service.existsByEmail(email).subscribe({
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
   * Register no token (comme ton signup)
   * - userService.createNoToken(payload)
   */
  private registerNoToken(payload: any): Promise<boolean> {
    return new Promise((resolve) => {
      this.busy = true;

      const service: any = this.userService as any;

      if (typeof service.createNoToken !== 'function') {
        this.busy = false;
        console.warn('[CreateShop] Il manque userService.createNoToken(user).');
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        resolve(false);
        return;
      }

      service.createNoToken(payload).subscribe({
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
   * Login + setCurrentUser(token) + refresh getMe
   * => indispensable pour que createShop / upload marchent derrière
   */
  private loginAndLoadMe(email: string, password: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.busy = true;

      this.authenticationService.login(email, password).subscribe({
        next: (user: any) => {
          // ✅ on stocke le token comme ton sign-in
          this.sessionService.setCurrentUser(user.token, true);

          // ✅ puis on recharge "me"
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
          // message backend souvent utile ici (mauvais mdp, etc)
          this.authError.password = err?.error?.message || "Mot de passe incorrect";
          resolve(false);
        }
      });
    });
  }

  onAuthPhoneInput() {
    // Comme ton signup : digits only, max 10
    this.authUser.phone = this.onlyDigits(this.authUser.phone).slice(0, 10);
  }

  // ============================================================
  // SERVICE MODE
  // ============================================================

  setServiceMode(mode: ServiceMode) {
    this.newShop.serviceMode = mode;
  }

  // ============================================================
  // VALIDATIONS (simple + commentée, pas encore “bloquante”)
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
      // reset erreurs visibles
      this.authError.email = null;
      this.authError.password = null;
      this.authError.passwordConfirmed = null;
      this.authError.firstname = null;
      this.authError.lastname = null;
      this.authError.phone = null;
      this.authError.sex = null;
      this.authError.country = null;

      // Email obligatoire + format
      if (!this.isNonEmpty(this.authUser.email)) {
        this.authError.email = "L'email est obligatoire";
      } else if (!this.isValidEmail(this.authUser.email)) {
        this.authError.email = "L'email doit ressembler à xx@xx.xx";
      }

      // Si email existe => mdp obligatoire
      if (this.authEmailExists === true) {
        if (!this.isNonEmpty(this.authUser.password)) {
          this.authError.password = "Le mot de passe est obligatoire";
        }
      }

      // Si email n'existe pas => champs register simples
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
  // SHOP CREATION / ADDRESS / ZONES (inchangé)
  // ============================================================

  private async ensureShopCreated(): Promise<void> {
    if (this.createdShopId) return;
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

    const proposed = this.normalizeHandle(this.newShop.name || "");
    this.newShop.handle = proposed;

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
  // HELPERS (validation simples)
  // ============================================================

  private str(value: any): string {
    return String(value ?? '').trim();
  }

  private isNonEmpty(value: any): boolean {
    return this.str(value).length > 0;
  }

  private isValidEmail(email: any): boolean {
    const v = this.str(email);
    if (!v) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
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
   * Valide un format FR simple : 10 digits, commence par 0
   * -> exactement comme ton pattern signup
   */
  private isValidPhoneFR(phone: any): boolean {
    const digits = this.onlyDigits(phone);
    return /^0[1-9][0-9]{8}$/.test(digits);
  }
}
