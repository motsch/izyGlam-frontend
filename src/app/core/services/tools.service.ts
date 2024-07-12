import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs'; // Importer 'of' de RxJS

@Injectable({
    providedIn: 'root',
})
export class ToolsService {
    private countries: any[] = [];

    constructor(private http: HttpClient) {
        this.loadCountryCodes();
    }

    private loadCountryCodes(): void {
        this.http
            .get<{ countries: any[] }>('/assets/json/country-codes.json')
            .subscribe(
                (data: any) => (this.countries = data.countries),
                (error: any) =>
                    console.error('Could not load country codes:', error)
            );
    }

    identifierType(chaine: string): Observable<string> {
        // Regex pour vérifier un email
        const emailRegex = new RegExp(
            '^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$'
        );
        // Regex pour vérifier un numéro de téléphone international
        const phoneRegex = new RegExp(
            '^\\+?(\\d{1,3})[-\\s]?(\\d{1,3})[-\\s]?(\\d{4,})$'
        );

        // Vérifier si c'est un email
        if (emailRegex.test(chaine)) {
            return of('Email'); // Utiliser 'of' pour retourner un Observable
        }
        // Vérifier si c'est un numéro de téléphone
        else if (phoneRegex.test(chaine)) {
            const match = phoneRegex.exec(chaine);
            if (match) {
                const codePays = match[1];
                const country = this.countries.find(
                    (c) => c.code === `+${codePays}`
                );
                const countryName = country ? country.name : 'Inconnu';
                return of(`Numéro de téléphone (Pays : ${countryName})`); // Utiliser 'of'
            }
            return of('Numéro de téléphone (Pays non reconnu)'); // Utiliser 'of'
        }
        return of('Inconnu'); // Utiliser 'of' pour le cas par défaut
    }
}
