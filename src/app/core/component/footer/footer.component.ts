import { Component, OnInit } from '@angular/core';
import { GeoLocationService } from '../../services/geolocation.service';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {
    country: string = '';
    visitorLocationData: any = {};
    today: number = Date.now();

    constructor(private geoLocationService: GeoLocationService) {}

    ngOnInit() {
        this.geoLocationService.getLocation().subscribe(
            (data) => {
                console.log(data);
                let userLang = navigator.language;
                console.log('The language is: ' + userLang);
                if (userLang === 'fr') {
                    this.visitorLocationData = data;
                    this.visitorLocationData.language = 'Français';
                    localStorage.setItem('langue', 'fr');
                } else if (userLang === 'en') {
                    this.visitorLocationData = data;
                    this.visitorLocationData.language = 'English';
                    localStorage.setItem('langue', 'en');
                } else if (userLang === 'es') {
                    this.visitorLocationData = data;
                    this.visitorLocationData.language = 'Español';
                    localStorage.setItem('langue', 'es');
                } else if (userLang === 'de') {
                    this.visitorLocationData = data;
                    this.visitorLocationData.language = 'Deutsch';
                    localStorage.setItem('langue', 'de');
                } else if (userLang === 'it') {
                    this.visitorLocationData = data;
                    this.visitorLocationData.language = 'Italiano';
                    localStorage.setItem('langue', 'it');
                } else if (userLang === 'nl') {
                    this.visitorLocationData = data;
                    this.visitorLocationData.language = 'Nederlands';
                    localStorage.setItem('langue', 'nl');
                } else if (userLang === 'sv') {
                    this.visitorLocationData = data;
                    this.visitorLocationData.language = 'Svenska';
                    localStorage.setItem('langue', 'sv');
                } else if (userLang === 'pl') {
                    this.visitorLocationData = data;
                    this.visitorLocationData.language = 'Polski';
                    localStorage.setItem('langue', 'pl');
                } /* else if (userLang === 'da') {
                    this.visitorLocationData = data;
                    this.visitorLocationData.language = 'Dansk';
                    localStorage.setItem('langue', 'da');
                } */ else if (userLang === 'fi') {
                    this.visitorLocationData = data;
                    this.visitorLocationData.language = 'Suomi';
                    localStorage.setItem('langue', 'fi');
                } else {
                    this.visitorLocationData = data;
                    this.visitorLocationData.language = 'Français';
                    localStorage.setItem('langue', 'fr');
                }
                // localStorage.setItem('langue', 'de');
                this.visitorLocationData = data;
                this.country = data.country;
            },
            (error) => {
                console.error(
                    'Erreur lors de la récupération de la géolocalisation',
                    error
                );
            }
        );
    }
}
