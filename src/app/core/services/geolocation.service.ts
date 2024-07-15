import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class GeoLocationService {
    private readonly API_URL = 'https://ipapi.co/json/';

    constructor(private http: HttpClient, private router: Router) {}

    public getLocation() {
        return this.http.get<any>(this.API_URL);
    }

    public checkAndRedirect() {
        this.getLocation().subscribe({
            next: (resp) => {
                if (!environment.allowedCountries.includes(resp.country_code)) {
                    this.router.navigate(['/coming-soon/' + resp.country_code]);
                }
            },
            error: (err) =>
                console.error('Erreur lors de la récupération du pays:', err),
        });
    }
}
