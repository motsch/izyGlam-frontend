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

    async canActivate() {
        if (this.sessionService.isLoggedIn()) {
            this.router.navigateByUrl('main');
        } else {
            let isUserKnown = localStorage.getItem('unknownUser');
            if (!isUserKnown) {
                localStorage.setItem(
                    'unknownUser',
                    await this.generateRandomString(13)
                );
            } else {
                if (isUserKnown.length === 13) {
                    this.router.navigateByUrl('main');
                }
            }
        }
        // access seulement si l'utilisateur n'est pas loggué
        return !this.sessionService.isLoggedIn();
    }
    generateRandomString(length: number) {
        let result = '';
        const characters = '0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(
                Math.floor(Math.random() * charactersLength)
            );
        }
        return result;
    }
}
