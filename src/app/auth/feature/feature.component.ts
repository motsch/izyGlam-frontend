import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-feature',
    templateUrl: './feature.component.html',
    styleUrls: ['./feature.component.scss'],
})
export class FeatureComponent implements OnInit {
    imgStorageUrl: string = environment.imgStorageUrl;

    constructor(private router: Router) {}

    ngOnInit() {}

    goTo(name: string) {
        console.log(name);
        this.router.navigate(['/' + name]);

    }
}
