import { Component, OnInit } from '@angular/core';
import { GeoLocationService } from '../../services/geolocation.service';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {
    visitorLocationData: any = {};
    today: number = Date.now();

    constructor(
        private geoLocationService: GeoLocationService,
        private router: Router,
        private translate: TranslateService
    ) {}

    ngOnInit() {
        const browserLang = navigator.language.split('-')[0]; // Extrait la langue du navigateur ('fr', 'en', etc.)
        console.log('Langue du navigateur détectée :', browserLang);
    
        // Récupère la langue stockée ou la langue du navigateur, en nettoyant les guillemets doubles
        const storedLangue = (localStorage.getItem('langue') || browserLang || 'en').replace(/"/g, '');
        console.log('Langue stockée dans localStorage :', localStorage.getItem('langue'));
        console.log('Langue utilisée pour ngx-translate :', storedLangue);
    
        const supportedLanguages: { [key: string]: string } = {
            da: 'Dansk', // Danois
            de: 'Deutsch', // Allemand
            en: 'English', // Anglais
            es: 'Español', // Espagnol
            fi: 'Suomi', // Finnois
            fr: 'Français', // Français
            hu: 'Magyar', // Hongrois
            it: 'Italiano', // Italien
            nl: 'Nederlands', // Néerlandais
            pl: 'Polski', // Polonais
            ru: 'Русский', // Russe
            pt: 'Portugais',
            sv: 'Svenska', // Suédois
        };
        const defaultLanguage = 'Français';
    
        // Définir la langue pour ngx-translate
        this.translate.use(storedLangue);
    
        // Récupération de la géolocalisation
        /*this.geoLocationService.getLocation().subscribe(
            (data: any) => {
                console.log('Données complètes de géolocalisation :', data);
        
                // Vérifie si le champ country_code existe
                if (!data || !data.country_code) {
                    console.error('Code pays manquant dans les données de géolocalisation.');
                    return;
                }
        
                const userCountry = data.country_code.toUpperCase(); // Utilise country_code au lieu de countryCode
                console.log('Pays détecté :', userCountry);   
        
                // Récupération de la langue supportée ou utilisation de la langue par défaut
                const userLang = navigator.language.split('-')[0]; // 'fr', 'en', etc.
                const visitorLanguage = supportedLanguages[userLang] || defaultLanguage;
        
                if (!localStorage.getItem('langue')) {
                    localStorage.setItem('langue', userLang.replace(/"/g, ''));
                }
        
                this.visitorLocationData = {
                    ...data,
                    language: visitorLanguage,
                };
        
                console.log(`Langue détectée : ${userLang} (${visitorLanguage})`);
            },
            (error) => {
                console.error(
                    'Erreur lors de la récupération de la géolocalisation',
                    error
                );
            }
        );*/
        
    }
    
    

    goToHelp() {
        this.router.navigate(['help']);
    }
}
