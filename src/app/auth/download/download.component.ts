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
        let langTemp = localStorage.getItem('langue');
        if (langTemp) {
            this.lang = langTemp;
        } else if (langTemp != 'fr' && langTemp != 'en' && langTemp !== 'es') {
            this.lang = 'en'
        }
    }
}
