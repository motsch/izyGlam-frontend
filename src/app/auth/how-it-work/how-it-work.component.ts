import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-how-it-work',
    templateUrl: './how-it-work.component.html',
    styleUrls: ['./how-it-work.component.scss'],
})
export class HowItWorkComponent implements OnInit {
    imgStorageUrl: string = environment.imgStorageUrl;

    constructor() {}

    ngOnInit() {}
}
