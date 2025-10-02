import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SessionService } from '../../services/session.service';
import { UserService } from '../../services/user.service';
import { AuthenticationService } from '../../services/authentication.service';
import { SeoService } from '../../services/seo.service';
import { LanguageService } from '../../services/language.service';
import { CountryService } from '../../services/country.service';

@Component({
    selector: 'app-change-password',
    templateUrl: './change-password.component.html',
    styleUrls: ['./change-password.component.scss'],
})
export class ChangePasswordComponent implements OnInit, OnChanges {
    @Input() me: any = {};
    elem: any = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    };
    passwordChangeSuccess: boolean = false;
    passwordChangeError: string = '';
    dropdownOpen = false;
    dropdownOpenCountry = false;
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
        private seoService: SeoService
    ) {
        translate.addLangs([
            'da',
            'de',
            'en',
            'es',
            'fi',
            'fr',
            'it',
            'nl',
            'pl',
            'pt',
            'sv',
        ]);
        const sessionServiceLangue = this.sessionService.getLang();
        if (sessionServiceLangue) {
            translate.setDefaultLang(sessionServiceLangue);
        } else {
            translate.setDefaultLang('fr');
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        // Si 'me' est fourni après l'initialisation
        if (changes['me'] && changes['me'].currentValue) {
            this.updateUser();
        }
    }

    private updateUser(): void {
        console.log(this.me);
    }

    ngOnInit(): void {
        localStorage.setItem("menu-param", 'security');
        // Si 'me' est déjà disponible
        this.updateUser();
        this.getCountries();
    }

    loadLangues() {
        this.languageService.getAll().subscribe(
            (data: any[]) => {
                this.langues = data.filter(lang => lang.active); // On garde uniquement les langues actives
                if (this.langues.length === 1) {
                    this.selected = this.langues[0]; // On sélectionne la seule langue disponible
                }
            },
            (error: any) => {
                console.error('❌ Erreur lors du chargement des langues', error);
            }
        );
    }

    /** Charge les pays puis sélectionne le pays stocké (ou 'France' à défaut), et charge ses langues */
    getCountries(): void {
        // Option: filtrer que les actifs -> getAll({ active: true })
        this.countryService.getAll({ active: true }).subscribe({
            next: (countries: any[]) => {
                this.countries = countries || [];

                // Lecture du localStorage (on stocke le *name* du pays)
                let storedCountry = (localStorage.getItem('pays') || '').replace(/^"(.*)"$/, '$1').trim();
                if (!storedCountry) storedCountry = 'France';

                // On tente de retrouver par name exact (insensible à la casse)
                this.selectedCountry = this.findCountryByNameOrTranslation(storedCountry);

                // Fallback: France si pas trouvé
                if (!this.selectedCountry) {
                    this.selectedCountry = this.findCountryByNameOrTranslation('France') || this.countries[0] || null;
                }

                // Appliquer le pays côté session
                if (this.selectedCountry) {
                    this.sessionService.setCountry(this.selectedCountry.name);
                    // Charger les langues du pays
                    this.loadLanguagesForCountry(this.selectedCountry.name);
                } else {
                    console.error('Country not found for name:', storedCountry);
                }
            },
            error: (err) => {
                console.error('Erreur lors du chargement des pays', err);
            }
        });
    }

    /** Recherche par name, sinon par translation (insensible à la casse) */
    private findCountryByNameOrTranslation(raw: string): any | undefined {
        const norm = raw.trim().toLowerCase();
        return this.countries.find(c =>
            c.name?.toLowerCase() === norm || c.translation?.toLowerCase() === norm
        );
    }

    /** Charge les langues disponibles (actives par défaut) pour un pays donné */
    private loadLanguagesForCountry(countryName: string): void {
        this.countryService.getLanguagesByName(countryName /*, includeInactive? false par défaut */).subscribe({
            next: (langs: any) => {
                // On garde seulement les actives (le backend peut déjà filtrer, mais on protège)
                this.langues = langs.languages;

                // Pré-sélection de la langue : localStorage -> sinon 'fr' -> sinon première
                let storedLangue = (localStorage.getItem('langue') || '').replace(/^"(.*)"$/, '$1').trim().toLowerCase();
                if (!storedLangue) storedLangue = 'fr';

                this.selected = this.langues.find(l => l.code.toLowerCase() === storedLangue) || this.langues[0] || null;

                // Appliquer la langue si trouvée
                if (this.selected) {
                    this.applyLanguage(this.selected);
                } else {
                    console.error('Language not found for code:', storedLangue);
                }
            },
            error: (err) => {
                console.error('Erreur lors du chargement des langues', err);
                this.langues = [];
                this.selected = null;
            }
        });
    }

    /** Sélection d’un pays depuis le menu */
    selectCountry(country: any): void {
        this.selectedCountry = country;
        this.dropdownOpenCountry = false;

        // Stocker le nom (name) pour cohérence avec la recherche backend par name
        localStorage.setItem('pays', country.name);

        this.sessionService.setCountry(country.name);

        // Recharger les langues du pays
        this.loadLanguagesForCountry(country.name);
    }

    /** Sélection d’une langue depuis le menu */
    selectLanguage(lang: any): void {
        this.selected = lang;
        this.dropdownOpen = false;
        this.applyLanguage(lang);
    }

    /** Applique langue à ngx-translate + session + SEO + localStorage */
    private applyLanguage(lang: any): void {
        this.translate.use(lang.code);
        this.sessionService.setLang(lang.code);
        this.seoService.setLanguage(lang);
        localStorage.setItem('langue', lang.code);
    }

    isPasswordFormValid(): boolean {
        return (
            this.elem.currentPassword &&
            this.elem.newPassword &&
            this.elem.confirmPassword &&
            this.elem.newPassword.length >= 8 &&
            this.elem.newPassword === this.elem.confirmPassword
        );
    }

    changePassword(): void {
        if (this.isPasswordFormValid()) {
            const { currentPassword, newPassword } = this.elem;
            if (currentPassword === newPassword) {
                this.passwordChangeError = 'Les mots de passe sont identiques.';
                this.handleErrorClearance();
                this.elem = {};
                return;
            }
            this.authenticationService
                .login(this.me.email, currentPassword)
                .subscribe({
                    next: (data: any) => {
                        if (!data.token) {
                            this.passwordChangeError =
                                'Le mot de passe actuel est incorrect.';
                            this.handleErrorClearance();
                            this.elem = {};
                            return;
                        }
                        // Proceed with password update if login was successful
                        this.me.password = newPassword;
                        this.userService.updatePassword(this.me).subscribe({
                            next: (dataUpdate: any) => {
                                if (
                                    dataUpdate.lastname === this.me.lastname &&
                                    dataUpdate.firstname ===
                                    this.me.firstname &&
                                    dataUpdate.email === this.me.email &&
                                    dataUpdate.phone === this.me.phone
                                ) {
                                    this.elem = {};
                                    this.passwordChangeError = '';
                                    this.passwordChangeSuccess = true;
                                    this.handleErrorClearance();
                                } else {
                                    this.passwordChangeError =
                                        'La modification du mot de passe a échouée.';
                                    this.elem = {};
                                    this.handleErrorClearance();
                                }
                            },
                            error: (updateError: any) => {
                                console.error(
                                    'Erreur lors de la mise à jour du mot de passe:',
                                    updateError
                                );
                                this.passwordChangeError =
                                    'Une erreur est survenue lors de la mise à jour du mot de passe.';
                                this.elem = {};
                                this.handleErrorClearance();
                            },
                        });
                    },
                    error: (loginError: any) => {
                        console.error(
                            'Erreur lors de la vérification du mot de passe actuel:',
                            loginError
                        );
                        this.passwordChangeError =
                            'Le mot de passe actuel est erroné ou une erreur est survenue.';
                        this.elem = {};
                        this.handleErrorClearance();
                    },
                });
        } else {
            this.passwordChangeError =
                'Les nouveaux mots de passe ne correspondent pas ou sont trop courts.';
            this.elem = {};
            this.handleErrorClearance();
        }
    }

    private handleErrorClearance(): void {
        setTimeout(() => {
            this.passwordChangeSuccess = false;
            this.passwordChangeError = '';
        }, 5000);
    }

    toggleDropdown() {
        this.dropdownOpen = !this.dropdownOpen;
    }

    toggleDropdownCountry() {
        this.dropdownOpenCountry = !this.dropdownOpenCountry;
    }
}
