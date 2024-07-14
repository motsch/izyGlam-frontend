import { Component, ElementRef, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
// import { TranslateService } from "@ngx-translate/core";
import { EmitterService } from 'src/app/core/services/emitter.service';
import { UserService } from 'src/app/core/services/user.service';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-sign-up',
    templateUrl: './sign-up.component.html',
    styleUrls: ['./sign-up.component.scss'],
})
export class SignUpComponent implements OnInit {
    passwordConfirmed!: ElementRef;

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
    error: any = {};
    constructor(
        public translate: TranslateService,
        private route: ActivatedRoute,
        private title: Title,
        private userService: UserService,
        private emitterService: EmitterService,
        private _snackBar: MatSnackBar,
        // private communicationService: CommunicationService,
        private router: Router,
        private meta: Meta
    ) {}

    ngOnInit() {
        this.title.setTitle(this.route.snapshot.data['title']);
    }

    /*
     * Displays the add/edit user modal
     */
    validAjouterModifier() {
        //crétion d'un user
        this.user.role = 'user';
        // TODO User à mettre en dynamique asap
        this.user.roleId = 1;
        if (!this.newUserOrEditUser) {
            // une fois l'erreur : on desactive le loader
            this.emitterService.change(true);
            this.userService.create(this.user).subscribe(
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
        } /** else { //update du user
      this.notDeleted = true;
      // une fois l'erreur : on desactive le loader
      this.emitterService.change(true);
      this.userService.update(this.user).subscribe(
        () => {
          const uploadTranslation = this.translate.instant(
            "SUCCESS.USERUPDATED"
          );
          this.openSnackBar(uploadTranslation);
          // this.modalService.dismissAll();
          localStorage.setItem("me", JSON.stringify(this.user));
          this.user = {};
          // une fois l'erreur : on desactive le loader
          this.emitterService.change(false);
          // this.modalRMSService.updateData();
          this.notDeleted = false;
        },
        (err) => {
          // une fois l'erreur : on desactive le loader
          this.emitterService.change(false);
          console.log(err);
          const uploadTranslation = this.translate.instant(
            "ERROR.USERNOTUPDATED"
          );
          this.openSnackBar(uploadTranslation);
        }
      );
    } */
        // this.modalService.dismissAll();
    }
    cancelCreation() {
        this.user = this.tempOject;
    }
    /**
     *
     * @param email Validate email
     * @returns
     */
    validateEmail(email: string | undefined): boolean {
        if (email) {
            const emailRegex =
                /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            const isValid = emailRegex.test(email);
            return isValid ? true : false;
        }
        return false;
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
}
