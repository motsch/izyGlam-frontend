import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from 'src/app/core/services/authentication.service';
import { SessionService } from 'src/app/core/services/session.service';
import { ToolsService } from 'src/app/core/services/tools.service';

@Component({
    selector: 'app-sign-in-sms',
    templateUrl: './sign-in-sms.component.html',
    styleUrls: ['./sign-in-sms.component.scss'],
})
export class SignInSmsComponent {
    //  user à logger;
    user: any = {};
    // Erreur lors du login
    error: any = {};
    visible = false;
    rememberMe: boolean | undefined = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    langues: any[] | undefined;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selected: any;
    emailRedBorder = true;
    passwordRedBorder = true;
    imageDisplay: any;
    year: string = '';
    inputValue: string = '';
    constructor(
        private route: ActivatedRoute,
        private title: Title,
        private _snackBar: MatSnackBar,
        private meta: Meta,
        private authenticationService: AuthenticationService,
        private sessionService: SessionService,
        private toolsService: ToolsService,
        private router: Router
    ) {}

    ngOnInit() {
        this.title.setTitle(this.route.snapshot.data['title']);
    }

    onMoreOptions() {
        console.log('Showing more options...');
        this.router.navigate(['sign-in']);
    }

    onSubmitLogin(): void {
        console.log('onSubmitLogin: ' + this.inputValue);
        this.toolsService
            .identifierType(this.inputValue)
            .subscribe((emailOrPhone) => {
                console.log('result: ' + emailOrPhone);
                if (emailOrPhone.toLowerCase().includes('email')) {
                    this.user.email = this.inputValue;
                    this.user.phone = null;
                } else if (
                    emailOrPhone.toLowerCase().includes('numéro de téléphone')
                ) {
                    this.user.phone = this.inputValue; //'+33619742564'; // '+33' + this.inputValue;
                    this.user.email = null;
                } else {
                    console.log('not email or phone');
                }
            });

        // Appel de service permettant de se logger
        this.authenticationService
            .loginSms(this.user.email, this.user.phone)
            .subscribe(
                (smsConnectionData) => {
                    console.log(JSON.stringify(smsConnectionData));
                    sessionStorage.setItem(
                        'sid',
                        JSON.stringify(smsConnectionData.sid)
                    );
                    sessionStorage.setItem(
                        'identifiant',
                        JSON.stringify(smsConnectionData.identifiant)
                    );
                    // On a le bon couple identifiant / mdp

                    this.rememberMe = true;

                    /*this.sessionService.setCurrentUser(
                        user.token,
                        this.rememberMe
                    );*/
                    this.router.navigate(['sms-verif']);
                    // this.router.navigate(['main']);
                },
                (error) => {
                    console.log(error);
                    // this.error.wrongLog = error.error.message;
                    // const uploadTranslation = this.translate.instant('LOGIN.WRONGCREDENTIALS');
                    this.openSnackBar(error.error.message);
                    if (error.status == 400) {
                        /*const uploadTranslation = this.translate.instant(
                  "LOGIN.WRONGCREDENTIALS"
                );*/
                        this.openSnackBar('uploadTranslation');
                        // this.error.wrongLog = 'LOGIN.WRONGCREDENTIALS';
                    }
                }
            );
    }
    onSubmitLogin2() {
        console.log('onSubmitLogin :' + this.inputValue);
        let email = this.toolsService.identifierType(this.inputValue);
        console.log('result :' + email);

        this.error.email = null;
        this.error.password = null;
        this.error.wrongLog = null;
        // Si mdp ou mail incorrect, on s'arrete là
        if (!this.user.login || !this.user.password) {
            if (!this.user.login) {
                this.emailRedBorder = true;
                this.error.email = 'ERROR.REQUIRED';
            }
            if (!this.user.password) {
                this.error.password = 'ERROR.REQUIRED';
                this.passwordRedBorder = true;
            } else {
                this.error.password = null;
            }
            return;
        }
    }

    openSnackBar(phrase: string) {
        // const uploadTranslation = this.translate.instant("ALERT.CLOSE");
        this._snackBar.open(phrase, 'uploadTranslation', {
            horizontalPosition: 'center',
            verticalPosition: 'bottom',
            duration: 5000,
            panelClass: ['orange-snackbar', 'login-snackbar'],
        });
    }
}
