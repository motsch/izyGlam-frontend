import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

export interface GeoLocationResponse {
    ip: string;
    country_code: string; // ISO Alpha-2 (e.g., "FR")
    country_name: string; // Full name (e.g., "France")
    region: string; // Region name
    city: string; // City name
    latitude: number;
    longitude: number;
    [key: string]: any; // Support additional fields if necessary
}
@Injectable({
    providedIn: 'root',
})
export class GeoLocationService {
    // private readonly GEO_API_URL = 'https://ipapi.co/json/';
    private readonly VPN_CHECK_URL = `${environment.apiUrl}vpn-check`;

    constructor(private http: HttpClient, private router: Router) {}

    /**
     * Get the user's geolocation data from the API.
     * @returns Observable with GeoLocationResponse or an empty object in case of error.
     */
    public getLocation(): Observable<GeoLocationResponse> {
        return this.http.get<any>(environment.apiUrl + 'geolocation');
    }

    /**
     * Check if the user's IP is using a VPN by calling the backend.
     * @param ip The user's IP address to check.
     * @returns Observable<boolean> indicating if the IP is using a VPN.
     */
    public checkVpn(ip: string): Observable<boolean> {
        return this.http.get<any>(`${this.VPN_CHECK_URL}/${ip}`).pipe(
            switchMap((response) => {
                console.log('Résultat de la vérification VPN:', response);
    
                // Vérifie si la réponse indique un proxy
                const isProxy = response[ip]?.proxy === 'yes';
    
                return of(isProxy); // Retourne true si un proxy est détecté
            }),
            catchError((error) => {
                console.error('Erreur lors de la vérification VPN:', error);
                return of(false); // Si une erreur survient, on considère qu'il n'y a pas de VPN
            })
        );
    }
    

    /**
     * Check the user's geolocation and redirect if they are in a restricted country or using a VPN.
     * @param restrictedCountries List of restricted country codes (ISO Alpha-2 format)
     */
    public checkAndRedirect(restrictedCountries: string[] = ['SY', 'KP', 'RU', 'IR', 'GB', 'CN']): void {
        this.getLocation()
            .pipe(
                switchMap((resp) => {
                    if (!resp.ip || !resp.country_code) {
                        console.warn('Impossible de déterminer l’IP ou le code pays.');
                        return of({ isRestricted: false, isVpn: false });
                    }

                    const userCountry = resp.country_code.toUpperCase();
                    console.log('Code pays détecté:', userCountry);

                    const isRestricted = restrictedCountries.includes(userCountry);

                    return this.checkVpn(resp.ip).pipe(
                        switchMap((isVpn) => {
                            return of({ isRestricted, isVpn });
                        })
                    );
                })
            )
            .subscribe(({ isRestricted, isVpn }) => {
                if (isRestricted) {
                    console.warn('Utilisateur dans un pays restreint. Redirection en cours.');
                    this.router.navigate(['/cant-access']);
                } else if (isVpn) {
                    console.warn('Utilisateur utilisant un VPN. Redirection en cours.');
                    this.router.navigate(['/cant-access']);
                }
            });
    }
}
