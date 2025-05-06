import { Component, ElementRef, NgModule, OnInit } from '@angular/core';
import { AbstractControl, FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
// import { TranslateService } from "@ngx-translate/core";
import { EmitterService } from 'src/app/core/services/emitter.service';
import { SeoService } from 'src/app/core/services/seo.service';
import { UserService } from 'src/app/core/services/user.service';
import { environment } from 'src/environments/environment';
import { v4 as uuidv4 } from 'uuid'; // Assure-toi d'avoir installé `uuid`
import { FormControl } from '@angular/forms';

@Component({
    selector: 'app-sign-up',
    templateUrl: './sign-up.component.html',
    styleUrls: ['./sign-up.component.scss'],
})

export class SignUpComponent implements OnInit {
    error: any = {};
    passwordConfirmed!: ElementRef;
    placeholerFirstName: string = 'SIGNUP.PLACEHOLDER_FIRSTNAME';
    placeholerLastName: string = 'SIGNUP.PLACEHOLDER_LASTNAME';
    placeholerEmail: string = 'SIGNUP.PLACEHOLDER_EMAIL';
    placeholerPhone: string = 'SIGNUP.PLACEHOLDER_PHONE';
    placeholderPassword: string = 'SIGNUP.PLACEHOLDER_PASSWORD';
    placeholderConfirmPassword: string = 'SIGNUP.PLACEHOLDER_PASSWORDCONFIRMED';
    imgStorageUrl: string = environment.imgStorageUrl;
    // list of all users
    users: any = [];
    // Selected user
    user: any = {};
    // String filter
    searchFilter = '';
    // List of users filtered by searchFilter
    shownUser: any = [];
    // Open/hide creation/edition modal
    modalAjouterModifier = false;
    // Show delete modal
    modalSupprimer = false;
    // Tells what string to show
    newUserOrEditUser = false;
    // Title changes to send to other components
    message: string | undefined;
    sites: any = [];
    passwordLiveError: any = {};
    sideNav = false;
    tempOject: any = {};
    notDeleted = false;
    userRole: string | undefined;
    emailFormControl = new FormControl('', { nonNullable: true });

    constructor(
        public translate: TranslateService,
        private route: ActivatedRoute,
        private title: Title,
        private userService: UserService,
        private emitterService: EmitterService,
        private _snackBar: MatSnackBar,
        private router: Router,
        private seoService: SeoService
    ) { }

    ngOnInit() {
        this.seoService.updateMeta('signup');
        this.title.setTitle(this.route.snapshot.data['title']);

        this.translate.get(this.placeholerFirstName).subscribe((res: string) => {
            this.placeholerFirstName = res;
        });
        this.translate.get(this.placeholerLastName).subscribe((res: string) => {
            this.placeholerLastName = res;
        });
        this.translate.get(this.placeholerEmail).subscribe((res: string) => {
            this.placeholerEmail = res;
        });
        this.translate.get(this.placeholerPhone).subscribe((res: string) => {
            this.placeholerPhone = res;
        });
        this.translate.get(this.placeholderPassword).subscribe((res: string) => {
            this.placeholderPassword = res;
        });
        this.translate.get(this.placeholderConfirmPassword).subscribe((res: string) => {
            this.placeholderConfirmPassword = res;
        });
        this.user.sex = 'female';
        this.user.country = 'France';
    }

    /*
     * Displays the add/edit user modal
     */
    validAjouterModifier() {
        if (!this.user.sex) {
            this.error.sex = "Le genre est obligatoire";
            return;
        } 
        
        if (!this.user.lastname) {
            this.error.lastname = "Le nom de famille est obligatoire";
            return;
        } else if (this.user.lastname.length < 2) {
            this.error.lastname = "Le nom de famille doit être composé d'au moins 2 lettres";
            return;
        } else {
            this.error.lastname = null;
        }
        if (!this.user.firstname) {
            this.error.firstname = "Le prénom est obligatoire";
            return;
        } else if (this.user.firstname.length < 2) {
            this.error.firstname = "Le prénom doit être composé d'au moins 2 lettres";
            return;
        } else {
            this.error.firstname = null;
        }
        if (!this.user.phone) {
            this.error.phone = "Le numéro de téléphone est obligatoire";
            return;
        } else if (!this.validatePhoneNumber('+33', this.user.phone)) {
            this.error.phone = "Le numéro de téléphone n'est pas valide";
            return;
        } else {
            this.error.phone = null;
        }
        if (!this.user.email) {
            this.error.email = "L'email est obligatoire";
            return;
        } else if (!this.validateEmail(this.user.email)) {
            this.error.email = "L'email doit ressembler à xx@xx.xx";
            return;
        } else {
            this.error.email = null;
        }
        if (!this.user.password) {
            this.error.password = "Le mot de passe est obligatoire";
            return;
        } else {
            this.error.password = null;
        }
        if (!this.user.passwordConfirmed) {
            this.error.passwordConfirmed = "La confirmation de mot de passe est obligatoire";
            return;
        } else {
            this.error.passwordConfirmed = null;
        }
        if (!this.user.country) {
            this.error.country = "Le pays est obligatoire";
            return;
        } else {
            this.error.country = null;
        }

        //crétion d'un user
        this.user.role = 'user';
        // 💬 conversationId obligatoire
        this.user.conversationId = uuidv4();
        // 🪄 Si fidelity est requis, on le remplit :
        this.user.fidelity = {
            stars: 0,
            card_expiration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // +1 an
            rewards_history: [],
        };
        // TODO User à mettre en dynamique asap
        // this.user.roleId = 1;
        if (!this.newUserOrEditUser) {
            // une fois l'erreur : on desactive le loader
            this.emitterService.change(true);
            this.userService.createNoToken(this.user).subscribe(
                () => {
                    // this.modalService.dismissAll();
                    // this.modalRMSService.updateData();
                    const uploadTranslation = this.translate.instant(
                        'SUCCESS.USERCREATED'
                    );
                    this.openSnackBar(uploadTranslation);
                    this.user = {};
                    // une fois l'erreur : on desactive le loader
                    this.emitterService.change(false);
                    this.router.navigate(['sign-in']);
                },
                (err) => {
                    // une fois l'erreur : on desactive le loader
                    this.emitterService.change(false);
                    console.log(err);
                    const uploadTranslation = this.translate.instant(
                        'ERROR.USERNOTCREATED'
                    );
                    this.openSnackBar(uploadTranslation);
                }
            );
        }
    }
    cancelCreation() {
        this.user = this.tempOject;
    }


    /**
     * @param email Validate email
     * @returns
     */
    validateEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePhoneNumber(indicatif: string, phoneNumber: string): boolean {
        const indicatifRegex = /^\+\d+$/;
        const phoneNumberRegex = /^\d{10}$/;
    
        return indicatifRegex.test(indicatif) && phoneNumberRegex.test(phoneNumber);
    }
    
    

    customEmailValidator(control: AbstractControl) {
        const value = control.value;
        const regex = /^[^@]+@[^@]+\.[^@]+$/;

        if (!value) return null; // ne pas valider si vide (le required s'en charge)

        return regex.test(value) ? null : { customEmail: true };
    }

    openSnackBar(phrase: string) {
        const uploadTranslation = 'Fermer'; // this.translate.instant("ALERT.CLOSE");
        this._snackBar.open(phrase, uploadTranslation, {
            horizontalPosition: 'center',
            verticalPosition: 'top',
            duration: 5000,
            panelClass: ['orange-snackbar', 'login-snackbar'],
        });
    }

    onPhoneInput() {
        this.user.phone = this.user.phone.replace(/[^0-9]/g, '').slice(0, 10);
    }

}
