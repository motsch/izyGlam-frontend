import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SessionService } from '../../services/session.service';
import { UserService } from '../../services/user.service';
import { AuthenticationService } from '../../services/authentication.service';
import { SeoService } from '../../services/seo.service';
import { LanguageService } from '../../services/language.service';

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
    langues: any[] = [];
    selected: any = {};

    storedLangue: string = '';
    languagesInfos: any[] = [];

    constructor(
        public translate: TranslateService,
        public sessionService: SessionService,
        private userService: UserService,
        private languageService: LanguageService,
        private authenticationService: AuthenticationService,
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
        this.getLanguages();
        this.langues = this.translate.getLangs().map(langCode => {
            return this.languagesInfos.find((x: any) => x.code === langCode) || {};
        });

        let storedLangue = (localStorage.getItem('langue') || '').replace(/^"(.*)"$/, '$1').trim().slice(0, 2).toLowerCase();

        if (storedLangue.length !== 2) {
            console.error('Stored Langue has an unexpected length:', storedLangue.length);
            return;
        }
        console.log(storedLangue)
        this.selected = this.languagesInfos.find(x => x.code === storedLangue) || this.languagesInfos.find(x => x.code === 'fr');

        if (!this.selected) {
            console.error('Language not found for code:', storedLangue);
        }
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
    getLanguages() {
        this.languageService.getAllCleaned().subscribe((result: any[]) => {
            this.languagesInfos = result.filter(lang => lang.active); // uniquement actives

            // On récupère la langue stockée
            const storedLangue = (localStorage.getItem('langue') || '').replace(/^"(.*)"$/, '$1').trim().slice(0, 2).toLowerCase();

            // Filtrer les langues connues par ngx-translate ET actives dans la BDD
            this.langues = this.translate.getLangs()
                .map(code => this.languagesInfos.find(lang => lang.code === code))
                .filter(lang => lang !== undefined);

            // Déterminer la langue sélectionnée
            if (this.langues.length === 1) {
                this.selected = this.langues[0];
            } else {
                this.selected = this.langues.find(lang => lang.code === storedLangue)
                    || this.languagesInfos.find(lang => lang.code === 'fr'); // fallback français
            }

            // Appliquer la langue si retrouvée
            if (this.selected) {
                this.translate.use(this.selected.code);
                this.sessionService.setLang(this.selected.code);
                this.seoService.setLanguage(this.selected);
            } else {
                console.error('Language not found for code:', storedLangue);
            }

        }, error => {
            console.error('Erreur lors du chargement des langues', error);
        });
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

    selectLanguage(lang: any) {
        console.log(lang);
        localStorage.setItem('langue', lang.code);

        // 🔹 ngx-translate
        this.translate.use(lang.code);
        this.sessionService.setLang(lang.code);

        // 🔹 UI
        this.selected = lang;
        this.dropdownOpen = false;

        // 🔹 SEO
        this.seoService.setLanguage(lang);

        // 🔹 Backend : MAJ de la langue du user
        if (this.me && this.me._id) {
            const updatedUser = { ...this.me, language: lang.code };
            this.userService.update(updatedUser).subscribe({
                next: (res) => {
                    console.log("✅ Langue utilisateur mise à jour côté backend :", res.language);
                    this.me = res; // garde le user synchro avec la DB
                },
                error: (err) => {
                    console.error("❌ Erreur lors de la mise à jour de la langue", err);
                }
            });
        }
    }

}
