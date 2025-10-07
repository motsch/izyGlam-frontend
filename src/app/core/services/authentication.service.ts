import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { SessionService } from './session.service';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthenticationService {
    isLoggedin = false;

    user: any = {};

    constructor(
        private http: HttpClient,
        private sessionService: SessionService
    ) { }

    private getLang(): string {
        // "fr-FR" -> "fr", fallback "en"
        const raw = localStorage.getItem('langue') || navigator.language || 'en';
        return raw.slice(0, 2).toLowerCase();
    }

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
     * Permet de rafraîchir le token
     * @param user
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
    
    /**
     * Permet d'envoyer un email pour réinitialiser le mot de passe
     * @param email (l'email de l'utilisateur)
     */
    forgotPassword(email: string): Observable<any> {
        const params = new HttpParams().set('lang', this.getLang());
        return this.http.post<any>(
            `${environment.apiUrl}forgot-password`,
            { email },             // ✅ body = { email }
            { params }             // ✅ options = { params }
        );
    }

    /**
     * Permet de réinitialiser le mot de passe avec un token et un nouveau mot de passe
     * @param token (le token reçu par email)
     * @param newPassword (le nouveau mot de passe choisi par l'utilisateur)
     */
    resetPassword(token: string, newPassword: string): Observable<any> {
        return this.http.post<any>(
            environment.apiUrl + 'reset-password',
            { token, newPassword }
        );
    }
}
