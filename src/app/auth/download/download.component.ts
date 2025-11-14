import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-download',
    templateUrl: './download.component.html',
    styleUrls: ['./download.component.scss'],
})
export class DownloadComponent implements OnInit {
    imgStorageUrl: string = environment.imgStorageUrl;
    lang = 'fr';

    constructor() { }

    ngOnInit() {
        const langTemp = localStorage.getItem('langue');
        if (langTemp === 'fr' || langTemp === 'en' || langTemp === 'es') {
            // valeur valide trouvée en localStorage
            this.lang = langTemp;
        } else {
            // rien ou valeur invalide → on force la langue par défaut
            this.lang = 'fr'; // ou 'en' si tu veux l’anglais par défaut
            localStorage.setItem('langue', this.lang);
        }
    }
}
