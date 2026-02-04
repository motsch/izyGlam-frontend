import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

/**
 * Session service pour la gestion de l'utilisateur loggué
 */
@Injectable()
export class SessionService {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user: any;
    rememberMe: boolean | undefined;
    langue: string | undefined;
    country: string | undefined;
    apiURL = environment.apiUrl;

    private readonly fbAccessTokenKey = 'fbAccessToken';
    private readonly fbTokenExpiryKey = 'fbTokenExpiry';
    // Dans SessionService
    private readonly authTokenKey = 'auth_token';

    constructor(private http: HttpClient) {
        const localStorageUser = localStorage.getItem('user');
        const sessionStorageUser = sessionStorage.getItem('user');
        const localStorageRememberMe = localStorage.getItem('rememberMe');
        const localStorageLangue = localStorage.getItem('langue');
        try {
            if (localStorageUser) {
                this.user = JSON.parse(localStorageUser);
            } else if (sessionStorageUser) {
                this.user = JSON.parse(sessionStorageUser);
            }
            if (localStorageRememberMe) {
                this.rememberMe = JSON.parse(localStorageRememberMe);
            }
            if (localStorageLangue) {
                this.langue = JSON.parse(localStorageLangue);
            }
        } catch (e) {
            this.user = null;
            this.rememberMe = false;
            const lang = localStorage.getItem('langue');
            if (lang) {
                this.langue = lang;
            } else {
                this.langue = 'fr';
            }
        }
    }


    getAuthToken(): string | null {
        return localStorage.getItem(this.authTokenKey) || sessionStorage.getItem(this.authTokenKey);
    }

    setAuthToken(token: string, rememberMe: boolean | null): void {
        if (!token) return;

        if (rememberMe) {
            this.setRememberMe(true);
            localStorage.setItem(this.authTokenKey, token);
            sessionStorage.removeItem(this.authTokenKey);
        } else {
            sessionStorage.setItem(this.authTokenKey, token);
            localStorage.removeItem(this.authTokenKey);
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
    setCurrentUser(user: any, rememberMe: boolean | null) {
        this.user = user;
        if (rememberMe) {
            this.setRememberMe(rememberMe);
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
   * Gestion des tokens Facebook
   */
    setFacebookToken(accessToken: string, expiresIn: number): void {
        if (!expiresIn || typeof expiresIn !== 'number' || expiresIn <= 0) {
            console.error('Durée d\'expiration invalide :', expiresIn);
            return;
        }

        const expiryDate = new Date(Date.now() + expiresIn * 1000).toISOString();
        localStorage.setItem(this.fbAccessTokenKey, accessToken);
        localStorage.setItem(this.fbTokenExpiryKey, expiryDate);
    }


    getFacebookToken(): string | null {
        const expiryDate = localStorage.getItem(this.fbTokenExpiryKey);
        if (expiryDate && new Date() > new Date(expiryDate)) {
            console.warn('Le token Facebook a expiré.');
            return null;
        }
        return localStorage.getItem(this.fbAccessTokenKey);
    }

    async validateAndRenewFacebookToken(): Promise<void> {
        const accessToken = this.getFacebookToken();
        if (!accessToken) {
            console.warn('Pas de token Facebook valide pour le renouvellement.');
            return;
        }

        try {
            const response: any = await this.http
                .get(this.apiURL + 'api/meta/validate-token', {
                    headers: { Authorization: `Bearer ${accessToken}` },
                })
                .toPromise();

            if (!response.data.is_valid) {
                console.log('Le token Facebook n\'est plus valide, tentative de renouvellement...');
                const renewedResponse: any = await this.http
                    .get(this.apiURL + 'meta/extend-token', {
                        headers: { Authorization: `Bearer ${accessToken}` },
                    })
                    .toPromise();

                this.setFacebookToken(renewedResponse.access_token, renewedResponse.expires_in);
                console.log('Token Facebook renouvelé avec succès.');
            } else {
                console.log('Le token Facebook est toujours valide.');
            }
        } catch (error) {
            console.error('Erreur lors de la validation ou du renouvellement du token Facebook :', error);
        }
    }

    /**
     * Récupération de la variable rememberMe
     */
    getRememberMe() {
        return this.rememberMe;
    }

    /**
     * Mise à jour de la variable rememberMe user dans le local storage
     * @param rememberMe
     */
    setRememberMe(rememberMe: boolean) {
        this.rememberMe = rememberMe;
        localStorage.setItem('rememberMe', JSON.stringify(rememberMe));
    }

    /**
     * Récupération de la langue
     */
    getLang() {
        return this.langue;
    }

    /**
     * Mise à jour de la langue dans le local storage
     * @param langue
     */
    setLang(langue: string) {
        this.langue = langue;
        localStorage.setItem('langue', JSON.stringify(langue));
        // location.reload();
    }

    setCountry(country: string) {
        this.country = country;
        localStorage.setItem('pays', JSON.stringify(country));
    }

    /**
     * Suppression du user dans le local storage
     */
    destroy() {
        this.setCurrentUser(null, false);
        localStorage.removeItem('me');
        localStorage.removeItem(this.fbAccessTokenKey);
        localStorage.removeItem(this.fbTokenExpiryKey);
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
