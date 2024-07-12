import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';

import { SessionService } from './session.service';

import { Router } from '@angular/router';

/**
 * Protege l'acces aux routes guest
 */
@Injectable()
export class GuestGuard implements CanActivate {
    constructor(
        private sessionService: SessionService,
        private router: Router
    ) {}

    canActivate() {
        if (this.sessionService.isLoggedIn()) {
            this.router.navigateByUrl('main');
        }
        // access seulement si l'utilisateur n'est pas loggué
        return !this.sessionService.isLoggedIn();
    }
}
