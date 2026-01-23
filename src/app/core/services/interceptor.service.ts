import { Injectable } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
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
    ) {}

    intercept(
        request: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        const token = this.sessionService.getCurrentUser();

        if (token) {
            request = this.addTokenToRequest(request, token);

            // Vérifiez si le token doit être rafraîchi
            if (this.isTokenExpiringSoon(token)) {
                this.refreshTokenAndRetry(request, next);
                window.location.reload();
            }
        }

        return next.handle(request);
    }

    private addTokenToRequest(
        request: HttpRequest<any>,
        token: string
    ): HttpRequest<any> {
        return request.clone({
            setHeaders: {
                Authorization: token,
            },
        });
    }

    private isTokenExpiringSoon(token: string): boolean {
        const expiration = this.getTokenExpiration(token);
        const now = Date.now() / 1000; // Convertir en secondes
        // Vérifiez si le token expire dans moins de 5 minutes (par exemple)
        return expiration - now < 1800; // 1800 secondes = 30 minutes
    }

    private getTokenExpiration(token: string): number {
        const decodedToken: any = jwt_decode(token); // Utilisez la fonction ici
        return decodedToken.exp;
    }

    private refreshTokenAndRetry(
        request: HttpRequest<any>,
        next: HttpHandler
    ): any {
        const rememberMe = localStorage.getItem('rememberMe');
        this.authService
            .refreshToken(this.sessionService.getCurrentUser())
            .subscribe(
                (response: any) => {
                    const newToken = response.token; // Nouveau token généré par le serveur
                    let boolRememberMe: boolean = false;
                    if (rememberMe) {
                        boolRememberMe = JSON.parse(rememberMe);
                    }
                    // Mettez à jour le token dans le sessionService
                    this.sessionService.setCurrentUser(
                        newToken,
                        boolRememberMe
                    );
                    // Réessayez la requête avec le nouveau token
                    const newRequest = this.addTokenToRequest(
                        request,
                        newToken
                    );
                    return next.handle(newRequest);
                },
                (error: string) => {
                    // Appel de service permettant de se logout
                    this.authService.logout();
                    this.router.navigate(['/']);
                    console.log(JSON.stringify(error));
                    
                }
            );
    }
}
