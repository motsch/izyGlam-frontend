import { Component, Input, OnInit } from '@angular/core';
import { BookingService } from '../../services/booking.service';
import { ShopService } from '../../services/shop.service';

@Component({
  selector: 'app-order-item',
  templateUrl: './order-item.component.html',
  styleUrls: ['./order-item.component.scss']
})
export class OrderItemComponent implements OnInit {
  @Input() order: any;

  constructor(
    private bookingService: BookingService,
    private shopService: ShopService
  ){}

  ngOnInit(): void {}

  reorder() {
    // Logic to handle reordering
    console.log('Reorder clicked');
  }

  requestInvoice() {
    // Logic to handle invoice request
    console.log('Invoice requested');
  }
}
