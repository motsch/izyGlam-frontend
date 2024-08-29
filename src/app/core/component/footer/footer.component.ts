import { Component, OnInit } from '@angular/core';
import { GeoLocationService } from '../../services/geolocation.service';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {
    visitorLocationData: any = {};
    today: number = Date.now();

    constructor(private geoLocationService: GeoLocationService) {}

    ngOnInit() {
        let storedLangue = localStorage.getItem('langue');
        this.geoLocationService.checkAndRedirect();
        this.geoLocationService.getLocation().subscribe(
            (data) => {
                console.log(data);
                let userLang = navigator.language;
                console.log('The language is: ' + userLang);
                if (userLang === 'fr') {
                    this.visitorLocationData = data;
                    this.visitorLocationData.language = 'Français';
                } else if (userLang === 'en') {
                    this.visitorLocationData = data;
                    this.visitorLocationData.language = 'English';
                } else if (userLang === 'es') {
                    this.visitorLocationData = data;
                    this.visitorLocationData.language = 'Español';
                } else if (userLang === 'de') {
                    this.visitorLocationData = data;
                    this.visitorLocationData.language = 'Deutsch';
                } else if (userLang === 'it') {
                    this.visitorLocationData = data;
                    this.visitorLocationData.language = 'Italiano';
                } else if (userLang === 'nl') {
                    this.visitorLocationData = data;
                    this.visitorLocationData.language = 'Nederlands';
                } else if (userLang === 'sv') {
                    this.visitorLocationData = data;
                    this.visitorLocationData.language = 'Svenska';
                } else if (userLang === 'pl') {
                    this.visitorLocationData = data;
                    this.visitorLocationData.language = 'Polski';
                } /* else if (userLang === 'da') {
                        this.visitorLocationData = data;
                        this.visitorLocationData.language = 'Dansk';
                        localStorage.setItem('langue', 'da');
                    } */ else if (userLang === 'fi') {
                    this.visitorLocationData = data;
                    this.visitorLocationData.language = 'Suomi';
                } else {
                    this.visitorLocationData = data;
                    this.visitorLocationData.language = 'Français';
                }
                if (!storedLangue) {
                    localStorage.setItem('langue', userLang);
                }
                this.visitorLocationData = data;
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
