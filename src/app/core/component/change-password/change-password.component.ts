import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SessionService } from '../../services/session.service';
import { UserService } from '../../services/user.service';
import { AuthenticationService } from '../../services/authentication.service';
import { SeoService } from '../../services/seo.service';
import { LanguageService } from '../../services/language.service';
import { CountryService } from '../../services/country.service';

// ✅izyGlam: toast de notif
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-change-password',
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.scss'],
})
export class ChangePasswordComponent implements OnInit, OnChanges {
  @Input() me: any = {};

  // 🔐 Formulaire de changement de mot de passe
  elem: any = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  };

  // ✨ États d’UI
  passwordChangeSuccess: boolean = false;
  passwordChangeError: string = '';

  // 🧭 Menus déroulants de langue/pays
  dropdownOpen = false;
  dropdownOpenCountry = false;

  // 🌐 Langues & pays disponibles / sélectionnés
  langues: any[] = [];
  countries: any[] = [];
  selected: any = {};
  selectedCountry: any = {};
  storedLangue: string = '';
  languagesInfos: any[] = [];
  countriesInfos: any[] = [];

  constructor(
    public translate: TranslateService,
    public sessionService: SessionService,
    private userService: UserService,
    private languageService: LanguageService,
    private authenticationService: AuthenticationService,
    private countryService: CountryService,
    private seoService: SeoService,

    // ✅izyGlam
    private toastr: ToastrService
  ) {
    // Langues disponibles côté ngx-translate
    translate.addLangs([
      'ar',
      'be',
      'bn',
      'ca',
      'da',
      'de',
      'en',
      'es',
      'et',
      'eu',
      'fa',
      'fi',
      'fr',
      'gl',
      'hi',
      'id',
      'it',
      'ja',
      'ko',
      'ku',
      'ms',
      'nl',
      'pl',
      'pt',
      'ro',
      'ru',
      'so',
      'sq',
      'sv',
      'th',
      'tl',
      'tr',
      'uk',
      'vi',
      'zh'
    ]);
    const sessionServiceLangue = this.sessionService.getLang();
    if (sessionServiceLangue) {
      translate.setDefaultLang(sessionServiceLangue);
    } else {
      translate.setDefaultLang('fr');
    }
  }

  // ------------------------------------------------------
  // 🔄 Mise à jour si l’@Input me change après init
  // ------------------------------------------------------
  ngOnChanges(changes: SimpleChanges) {
    if (changes['me'] && changes['me'].currentValue) {
      this.updateUser();
    }
  }

  private updateUser(): void {
    console.log('ChangePasswordComponent.me', this.me);
  }

  // ------------------------------------------------------
  // ⏱️ Init composant
  // ------------------------------------------------------
  ngOnInit(): void {
    localStorage.setItem('menu-param', 'security');
    this.updateUser();
    this.getCountries();
  }

  // ------------------------------------------------------
  // 🌐 Chargement des langues (toutes, puis filtrage actif)
  // ------------------------------------------------------
  loadLangues() {
    this.languageService.getAll().subscribe(
      (data: any[]) => {
        this.langues = data.filter((lang) => lang.active);
        if (this.langues.length === 1) {
          this.selected = this.langues[0];
        }
      },
      (error: any) => {
        console.error('❌ Erreur lors du chargement des langues', error);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    );
  }

  // ------------------------------------------------------
  // 🗺️ Charger les pays actifs, sélectionner le pays stocké, charger ses langues
  // ------------------------------------------------------
  getCountries(): void {
    this.countryService.getAll({ active: true }).subscribe({
      next: (countries: any[]) => {
        this.countries = countries || [];

        // Lecture du localStorage (on stocke le *name* du pays)
        let storedCountry = (localStorage.getItem('pays') || '').replace(/^"(.*)"$/, '$1').trim();
        if (!storedCountry) storedCountry = 'France';

        // On tente de retrouver par name ou translation (case-insensitive)
        this.selectedCountry = this.findCountryByNameOrTranslation(storedCountry);

        // Fallback France / 1er pays dispo
        if (!this.selectedCountry) {
          this.selectedCountry =
            this.findCountryByNameOrTranslation('France') || this.countries[0] || null;
        }

        // Appliquer côté session + charger les langues
        if (this.selectedCountry) {
          this.sessionService.setCountry(this.selectedCountry.name);
          this.loadLanguagesForCountry(this.selectedCountry.name);
        } else {
          console.error('Country not found for name:', storedCountry);
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement des pays', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      },
    });
  }

  /** 🔎 Recherche pays par name ou par translation (insensible à la casse) */
  private findCountryByNameOrTranslation(raw: string): any | undefined {
    const norm = raw.trim().toLowerCase();
    return this.countries.find(
      (c) => c.name?.toLowerCase() === norm || c.translation?.toLowerCase() === norm
    );
  }

  // ------------------------------------------------------
  // 🌐 Charger les langues d’un pays (actives), appliquer une langue préférée si fournie
  // ------------------------------------------------------
  private loadLanguagesForCountry(countryName: string, preferredLangName?: string): void {
    this.countryService.getLanguagesByName(countryName).subscribe({
      next: (payload: any) => {
        const langs = Array.isArray(payload?.languages) ? payload.languages : [];

        // On garde uniquement les actives
        this.langues = langs.filter((l: any) => l.active);

        // 1) si preferredLangName : priorité
        let selected: any | undefined;
        if (preferredLangName) {
          const normPref = this.normalize(preferredLangName);
          selected = this.langues.find((l) => this.normalize(l.name) === normPref);
        }

        // 2) sinon, tenter le localStorage (code)
        if (!selected) {
          let storedLangue = (localStorage.getItem('langue') || '')
            .replace(/^"(.*)"$/, '$1')
            .trim()
            .toLowerCase();
          if (storedLangue) {
            selected = this.langues.find((l) => l.code.toLowerCase() === storedLangue);
          }
        }

        // 3) fallback: fr si dispo, sinon première
        if (!selected) {
          selected = this.langues.find((l) => l.code.toLowerCase() === 'fr') || this.langues[0];
        }

        this.selected = selected || null;

        if (this.selected) {
          this.applyLanguage(this.selected);
        } else {
          console.error('Aucune langue active disponible pour ce pays:', countryName);
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        }
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des langues', err);
        this.langues = [];
        this.selected = null;
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      },
    });
  }

  /** 🔤 Normalisation simple pour comparer des noms (accents/casse) */
  private normalize(s: string): string {
    return s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  // ------------------------------------------------------
  // 🗺️ Sélection d’un pays
  // ------------------------------------------------------
  selectCountry(country: any): void {
    this.selectedCountry = country;
    this.dropdownOpenCountry = false;
    localStorage.setItem('pays', country.name); // on stocke name pour cohérence backend
    this.sessionService.setCountry(country.name);
    this.loadLanguagesForCountry(country.name);
  }

  // ------------------------------------------------------
  // 🌐 Sélection d’une langue
  // ------------------------------------------------------
  selectLanguage(lang: any): void {
    this.selected = lang;
    this.dropdownOpen = false;
    this.applyLanguage(lang);
  }

  /** Applique la langue (ngx-translate + session + SEO + localStorage) */
  private applyLanguage(lang: any): void {
    try {
      this.translate.use(lang.code);
      this.sessionService.setLang(lang.code);
      this.seoService.setLanguage(lang);
      localStorage.setItem('langue', lang.code);
    } catch (err) {
      console.error('Erreur lors de l’application de la langue :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // ------------------------------------------------------
  // ✅ Validation basique du formulaire
  // ------------------------------------------------------
  isPasswordFormValid(): boolean {
    return (
      this.elem.currentPassword &&
      this.elem.newPassword &&
      this.elem.confirmPassword &&
      this.elem.newPassword.length >= 8 &&
      this.elem.newPassword === this.elem.confirmPassword
    );
  }

  // ------------------------------------------------------
  // 🔐 Changement de mot de passe (avec vérification du mot de passe actuel)
  // ------------------------------------------------------
  changePassword(): void {
    if (this.isPasswordFormValid()) {
      const { currentPassword, newPassword } = this.elem;

      // Même mot de passe → erreur UX
      if (currentPassword === newPassword) {
        this.passwordChangeError = this.translate.instant('ERROR.PASSWORDS_IDENTICAL');
        this.showCustomToast(this.passwordChangeError);
        this.handleErrorClearance();
        this.elem = {};
        return;
      }

      // 1) Vérifier le pwd actuel via login()
      this.authenticationService.login(this.me.email, currentPassword).subscribe({
        next: (data: any) => {
          if (!data?.token) {
            // Mot de passe actuel invalide
            this.passwordChangeError = this.translate.instant('ERROR.INVALID_CURRENT_PASSWORD');
            this.showCustomToast(this.passwordChangeError);
            this.handleErrorClearance();
            this.elem = {};
            return;
          }

          // 2) Si OK → mise à jour du mot de passe
          this.me.password = newPassword;
          this.userService.updatePassword(this.me).subscribe({
            next: (dataUpdate: any) => {
              // Contrôle superficiel : si les champs identitaires sont identiques, on considère succès
              if (
                dataUpdate.lastname === this.me.lastname &&
                dataUpdate.firstname === this.me.firstname &&
                dataUpdate.email === this.me.email &&
                dataUpdate.phone === this.me.phone
              ) {
                this.elem = {};
                this.passwordChangeError = '';
                this.passwordChangeSuccess = true;
                // ✅ Toast succès
                this.toastr.success(this.translate.instant('SUCCESS.PASSWORD_CHANGED'));
                this.handleErrorClearance();
              } else {
                // Échec inattendu
                this.passwordChangeError = this.translate.instant('ERROR.PASSWORD_UPDATE_FAILED');
                this.showCustomToast(this.passwordChangeError);
                this.elem = {};
                this.handleErrorClearance();
              }
            },
            error: (updateError: any) => {
              console.error('Erreur lors de la mise à jour du mot de passe:', updateError);
              this.passwordChangeError = this.translate.instant('ERROR.PASSWORD_UPDATE_GENERIC');
              this.showCustomToast(this.passwordChangeError);
              this.elem = {};
              this.handleErrorClearance();
            },
          });
        },
        error: (loginError: any) => {
          console.error('Erreur lors de la vérification du mot de passe actuel:', loginError);
          this.passwordChangeError = this.translate.instant('ERROR.INVALID_CURRENT_PASSWORD_OR_GENERIC');
          this.showCustomToast(this.passwordChangeError);
          this.elem = {};
          this.handleErrorClearance();
        },
      });
    } else {
      // Formulaire invalide (mismatch / longueur)
      this.passwordChangeError = this.translate.instant('ERROR.PASSWORDS_MISMATCH_OR_TOO_SHORT');
      this.showCustomToast(this.passwordChangeError);
      this.elem = {};
      this.handleErrorClearance();
    }
  }

  // ------------------------------------------------------
  // 🧹 Nettoyage des messages d’état après 5s
  // ------------------------------------------------------
  private handleErrorClearance(): void {
    setTimeout(() => {
      this.passwordChangeSuccess = false;
      this.passwordChangeError = '';
    }, 5000);
  }

  // ------------------------------------------------------
  // 🧭 Gestion des dropdowns
  // ------------------------------------------------------
  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
    this.dropdownOpenCountry = false;
  }

  toggleDropdownCountry() {
    this.dropdownOpenCountry = !this.dropdownOpenCountry;
    this.dropdownOpen = false;
  }

  // ------------------------------------------------------
  // ✨ Toast d’erreur styliséizyGlam (centralisé)
  // ------------------------------------------------------
  private showCustomToast(message: string) {
    this.toastr.error(message);
  }
}
