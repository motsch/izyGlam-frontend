import { Component, OnInit } from '@angular/core';
import { AdminService } from 'src/app/core/services/admin.service';
import { SeoService } from 'src/app/core/services/seo.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
    settings: any = {};
    constructor(private seoService: SeoService,
        private adminService: AdminService) { }

    ngOnInit(): void {
        this.seoService.updateMeta('home');
        this.adminService.getAdminSettings().subscribe((data) => {
            this.settings = data;
        });
    }
}
