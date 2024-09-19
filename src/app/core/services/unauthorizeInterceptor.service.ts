import { SessionService } from './session.service';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { EmitterService } from './emitter.service';
import { Observable } from 'rxjs';
import { AuthenticationService } from './authentication.service';

/**
 * Intercepteur pour les requetes Http
 */
@Injectable()
export class UnauthorizedInterceptorService implements HttpInterceptor {
    constructor(
        private router: Router,
        private sessionService: SessionService,
        private emitterService: EmitterService,
        private authenticationService: AuthenticationService
    ) {}

    intercept(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        request: HttpRequest<any>,
        next: HttpHandler
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ): Observable<HttpEvent<any>> {
        // pour chaque requete http : on active le loader
        // this.emitterService.change(true);

        return next.handle(request).pipe(
            tap(
                (event) => {
                    // your code
                    if (event instanceof HttpResponse) {
                        // une fois la reponse : on desactive le loader
                        // this.emitterService.change(false);
                    }
                },
                (err: any) => {
                    // une fois l'erreur : on desactive le loader
                    // this.emitterService.change(false);

                    if (err instanceof HttpErrorResponse) {
                        // deconnection et retour sur login si 401
                        if (err.status == 403) {
                            // Appel de service permettant de se logout
                            this.authenticationService.logout();
                            this.router.navigate(['/']);

                            console.log(err.status);
                            console.log(JSON.stringify(err));
                        } else {
                            // Francis gérer ce genre d'erreur dans une alerte !
                            // et on ouvre une popup pour l'affichage de l'erreur
                            this.emitterService.change(err);
                        }
                    }
                }
            )
        );
    }
}
