import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SessionService } from './session.service';

/**
 * Protège l'accès aux routes guest (non-authentifiées)
 */
@Injectable({
  providedIn: 'root', // Permet une injection automatique via Angular's DI
})
export class GuestGuard implements CanActivate {
  constructor(
    private sessionService: SessionService,
    private router: Router
  ) {}

  canActivate(): boolean {
    const isLoggedIn = this.sessionService.isLoggedIn();

    if (isLoggedIn) {
      // Redirection vers la route principale si l'utilisateur est connecté
      this.router.navigateByUrl('/main');
      return false;
    }

    // Autoriser l'accès uniquement si l'utilisateur n'est pas logué
    return true;
  }
}
