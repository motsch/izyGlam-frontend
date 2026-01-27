import { Component } from '@angular/core';
import { SeoService } from 'src/app/core/services/seo.service';
import { SessionService } from 'src/app/core/services/session.service';

@Component({
    selector: 'app-izyphone-info',
    templateUrl: './izyPhone-info.component.html',
    styleUrls: ['./izyPhone-info.component.scss'],
})
export class IzyPhoneInfoComponent {
    constructor(public sessionService: SessionService, private seoService: SeoService) { }

    ngOnInit(): void {
        this.seoService.updateMeta('pro');
    }
}
