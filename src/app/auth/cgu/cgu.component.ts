import { Component, OnInit } from '@angular/core';
import { CoreModule } from '../../core/core.module';
import { SeoService } from 'src/app/core/services/seo.service';

@Component({
    selector: 'app-cgu',
    templateUrl: './cgu.component.html',
    styleUrl: './cgu.component.scss',
})
export class CguComponent implements OnInit {
    constructor(
      private seoService: SeoService) {}

    ngOnInit(): void {
      this.seoService.updateMeta('cgu');
    }
}
