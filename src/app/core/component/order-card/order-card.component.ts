import { Component, EventEmitter, Input, Output } from '@angular/core';
import moment from 'moment';
import { BookingService } from '../../services/booking.service';
import { FinancialService } from '../../services/financial.service';
import { environment } from 'src/environments/environment';
import { TransactionService } from '../../services/transaction.service';
import { StripeService } from '../../services/stripe.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-order-card',
  standalone: false,
  templateUrl: './order-card.component.html',
  styleUrl: './order-card.component.scss'
})
export class OrderCardComponent {
  APIimgStorageUrl: string = environment.APIimgStorageUrl.replace(/\/$/, '');
  @Input() order: any;
  @Input() index: number = 0;
  @Input() imageLoaded: boolean = false;
  @Input() isWithinDisplayTime: boolean = false;
  @Input() isAfterGracePeriod: boolean = false;
  @Input() availableActions: string[] = [];
  @Output() onDownloadInvoice = new EventEmitter<any>();
  @Output() onUpdateNeeded = new EventEmitter<any>();
  @Output() modalReview = new EventEmitter<any>();
  apiImageUrl = environment.APIimgStorageUrl;
  confirmCodeInput: string = '';
  imgStorageUrl: string = environment.APIimgStorageUrl.replace(/\/$/, '');

  constructor(private stripeService: StripeService, private router: Router, private transactionService: TransactionService, private bookingService: BookingService, private financialService: FinancialService) { }

  deleteBooking(order: any) {
    console.log("Booking to delete:", JSON.stringify(order));
    // Mise à jour du statut du booking
    this.bookingService.updateBookingStatus(order._id, 'deleted').subscribe({
      next: (response: any) => {
        console.log("Booking update response:", JSON.stringify(response));
        console.log("DELETE OK");
        const bookingStart = moment(order.start);
        const now = moment();
        const diffHours = bookingStart.diff(now, 'hours');
        console.log(`Différence en heures entre maintenant et le début du booking : ${diffHours}`);
        if (diffHours >= 24) {
          console.log("Suppression > 24h avant la prestation : remboursement complet du client.");
          this.financialService.processRefund(order._id, "customer-cancel-greater-than-24").subscribe({
            next: (refundResponse: any) => {
              console.log("Remboursement complet effectué via FinancialService:", refundResponse);
            },
            error: (refundError: any) => {
              console.error("Erreur lors du remboursement complet:", refundError);
            }
          });
        } else {
          console.log("Suppression < 24h avant la prestation : remboursement partiel (50%).");
          if (window.confirm("Attention, si vous continuez, vous ne serez remboursé qu'à 50% du montant payé. Voulez-vous confirmer ?")) {
            this.financialService.processRefund(order._id, "customer-cancel-less-than-24").subscribe({
              next: (refundResponse: any) => {
                console.log("Remboursement partiel effectué via FinancialService:", refundResponse);
              },
              error: (refundError: any) => {
                console.error("Erreur lors du remboursement partiel:", refundError);
              }
            });
          } else {
            console.log("Annulation de l'opération par le client.");
          }
        }
      },
      error: (error: any) => {
        console.error("Erreur lors de la mise à jour du booking :", JSON.stringify(error));
        console.log("DELETE FAILED");
      }
    });
  }

  onImageLoad(orderId: string) {
    // this.imageLoaded[orderId] = true;
    // this.cdr.detectChanges();
    console.log("Image Loaded UPDATED: ", JSON.stringify(this.imageLoaded));
  }

  goToShop(order: any) {
    console.log(order);
    // go to shop/:order.shopId
    this.router.navigate(['shop/' + order.shopId]); // Navigation programmée vers la page du shop
    // this.router.navigate(['shop'], { state: { booking: order } });
  }

  /**
   * Génère un code aléatoire à 6 chiffres pour le booking.
   */
  generateCode(booking: any) {
    booking.generatedCode = Math.floor(100000 + Math.random() * 900000);
    console.log(`Code généré pour le booking ${booking._id}: ${booking.generatedCode}`);
    // Optionnel : appeler un service pour sauvegarder ce code dans la base de données
    this.bookingService.update(booking)
      .subscribe(response => {
        console.log(JSON.stringify(response));
        console.log("Generated code saved");
      }, error => {
        console.log(JSON.stringify(error));
        console.log("ACCEPTED FAILED");
      });
  }

  markPrestataireAbsent(order: any) {
    console.log('Prestataire absent pour la commande', order);
    console.log("Booking to no-show-pro : " + JSON.stringify(order));

    // Mise à jour du statut du booking en "no-show-pro"
    this.bookingService.updateBookingStatus(order._id, 'no-show-pro')
      .subscribe(response => {
        console.log("Booking no-show-pro response :", JSON.stringify(response));

        // Remboursement complet du client via Stripe
        this.stripeService.refundPayment(order.paymentIntentId).subscribe({
          next: (refundResponse: any) => {
            console.log("Remboursement complet réussi via Stripe :", refundResponse);

            // Mise à jour de la transaction initiale associée au booking pour indiquer le remboursement
            this.transactionService.getAll().subscribe((transactions: any[]) => {
              const matchingTransactions = transactions.filter(tx => tx.idBooking === order._id);
              console.log("Transactions trouvées pour ce booking :", matchingTransactions);
              if (matchingTransactions.length > 0) {
                matchingTransactions.forEach((tx: any) => {
                  tx.status = "refunded"; // ou "cancelled" selon votre convention
                  this.transactionService.update(tx).subscribe(
                    updatedTx => {
                      console.log("Transaction mise à jour pour remboursement :", JSON.stringify(updatedTx));
                    },
                    error => {
                      console.error("Erreur lors de la mise à jour de la transaction :", JSON.stringify(error));
                    }
                  );
                });
              } else {
                console.warn("Aucune transaction trouvée pour ce booking.");
              }
            }, error => {
              console.error("Erreur lors de la récupération des transactions :", JSON.stringify(error));
            });

            // Calcul de la pénalité à appliquer au prestataire
            const totalAmount = parseFloat(order.price); // Montant total payé par le client
            const commission = order.commission ? parseFloat(order.commission) : 0;
            const additionalPenalty = totalAmount * 0.1; // Pénalité additionnelle de 10% du montant total
            const totalPenalty = commission + additionalPenalty;

            // Création d'une transaction de type "debit" pour pénaliser le prestataire
            const penaltyTransactionPayload = {
              userProId: order.userProId,
              type: "debit",
              amount: totalPenalty,
              description: "Pénalité pour no-show-pro : commission + 10% additionnels",
              status: "completed",
              idBooking: order._id,
            };

            this.transactionService.create(penaltyTransactionPayload).subscribe({
              next: (penaltyResponse: any) => {
                console.log("Transaction de pénalité créée pour le prestataire :", penaltyResponse);

                // Création d'une transaction complémentaire pour créditer la plateforme
                const platformTransactionPayload = {
                  userProId: 'platform', // Identifiant spécifique pour la plateforme
                  type: "credit",
                  amount: totalPenalty,
                  description: "Crédit de pénalité suite à no-show-pro (commission + 10% additionnels)",
                  status: "completed",
                  idBooking: order._id,
                };

                this.transactionService.create(platformTransactionPayload).subscribe({
                  next: (platformTxResponse: any) => {
                    console.log("Transaction de crédit créée pour la plateforme :", platformTxResponse);
                  },
                  error: (platformTxError: any) => {
                    console.error("Erreur lors de la création de la transaction pour la plateforme :", platformTxError);
                  }
                });
              },
              error: (penaltyError: any) => {
                console.error("Erreur lors de la création de la transaction de pénalité pour le prestataire :", penaltyError);
              }
            });
          },
          error: (refundError: any) => {
            console.error("Erreur lors du remboursement complet :", refundError);
          }
        });

        // Optionnel : basculer l'affichage ou rediriger l'utilisateur
        // this.switchUserOrPro();
      }, error => {
        console.error("Erreur lors de la mise à jour du booking :", JSON.stringify(error));
        console.log("no-show-pro FAILED");
      });
  }
  formatPrice(price: any): string {
    const numericPrice = parseFloat(price);

    if (isNaN(numericPrice)) {
      return '0.00 €';
    }

    return numericPrice.toFixed(2);
  }


  cancelBooking(order: any) {
    console.log('Annulation de la commande :', order);
    // Tu peux ici émettre un EventEmitter si besoin
    console.log("Booking to delete:", JSON.stringify(order));

    // Mise à jour du statut du booking
    this.bookingService.updateBookingStatus(order._id, 'deleted').subscribe({
      next: (response: any) => {
        console.log("Booking update response:", JSON.stringify(response));
        console.log("DELETE OK");

        // Calcul de la différence en heures entre maintenant et le début du booking
        const bookingStart = moment(order.start);
        const now = moment();
        const diffHours = bookingStart.diff(now, 'hours');
        console.log(`Différence en heures entre maintenant et le début du booking : ${diffHours}`);

        if (diffHours >= 24) {
          console.log("Suppression > 24h avant la prestation : remboursement complet du client.");
          // Appel du FinancialService pour un remboursement complet
          this.financialService.processRefund(order._id, "customer-cancel-greater-than-24").subscribe({
            next: (refundResponse: any) => {
              console.log("Remboursement complet effectué via FinancialService:", refundResponse);
              // this.switchUserOrPro();
              // TODO F6 : Update invoice
              this.onUpdateNeeded.emit(order);
            },
            error: (refundError: any) => {
              console.error("Erreur lors du remboursement complet:", refundError);
            }
          });
        } else {
          console.log("Suppression < 24h avant la prestation : remboursement partiel (50%).");
          if (window.confirm("Attention, si vous continuez, vous ne serez remboursé qu'à 50% du montant payé. Voulez-vous confirmer ?")) {
            // Appel du FinancialService pour un remboursement partiel
            this.financialService.processRefund(order._id, "customer-cancel-less-than-24").subscribe({
              next: (refundResponse: any) => {
                console.log("Remboursement partiel effectué via FinancialService:", refundResponse);
                // this.switchUserOrPro();
                // TODO F6 : Update invoice
                this.onUpdateNeeded.emit(order);
              },
              error: (refundError: any) => {
                console.error("Erreur lors du remboursement partiel:", refundError);
              }
            });
          } else {
            console.log("Annulation de l'opération par le client.");
          }
        }
      },
      error: (error: any) => {
        console.error("Erreur lors de la mise à jour du booking :", JSON.stringify(error));
        console.log("DELETE FAILED");
      }
    });
  }

  contactSupport(order: any) {
    console.log('Contacter le support pour :', order);
    // Rediriger ou ouvrir un système de ticket / chat
  }

  reviewBooking(order: any) {
    this.modalReview.emit(order);
    // this.selectedBooking = order;
    // this.showReviewModal = true;
  }

  closeReviewModal() {
    this.modalReview.emit();
    // this.showReviewModal = false;
    // this.selectedBooking = null;
  }
}