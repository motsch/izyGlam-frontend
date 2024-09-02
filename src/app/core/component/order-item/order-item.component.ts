import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-order-item',
  templateUrl: './order-item.component.html',
  styleUrls: ['./order-item.component.scss']
})
export class OrderItemComponent {
  @Input() order: any;

  reorder() {
    // Logic to handle reordering
    console.log('Reorder clicked');
  }

  requestInvoice() {
    // Logic to handle invoice request
    console.log('Invoice requested');
  }
}
