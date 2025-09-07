import { Component, Input, OnInit } from '@angular/core';
import { BookingService } from '../../services/booking.service';
import { ShopService } from '../../services/shop.service';
import { MatDialog } from '@angular/material/dialog';
import { RatingModalComponent } from '../rating-modal/rating-modal.component';
import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { Router } from '@angular/router';

(pdfMake as any).vfs = pdfFonts.pdfMake.vfs;

@Component({
  selector: 'app-order-item',
  templateUrl: './order-item.component.html',
  styleUrls: ['./order-item.component.scss']
})
export class OrderItemComponent implements OnInit {
  @Input() order: any;
  storedLangue = (localStorage.getItem('langue') || '').replace(/^"(.*)"$/, '$1').trim().slice(0, 2).toLowerCase();

  constructor(
    private bookingService: BookingService,
    private dialog: MatDialog,
    private router: Router
  ){}

  ngOnInit(): void {}

  requestInvoice() {
    this.generateProfessionalInvoice();
    this.generateIzyGlamCommissionInvoice();
  }

  generateProfessionalInvoice() {
    const startDate = new Date(this.order.start?.$date || this.order.start);
    const endDate = new Date(this.order.end?.$date || this.order.end);
    const tvaAmount = parseFloat(this.order.price) * parseFloat(this.order.tva) / 100;

    const docDefinition: any = {
      content: [
        { text: 'Facture de prestation', style: 'header' },
        `Établissement: ${this.order.establishmentName}`,
        `Adresse: ${this.order.address}`,
        {
          table: {
            body: [
              ['Description', 'Quantité', 'Prix', 'TVA', 'Total'],
              [
                this.order.productName, 
                '1', 
                `${parseFloat(this.order.price).toFixed(2)} €`, 
                `${tvaAmount.toFixed(2)} €`, 
                `${parseFloat(this.order.price).toFixed(2)} €`
              ]
            ]
          },
          layout: 'lightHorizontalLines'
        },
        `Total pour l'établissement: ${parseFloat(this.order.shopEarnings).toFixed(2)} €`,
        `Date du service: ${startDate.toLocaleString()} à ${endDate.toLocaleString()}`
      ],
      styles: {
        header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
        tableHeader: { fillColor: '#FFC0CB' }
      }
    };

    pdfMake.createPdf(docDefinition).download(`facture_prestation_${this.order.clientId}.pdf`);
  }

  generateIzyGlamCommissionInvoice() {
    const tvaAmount = parseFloat(this.order.commission) * parseFloat(this.order.tva) / 100;

    const docDefinition: any = {
      content: [
        { text: 'Facture de commission', style: 'header' },
        'Prestataire: izyGlam',
        'Adresse: 123 Avenue de la République, 75011 Paris',
        {
          table: {
            body: [
              ['Description', 'Quantité', 'Commission', 'TVA', 'Total'],
              [
                'Commission izyGlam', 
                '1', 
                `${parseFloat(this.order.commission).toFixed(2)} €`, 
                `${tvaAmount.toFixed(2)} €`, 
                `${(parseFloat(this.order.commission) + tvaAmount).toFixed(2)} €`
              ]
            ]
          },
          layout: 'lightHorizontalLines'
        },
        `Total commission: ${parseFloat(this.order.commission).toFixed(2)} €`
      ],
      styles: {
        header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
        tableHeader: { fillColor: '#FFC0CB' }
      }
    };

    pdfMake.createPdf(docDefinition).download(`facture_commission_${this.order.clientId}.pdf`);
  }

  

  reorder() {
    // Logic to handle reordering
    console.log('Reorder clicked');
    this.router.navigate(['shop/' + this.order.shopId]);
  }

  openRatingDialog() {
    const shopId = this.order.shopId;
    // ajouter order._id dans les params
    const dialogRef = this.dialog.open(RatingModalComponent, {
      width: '300px',
      data: {
        shopId: shopId, // Passing the shopId to the modal
      },
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Logique pour gérer la soumission de l'avis
        console.log('Review submitted', result);
        this.order.reviewAdded = true;
        this.bookingService.update(this.order).subscribe({
          next: (data: any) => {
              console.log(data);
              console.log('Order updated successfully');
              console.log(this.order);
          },
          error: (error: any) => {
              console.log(error);
          },
      });
      }
    });
  }  

  cancelOrder() {
    // Mettre à jour le statut de la commande en "cancelled"
    const updatedStatus = 'cancelled';

    this.bookingService.updateBookingStatus(this.order._id, updatedStatus, this.storedLangue)
      .subscribe(
        (response:any) => {
          // Mise à jour locale du statut après succès de la requête
          this.order.status = updatedStatus;
          console.log('Order cancelled successfully', response);
        },
        (error:any) => {
          console.error('Error cancelling the order', error);
        }
      );
  }
}
