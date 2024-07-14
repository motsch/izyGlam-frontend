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
        localStorage.setItem('langue', 'fr');
        this.geoLocationService.getLocation().subscribe(
            (data) => {
                console.log(data);
                let userLang = navigator.language;
                console.log('The language is: ' + userLang);
                if (userLang === 'fr') {
                    this.visitorLocationData = data;
                    this.visitorLocationData.language = 'Français';
                }
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
