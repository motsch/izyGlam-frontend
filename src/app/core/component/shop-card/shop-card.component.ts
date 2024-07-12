import { Component, Input, OnInit } from '@angular/core';

@Component({
    selector: 'app-shop-card',
    templateUrl: './shop-card.component.html',
    styleUrls: ['./shop-card.component.scss'],
})
export class ShopCardComponent implements OnInit {
    @Input() item: any;
    imageUrl: string = '/assets/images/ubertest2.webp';

    ngOnInit() {
        this.imageUrl = this.item.image;
        // initialisez votre URL ici
    }
}
