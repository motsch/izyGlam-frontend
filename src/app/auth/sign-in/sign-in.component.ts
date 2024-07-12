import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthenticationService } from 'src/app/core/services/authentication.service';
import { SessionService } from 'src/app/core/services/session.service';

@Component({
    selector: 'app-sign-in',
    templateUrl: './sign-in.component.html',
    styleUrls: ['./sign-in.component.scss'],
})
export class SignInComponent implements OnInit {
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
    constructor(
        private route: ActivatedRoute,
        private title: Title,
        private _snackBar: MatSnackBar,
        private meta: Meta,
        private authenticationService: AuthenticationService,
        private sessionService: SessionService,
        private router: Router
    ) {}

    ngOnInit() {
        this.title.setTitle(this.route.snapshot.data['title']);
    }

    onSubmit() {
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

        // Appel de service permettant de se logger
        this.authenticationService
            .login(this.user.login, this.user.password)
            .subscribe(
                (user) => {
                    console.log(JSON.stringify(user));
                    // On a le bon couple identifiant / mdp

                    this.rememberMe = true;

                    this.sessionService.setCurrentUser(
                        user.token,
                        this.rememberMe
                    );
                    this.router.navigate(['main']);
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
