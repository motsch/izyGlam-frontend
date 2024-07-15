import { Injectable } from '@angular/core';

/**
 * Session service pour la gestion de l'utilisateur loggue
 */
@Injectable()
export class SessionService {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user: any;
    remeberMe: boolean | undefined;
    langue: string | undefined;

    // private userConnected = new BehaviorSubject<boolean>(false);
    constructor() {
        const localStorageUser = localStorage.getItem('user');
        const sessionStorageUser = sessionStorage.getItem('user');
        const localStorageRememberMe = localStorage.getItem('remeberMe');
        const localStorageLangue = localStorage.getItem('langue');
        try {
            if (localStorageUser) {
                this.user = JSON.parse(localStorageUser);
            } else if (sessionStorageUser) {
                this.user = JSON.parse(sessionStorageUser);
            }
            if (localStorageRememberMe) {
                this.remeberMe = JSON.parse(localStorageRememberMe);
            }

            if (localStorageLangue) {
                this.langue = JSON.parse(localStorageLangue);
            }
        } catch (e) {
            this.user = null;
            this.remeberMe = false;
            this.langue = 'fr';
        }
    }

    /**
     * Récupération de user
     */
    getCurrentUser() {
        const localStorageUser = localStorage.getItem('user');
        const sessionStorageUser = sessionStorage.getItem('user');
        if (localStorageUser) {
            this.user = JSON.parse(localStorageUser);
        } else if (sessionStorageUser) {
            this.user = JSON.parse(sessionStorageUser);
        }
        return this.user;
    }

    /**
     * Mise à jour du user dans le local storage
     * @param user
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setCurrentUser(user: any, remeberMe: boolean | null) {
        this.user = user;
        if (remeberMe) {
            this.setRememberMe(remeberMe);
            localStorage.setItem('user', JSON.stringify(user));
            if (sessionStorage.getItem('user')) {
                sessionStorage.removeItem('user');
            }
        } else {
            sessionStorage.setItem('user', JSON.stringify(user));
            if (localStorage.getItem('user')) {
                localStorage.removeItem('user');
            }
        }
    }

    /**
     * Récupération de la variable rememberMe
     */
    getRememberMe() {
        return this.remeberMe;
    }

    /**
     * Mise à jour de la variable rememberMe user dans le local storage
     * @param user
     */
    setRememberMe(remeberMe: boolean) {
        this.remeberMe = remeberMe;
        localStorage.setItem('remeberMe', JSON.stringify(remeberMe));
    }

    /**
     * Récupération de la langue
     */
    getLang() {
        return this.langue;
    }

    /**
     * Mise à jour de la langue dans le local storage
     * @param user
     */
    setLang(langue: string) {
        this.langue = langue;
        localStorage.setItem('langue', JSON.stringify(langue));
        location.reload();
    }

    /**
     * Suppression du user dans le local storage
     */
    destroy() {
        this.setCurrentUser(null, false);
        localStorage.removeItem('me');
    }

    /**
     * Vérifie si l'utilisateur est loggué
     */
    isLoggedIn() {
        return this.user != null;
    }

    /**
     * Vérifie si l'utilisateur est ADMIN
     */
    isAdmin() {
        return this.isLoggedIn() && this.user.role === 'ADMIN';
    }
}
