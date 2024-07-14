import { Component, OnInit } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-forget-password',
    templateUrl: './forget-password.component.html',
    styleUrls: ['./forget-password.component.scss'],
})
export class ForgetPasswordComponent implements OnInit {
    imgStorageUrl: string = environment.imgStorageUrl;

    constructor(
        private route: ActivatedRoute,
        private title: Title,
        private meta: Meta
    ) {}

    ngOnInit() {
        this.title.setTitle(this.route.snapshot.data['title']);
    }
}
