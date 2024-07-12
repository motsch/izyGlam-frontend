import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SessionService } from './session.service';
import { environment } from 'src/environnements/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
    isLoggedin = false;

    user: any = {};

    constructor(
        private http: HttpClient,
        private sessionService: SessionService
    ) {}
    /**
     * Permet de logger l'utilisateur (selectionne l'utilisateur ayant le bon mdp et email)
     * @param email (l'email de l'utilisateur)
     * @param password (le mot de passe de l'utilisateur)
     */
    login(email: string, password: string): Observable<any> {
        const credentials = { email, password };
        return this.http.post<any>(environment.apiUrl + 'login', credentials);
    }

    loginSms(email: any, phone: any) {
        const credentials = { email, phone };
        return this.http.post<any>(
            environment.apiUrl + 'login-sms',
            credentials
        );
    }
    loginVerifSms(sid: any, code: any, connectKey: any) {
        const credentials = { sid, code, connectKey };
        return this.http.post<any>(
            environment.apiUrl + 'login-verif-sms',
            credentials
        );
    }

    register(newUser: any): Observable<any> {
        return this.http.post<any>(
            environment.apiUrl + 'registerUserNoToken',
            newUser
        );
    }

    /**
     * Permet de logger l'utilisateur (selectionne l'utilisateur ayant le bon mdp et email)
     * @param email (l'email de l'utilisateur)
     * @param password (le mot de passe de l'utilisateur)
     */
    refreshToken(user: any) {
        return this.http.post<any>(environment.apiUrl + '/refresh-token', user);
    }

    /**
     * Permet de se déconnecter
     */
    logout() {
        // remove user from local storage to log user out
        this.sessionService.destroy();
        this.isLoggedin = false;
        return this.isLoggedin;
    }

    /**
     * Vérifie que l'utilisateur est connecté
     */
    isLoggedIn() {
        if (this.sessionService.getCurrentUser().auth_token == null) {
            this.isLoggedin = false;
            return this.isLoggedin;
        } else {
            return true;
        }
    }
}
