import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-feature',
    templateUrl: './feature.component.html',
    styleUrls: ['./feature.component.scss'],
})
export class FeatureComponent implements OnInit {
    imgStorageUrl: string = environment.imgStorageUrl;

    constructor() {}

    ngOnInit() {}
}
