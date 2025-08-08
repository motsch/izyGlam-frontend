import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { environment } from 'src/environments/environment';
import { UserService } from '../../services/user.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-profile-informations',
    templateUrl: './profile-informations.component.html',
    styleUrls: ['./profile-informations.component.scss'],
})
export class ProfileInformationsComponent implements OnInit, OnChanges {
    @Input() me: any = {};
    disabledButton = true;
    imgStorageUrl: string = environment.imgStorageUrl;
    profileForm: FormGroup | undefined;
    imagePreview: string | undefined;
    userChangeSuccess: boolean = false;
    userChangeError: string = '';
    activeSection: string = 'account-info'; // Par défaut, la section active est "account-info"
    user: any = {};
    userCopy: any = {};

    constructor(private userService: UserService,
            private translate: TranslateService) {}

    ngOnInit(): void {
        localStorage.setItem("menu-param", 'account-info')
        // Si 'me' est déjà disponible
        this.updateUser();
    }

    ngOnChanges(changes: SimpleChanges) {
        // Si 'me' est fourni après l'initialisation
        if (changes['me'] && changes['me'].currentValue) {
            this.updateUser();
        }
    }

    private updateUser(): void {
        console.log(this.me);
        this.user = {...this.me};
        this.userCopy = {...this.me};
    }
    validateChangeUser(){
        console.log("valide");
        this.userService.update(this.user).subscribe({
            next: (dataUpdate: any) => {
                console.log(dataUpdate)
                if(dataUpdate.email === this.user.email && dataUpdate.firstname === this.user.firstname && dataUpdate.lastname === this.user.lastname && dataUpdate.phone === this.user.phone) {
                    this.userChangeSuccess = true;
                    this.disabledButton = true;
                    this.handleErrorClearance();
                }
            },
            error: (updateError: any) => {
                console.error('Erreur lors de la mise à jour du mot de passe:', updateError);
                this.userChangeError = this.translate.instant('PROFILE.UPDATE_ERROR');
                this.handleErrorClearance();
            }
        });
    }

    
    private handleErrorClearance(): void {
        setTimeout(() => {
            this.userChangeSuccess = false;
            this.userChangeError = '';
        }, 5000);
    }
    changedDetected(){
        this.disabledButton = false;
    }

    cancel(){
        this.user = {...this.userCopy}
        this.disabledButton = true;
    }
}
