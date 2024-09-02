import { Component } from '@angular/core';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss']
})
export class OrdersComponent {
  orders = [
    {
      establishmentName: "Carrefour",
      totalItems: 1,
      totalPrice: "22,68 €",
      orderDate: "10 mars",
      orderTime: "20:13",
      items: [
        { name: "Kristal - Pavés de saumon atlantique", quantity: 1, size: "(2 pièces)" },
      ]
    },
    {
      establishmentName: "Franprix",
      totalItems: 1,
      totalPrice: "45,00 €",
      orderDate: "10 mars",
      orderTime: "19:05",
      items: [
        { name: "Pavé de saumon Maelström Sacrebleu!", quantity: 1, size: "2x140g" },
      ]
    },
    // Ajoutez ici d'autres commandes suivant le même format...
  ];
}
