import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from 'src/app/core/services/authentication.service';
import { SessionService } from 'src/app/core/services/session.service';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-verif-sms-code',
    templateUrl: './verif-sms-code.component.html',
    styleUrls: ['./verif-sms-code.component.scss'],
})
export class VerifSmsCodeComponent implements OnInit {
    imgStorageUrl: string = environment.imgStorageUrl;
    connectKey: string | null = null;
    sid: string | null = null;
    identifiant: string | null = null;
    constructor(
        private authenticationService: AuthenticationService,
        private sessionService: SessionService,
        private router: Router
    ) {}
    ngOnInit(): void {
        console.log('VerifSmsCodeComponent initialized...');

        this.sid = sessionStorage.getItem('sid');
        sessionStorage.removeItem('sid');
        this.identifiant = sessionStorage.getItem('identifiant');
        sessionStorage.removeItem('identifiant');
        if (this.sid == null) {
            console.log('sid is null');
            return;
        }
        if (this.identifiant == null) {
            console.log('identifiant is null');
            return;
        }
    }

    onLogin() {
        console.log('Login process...');
        if (this.connectKey == null) {
            console.log('connectKey is null');
            return;
        }
        // Appel de service permettant de se logger
        this.authenticationService
            .loginVerifSms(this.sid, this.connectKey, this.identifiant)
            .subscribe((user) => {
                let rememberMe = true;
                this.sessionService.setCurrentUser(user.token, rememberMe);
                this.router.navigate(['main']);
            });
    }

    onMoreOptions() {
        console.log('Showing more options...');
        this.router.navigate(['sign-in']);
    }
}
