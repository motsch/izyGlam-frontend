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
    imgStorageUrl: string = environment.APIimgStorageUrl.replace(/\/$/, '');
    APIimgStorageUrl: string = environment.APIimgStorageUrl.replace(/\/$/, '');

    constructor(
        public dialog: MatDialog
    ) { }

    openDialog() {
        localStorage.setItem('productToBuy', JSON.stringify(this.item))
        this.dialog.open(RdvModalComponent);
    }

    calculateFinalPrice(basePrice: number): string {
        const commissionRate = 0.10; // 10% de commission
        const tvaRate = 0.20; // 20% de TVA

        const priceWithCommission = basePrice * (1 + commissionRate);
        const priceWithTva = priceWithCommission * (1 + tvaRate);

        // On garde le résultat en string formaté avec 2 décimales
        return priceWithTva.toFixed(2).replace('.', ',') + ' € TTC';
    }
    onImageError(event: Event) {
        const imgElement = event.target as HTMLImageElement;
        imgElement.src = this.APIimgStorageUrl + '/uploads/images/logo.png';
      }
      
}
