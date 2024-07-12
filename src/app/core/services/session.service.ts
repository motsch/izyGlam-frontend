import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Session service pour la gestion de l'utilisateur loggue
 */
@Injectable()
export class SessionService {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user: any;
    remeberMe: boolean | undefined;
    langue: string | undefined;
    navCategoryTrad: string | undefined;
    lastRoute: string | undefined;
    routeTrad: string | undefined;

    // private userConnected = new BehaviorSubject<boolean>(false);
    constructor() {
        const localStorageUser = localStorage.getItem('user');
        const sessionStorageUser = sessionStorage.getItem('user');
        const localStorageRememberMe = localStorage.getItem('remeberMe');
        const localStorageLangue = localStorage.getItem('langue');
        const localStorageNavCategory = localStorage.getItem('navCategory');
        const localStorageLastRoute = localStorage.getItem('lastRoute');
        const localStorageRouteTrad = localStorage.getItem('routeTrad');
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
            if (localStorageNavCategory) {
                this.navCategoryTrad = JSON.parse(localStorageNavCategory);
            }
            if (localStorageLastRoute) {
                this.lastRoute = JSON.parse(localStorageLastRoute);
            }
            if (localStorageRouteTrad) {
                this.routeTrad = JSON.parse(localStorageRouteTrad);
            }
        } catch (e) {
            this.user = null;
            this.remeberMe = false;
            this.langue = 'fr';
            this.navCategoryTrad = 'Robots';
            this.routeTrad = 'Robots' + ' / ' + 'Flotte de robot';
            this.lastRoute = 'Flotte de robot';
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
     * Récupération de la derniére route
     */
    getRoute() {
        return this.lastRoute;
    }

    /**
     * Mise à jour de la derniére route dans le local storage
     * @param user
     */
    setRoute(lastRoute: string) {
        this.lastRoute = lastRoute;
        localStorage.setItem('lastRoute', JSON.stringify(lastRoute));
    }

    /**
     * Récupération de la derniére route
     */
    getRouteTrad() {
        return this.routeTrad;
    }

    /**
     * Mise à jour de la derniére route dans le local storage
     * @param user
     */
    setRouteTrad(routeTrad: string) {
        this.routeTrad = routeTrad;
        localStorage.setItem('routeTrad', JSON.stringify(routeTrad));
    }

    /**
     * Récupération de la nav cétagorie route
     */
    getNavCategoryTrad() {
        return this.navCategoryTrad;
    }

    /**
     * Mise à jour de la nav catégorie dans le local storage
     * @param user
     */
    setNavCategoryTrad(navCategoryTrad: string) {
        this.navCategoryTrad = navCategoryTrad;
        localStorage.setItem('navCategory', JSON.stringify(navCategoryTrad));
    }

    /**
     * Suppression du user dans le local storage
     */
    destroy() {
        this.setCurrentUser(null, false);
        this.setNavCategoryTrad('');
        this.setRoute('');
        this.setRouteTrad('');
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
