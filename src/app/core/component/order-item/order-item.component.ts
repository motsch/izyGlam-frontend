import { Component, Input, OnInit } from '@angular/core';
import { BookingService } from '../../services/booking.service';
import { ShopService } from '../../services/shop.service';
import { MatDialog } from '@angular/material/dialog';
import { RatingModalComponent } from '../rating-modal/rating-modal.component';

@Component({
  selector: 'app-order-item',
  templateUrl: './order-item.component.html',
  styleUrls: ['./order-item.component.scss']
})
export class OrderItemComponent implements OnInit {
  @Input() order: any;

  constructor(
    private bookingService: BookingService,
    private shopService: ShopService,
    private dialog: MatDialog
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



  openRatingDialog() {
    const dialogRef = this.dialog.open(RatingModalComponent, {
      width: '300px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Logique pour gérer la soumission de l'avis
        console.log('Review submitted', result);
      }
    });
  }
}
