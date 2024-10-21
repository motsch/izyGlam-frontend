import { Component, Input, OnInit } from '@angular/core';
import { BookingService } from '../../services/booking.service';
import { ShopService } from '../../services/shop.service';
import { MatDialog } from '@angular/material/dialog';
import { RatingModalComponent } from '../rating-modal/rating-modal.component';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Router } from '@angular/router';

@Component({
  selector: 'app-order-item',
  templateUrl: './order-item.component.html',
  styleUrls: ['./order-item.component.scss']
})
export class OrderItemComponent implements OnInit {
  @Input() order: any;

  constructor(
    private bookingService: BookingService,
    private dialog: MatDialog,
    private router: Router
  ){}

  ngOnInit(): void {}

  reorder() {
    // Logic to handle reordering
    console.log('Reorder clicked');
    this.router.navigate(['shop/' + this.order.shopId]);
  }

  requestInvoice() {
    this.generateProfessionalInvoice();
    this.generateIzyGlamCommissionInvoice();
  }

  // Facture pour le professionnel (Prestation)
  generateProfessionalInvoice() {
    const doc = new jsPDF();
    const startDate = new Date(this.order.start?.$date || this.order.start);
    const endDate = new Date(this.order.end?.$date || this.order.end);
  
    const tvaAmount = parseFloat(this.order.price) * parseFloat(this.order.tva) / 100;
    
    // Ajouter le titre
    doc.text(`Facture de prestation`, 10, 10);
    doc.text(`Établissement: ${this.order.establishmentName}`, 10, 20);
    doc.text(`Adresse: ${this.order.address}`, 10, 30);
  
    // Créer un tableau avec un liseré rose
    (doc as any).autoTable({
      head: [['Description', 'Quantité', 'Prix', 'TVA', 'Total']],
      body: [
        [this.order.productName, '1', `${parseFloat(this.order.price).toFixed(2)} €`, `${tvaAmount.toFixed(2)} €`, `${parseFloat(this.order.price).toFixed(2)} €`]
      ],
      startY: 50,
      theme: 'grid',
      headStyles: { fillColor: [255, 192, 203] },  // Couleur rose
    });
  
    // Ajouter les informations supplémentaires
    doc.text(`Total pour l'établissement: ${parseFloat(this.order.shopEarnings).toFixed(2)} €`, 10, 90);
    doc.text(`Date du service: ${startDate.toLocaleString()} à ${endDate.toLocaleString()}`, 10, 100);
    
    // Sauvegarder le fichier PDF
    doc.save(`facture_prestation_${this.order.clientId}.pdf`);
  }
  

  // Facture pour la commission d'izyGlam
  generateIzyGlamCommissionInvoice() {
    const doc = new jsPDF();
    
    // Ajouter le titre
    doc.text(`Facture de commission`, 10, 10);
    doc.text(`Prestataire: izyGlam`, 10, 20);
    doc.text(`Adresse: 123 Avenue de la République, 75011 Paris`, 10, 30);
  
    const tvaAmount = parseFloat(this.order.commission) * parseFloat(this.order.tva) / 100;
  
    // Créer un tableau avec un liseré rose
    (doc as any).autoTable({
      head: [['Description', 'Quantité', 'Commission', 'TVA', 'Total']],
      body: [
        ['Commission izyGlam', '1', `${parseFloat(this.order.commission).toFixed(2)} €`, `${tvaAmount.toFixed(2)} €`, `${(parseFloat(this.order.commission) + tvaAmount).toFixed(2)} €`]
      ],
      startY: 50,
      theme: 'grid',
      headStyles: { fillColor: [255, 192, 203] },  // Couleur rose
    });
  
    doc.text(`Total commission: ${parseFloat(this.order.commission).toFixed(2)} €`, 10, 90);
    
    // Sauvegarder le fichier PDF
    doc.save(`facture_commission_${this.order.clientId}.pdf`);
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

    this.bookingService.updateBookingStatus(this.order._id, updatedStatus)
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
