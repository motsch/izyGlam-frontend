import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';

import { SessionService } from './session.service';

import { Router } from '@angular/router';

/**
 * Protege l'acces aux routes protegée
 */
@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private sessionService: SessionService,
        private router: Router
    ) {}

    canActivate() {
        if (!this.sessionService.isLoggedIn()) {
            this.router.navigateByUrl('home');
        }
        // access seulement si l'utilisateur est loggué
        return this.sessionService.isLoggedIn();
    }
}
