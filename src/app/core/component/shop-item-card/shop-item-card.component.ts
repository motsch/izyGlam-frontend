import { Component, Input } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { environment } from 'src/environments/environment';
import { RdvModalComponent } from '../rdv-modal/rdv-modal.component';

@Component({
    selector: 'app-shop-item-card',
    templateUrl: './shop-item-card.component.html',
    styleUrls: ['./shop-item-card.component.scss'],
})
export class ShopItemCardComponent {
    @Input() item: any;
    imgStorageUrl: string = environment.imgStorageUrl;
    // /assets/images/ubertest2.webp
   
    constructor(
        public dialog: MatDialog
    ) {}

    openDialog() {
        this.dialog.open(RdvModalComponent);
    }
}
