import { Component, Input } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-shop-item-card',
    templateUrl: './shop-item-card.component.html',
    styleUrls: ['./shop-item-card.component.scss'],
})
export class ShopItemCardComponent {
    @Input() item: any;
    imgStorageUrl: string = environment.imgStorageUrl;
    // /assets/images/ubertest2.webp
}
