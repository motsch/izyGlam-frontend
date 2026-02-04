import { Injectable } from '@angular/core';
import {
    HttpEvent,
    HttpHandler,
    HttpInterceptor,
    HttpRequest
} from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { SessionService } from './session.service';
import { AuthenticationService } from './authentication.service';
import jwt_decode from 'jwt-decode';
import { Router } from '@angular/router';

@Injectable()
export class InterceptorService implements HttpInterceptor {
    constructor(
        private sessionService: SessionService,
        public router: Router,
        private authService: AuthenticationService
    ) { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        const token = this.getTokenSafe();

        // Pas de token => requête normale
        if (!token) {
            return next.handle(request);
        }

        // Ajoute le token à la requête
        const authReq = this.addTokenToRequest(request, token);

        // Si token pas “bientôt expiré” => on envoie direct
        if (!this.isTokenExpiringSoon(token)) {
            return next.handle(authReq);
        }

        // Sinon => refresh puis retry SANS reload
        const rememberMeRaw = localStorage.getItem('rememberMe');
        const rememberMe = rememberMeRaw ? JSON.parse(rememberMeRaw) : false;

        return this.authService.refreshToken(token).pipe(
            switchMap((response: any) => {
                const newToken = response?.token;
                if (!newToken) {
                    // si refresh ne renvoie rien de correct
                    this.authService.logout();
                    this.router.navigate(['/']);
                    return throwError(() => new Error('Refresh token failed: no token returned'));
                }

                // ✅ Met à jour le token (sans toucher à user)
                this.sessionService.setAuthToken(newToken, rememberMe);

                // ✅ Retry la requête avec le nouveau token
                const newReq = this.addTokenToRequest(request, newToken);
                return next.handle(newReq);
            }),
            catchError((err) => {
                // Logout + retour home
                this.authService.logout();
                this.router.navigate(['/']);
                return throwError(() => err);
            })
        );
    }

    /**
     * Récupère un token de façon robuste (compatible ancien stockage)
     */
    private getTokenSafe(): string | null {
        // 1) nouveau stockage dédié
        const fromAuthToken = this.sessionService.getAuthToken();
        if (fromAuthToken) return fromAuthToken;

        // 2) ancien stockage "user"
        const current = this.sessionService.getCurrentUser();

        // si c’est déjà une string => ok
        if (typeof current === 'string') return current;

        // si c’est un objet avec token => ok
        if (current && typeof current === 'object' && typeof current.token === 'string') {
            return current.token;
        }

        return null;
    }

    private addTokenToRequest(request: HttpRequest<any>, token: string): HttpRequest<any> {
        const clean = (token || '').trim();

        // si le token arrive déjà sous forme "Bearer xxx", on le garde tel quel
        const headerValue = /^Bearer\s+/i.test(clean) ? clean : clean;

        // 👆 pour l’instant on NE FORCE PAS Bearer (safe pour ton backend actuel)

        return request.clone({
            setHeaders: {
                Authorization: headerValue,
            },
        });
    }

    private isTokenExpiringSoon(token: string): boolean {
        const expiration = this.getTokenExpiration(token);
        const now = Date.now() / 1000;
        return expiration - now < 1800; // 30 minutes
    }

    private getTokenExpiration(token: string): number {
        const decodedToken: any = jwt_decode(token);
        return decodedToken.exp;
    }
}
