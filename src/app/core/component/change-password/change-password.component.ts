import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { SessionService } from '../../services/session.service';
import { UserService } from '../../services/user.service';
import { AuthenticationService } from '../../services/authentication.service';

@Component({
    selector: 'app-change-password',
    templateUrl: './change-password.component.html',
    styleUrls: ['./change-password.component.scss'],
})
export class ChangePasswordComponent implements OnInit {
    me: any = {};
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

    languagesInfos: any[] = [
        { code: 'fr', name: 'Français', flag: 'assets/flags/fr.png' }, // Français
        { code: 'de', name: 'Allemand', flag: 'assets/flags/de.png' }, // Allemand
        { code: 'en', name: 'Anglais', flag: 'assets/flags/gb.png' }, // Anglais
        { code: 'es', name: 'Espagnol', flag: 'assets/flags/es.png' }, // Espagnol
        { code: 'fi', name: 'Finlandais', flag: 'assets/flags/fi.png' }, // Finlandais
        { code: 'it', name: 'Italien', flag: 'assets/flags/it.png' }, // Italien
        { code: 'nl', name: 'Néerlandais', flag: 'assets/flags/nl.png' }, // Néerlandais
        { code: 'pl', name: 'Polonais', flag: 'assets/flags/pl.png' }, // Polonais
        { code: 'pt', name: 'Portugais', flag: 'assets/flags/pt.png' }, // Portugais
        { code: 'sv', name: 'Suédois', flag: 'assets/flags/sv.png' }, // Suédois
        { code: 'da', name: 'Danois', flag: 'assets/flags/da.png' }, // Danois
    ];

    constructor(
        public translate: TranslateService,
        public sessionService: SessionService,
        private userService: UserService,
        private authenticationService: AuthenticationService
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

    ngOnInit(): void {
        this.userService.getMe().subscribe((data: any) => {
            this.me = data;
        });
    
        this.langues = this.translate.getLangs().map(langCode => {
            return this.languagesInfos.find((x: any) => x.code === langCode) || {};
        });
    
        let storedLangue = (localStorage.getItem('langue') || '').replace(/^"(.*)"$/, '$1').trim().slice(0, 2).toLowerCase();
        
        if (storedLangue.length !== 2) {
            console.error('Stored Langue has an unexpected length:', storedLangue.length);
            return;
        }
    
        this.selected = this.languagesInfos.find(x => x.code === storedLangue) || this.languagesInfos.find(x => x.code === 'fr');
        
        if (!this.selected) {
            console.error('Language not found for code:', storedLangue);
        }
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
        this.translate.use(lang.code);
        this.sessionService.setLang(lang.code);
        this.selected = lang;
        this.dropdownOpen = false;
    }
}
