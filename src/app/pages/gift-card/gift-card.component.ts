import { Component, ViewChild } from '@angular/core';

@Component({
  selector: 'app-gift-card',
  templateUrl: './gift-card.component.html',
  styleUrls: ['./gift-card.component.scss']
})
export class GiftCardComponent {

  cardValue: number = 20; // Valeur par défaut
}
