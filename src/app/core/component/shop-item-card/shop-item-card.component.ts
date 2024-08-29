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
   
    constructor(
        public dialog: MatDialog
    ) {}

    openDialog() {
        localStorage.setItem('productToBuy',JSON.stringify(this.item))
        this.dialog.open(RdvModalComponent);
    }
}
