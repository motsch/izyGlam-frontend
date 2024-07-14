import { Component, Input, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-shop-card',
    templateUrl: './shop-card.component.html',
    styleUrls: ['./shop-card.component.scss'],
})
export class ShopCardComponent implements OnInit {
    @Input() item: any;
    imgStorageUrl: string = environment.imgStorageUrl;
    imageUrl: string = '';

    ngOnInit() {
        this.imageUrl = this.item.image;
        // initialisez votre URL ici
    }
}
