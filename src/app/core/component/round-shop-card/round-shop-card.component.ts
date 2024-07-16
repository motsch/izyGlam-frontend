import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-round-shop-card',
    templateUrl: './round-shop-card.component.html',
    styleUrls: ['./round-shop-card.component.scss'],
})
export class RoundShopCardComponent {
    @Input() profile: any;
    /*profile = {
        imgSrc: 'path_to_image.jpg',
        name: 'Olivier',
        location: 'Paris 16e (face à face & webcam)',
        rating: 5,
        reviews: 221,
        title: "Maître international (élo>2400) et entraîneur depuis 21 ans en îdf (-50% crédit d'impôt)",
        rate: '80€/h',
        offer: '1er cours offert',
    };*/
}
