import { Component, ViewChild } from '@angular/core';
import { NgxQrcodeStylingComponent, Options } from 'ngx-qrcode-styling';

@Component({
  selector: 'app-gift-card',
  templateUrl: './gift-card.component.html',
  styleUrls: ['./gift-card.component.scss']
})
export class GiftCardComponent {
  @ViewChild('qrcode', { static: false }) qrcode!: NgxQrcodeStylingComponent;

  cardValue: number = 20; // Valeur par défaut
  config: Options = {
    width: 300,
    height: 300,
    data: 'Initial Data', // Initialisation des données ici
    image: '',
    margin: 5,
    dotsOptions: {
      color: "#B23A48",
      type: "dots"
    },
    backgroundOptions: {
      color: "#ffffff",
    },
    imageOptions: {
      crossOrigin: "anonymous",
      margin: 0
    }
  };

  generateQRCode() {
    this.config.data = `GIFT-CARD-${this.cardValue}-EUR-${new Date().getTime()}`;
    this.qrcode.update(this.config, {}).subscribe(() => {
      console.log("QR Code Updated with data:", this.config.data);
    });
  }

  onDownload() {
    if (this.qrcode) {
      this.qrcode.download().subscribe((res: any) => {
        console.log('QR code downloaded:', res);
      });
    }
  }
}
