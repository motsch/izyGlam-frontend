import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import moment from 'moment';
import { StripeService } from 'src/app/core/services/stripe.service';
import { BookingService } from 'src/app/core/services/booking.service';
import { environment } from 'src/environments/environment';
import { TranslateService } from '@ngx-translate/core';
import { FinancialService } from '../../services/financial.service';
import { TransactionService } from '../../services/transaction.service';
import { UserService } from '../../services/user.service';
import { InvoiceService } from '../../services/invoice.service';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
})
export class CalendarComponent implements OnInit {
  @Input() selectionUser: boolean | undefined;
  me: any = {};
  upcomingOrders: any[] = [];
  pastOrders: any[] = [];
  cancelledOrders: any[] = [];
  orders: any[] = [];
  selectedOrderType: 'upcoming' | 'past' | 'cancelled' = 'upcoming';
  imgStorageUrl: string = environment.APIimgStorageUrl.replace(/\/$/, '');
  imageLoaded: { [key: string]: boolean } = {}; // Suivi du chargement des images
  availableActions: string[] = [];
  showReviewModal = false;
  selectedBooking = null;
  storedLangue = (localStorage.getItem('langue') || '').replace(/^"(.*)"$/, '$1').trim().slice(0, 2).toLowerCase();

  constructor(
    private bookingService: BookingService,
    private userService: UserService,
    private translate: TranslateService,
    private router: Router,
    private invoiceService: InvoiceService,
    private stripeService: StripeService,
    private transactionService: TransactionService,
    private financialService: FinancialService
  ) {
    // Définir la langue par défaut
    this.translate.setDefaultLang('en');
  }

  ngOnInit(): void {
    this.initOrders();
  }

  openModal(order:any) {
    if(order) {
      this.selectedBooking = order;
      this.showReviewModal = true;
    } else {
      this.closeReviewModal();
    }
  }

  closeReviewModal() {
    this.showReviewModal = false;
    this.selectedBooking = null;
  }
  initOrders() {
    this.cancelledOrders = [];
    this.upcomingOrders = [];
    this.pastOrders = [];
    this.userService.getMe().subscribe((data: any) => {
      console.log(data);
      this.me = data;
      this.getAllBooking(data);
    },
      (error: any) => {
        console.log(error)
      })
  }

  getAllBooking(data: any) {
    this.bookingService.getBookingByClient(data._id).subscribe({
      next: async (bookings: any[]) => {
        console.log('bookings: ' + JSON.stringify(bookings));
        this.processOrders(bookings);
      },
      error: (error: any) => {
        console.log(error);
      },
    });
  }

  acceptBooking(order: any) {
    console.log("Accept booking: ", JSON.stringify(order));
    this.bookingService.updateBookingStatus(order._id, 'accepted', this.storedLangue)
      .subscribe(response => {
        console.log(JSON.stringify(response));
        console.log("ACCEPTED OK");
        this.switchUserOrPro();
      }, error => {
        console.log(JSON.stringify(error));
        console.log("ACCEPTED FAILED");
      });
  }

  navigateToAddress(order: any) {
    console.log("Navigate to address: ", order.address);
    const encodedAddress = encodeURIComponent(order.address);

    // URL pour lancer Waze avec une recherche de l'adresse
    const wazeUrl = `waze://?q=${encodedAddress}`;

    // URL de fallback : Google Maps (affiche la recherche de l'adresse)
    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

    // On tente d'ouvrir Waze.
    // Pour cela, on crée une iframe temporaire.
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = wazeUrl;
    document.body.appendChild(iframe);

    // Après un court délai, on redirige vers Google Maps si l'ouverture de Waze n'a pas abouti.
    setTimeout(() => {
      document.body.removeChild(iframe);
      window.location.href = googleMapsUrl;
    }, 1500); // délai en millisecondes (1,5 sec)
  }

  cancelPendingBooking(order: any) {
    console.log("Refused booking:", JSON.stringify(order));

    // Mise à jour du booking : on passe le statut à "refused" pour signaler que le prestataire a refusé la commande
    this.bookingService.updateBookingStatus(order._id, 'refused', this.storedLangue).subscribe({
      next: (response: any) => {
        console.log("Booking update response:", JSON.stringify(response));
        console.log("REFUSED OK");

        // Appel au FinancialService pour traiter le remboursement complet et la mise à jour de la transaction
        // refundType "provider-cancel" indique que c'est le prestataire qui refuse et que le client doit être remboursé intégralement.
        this.financialService.processRefund(order._id, "provider-cancel").subscribe({
          next: (refundResponse: any) => {
            console.log("Remboursement et mise à jour des transactions effectués via FinancialService :", refundResponse);
            this.switchUserOrPro();
          },
          error: (refundError: any) => {
            console.error("Erreur lors du remboursement via FinancialService :", refundError);
          }
        });
      },
      error: (error: any) => {
        console.error("Erreur lors de la mise à jour du booking :", JSON.stringify(error));
        console.log("REFUSED FAILED");
      }
    });
  }

  processOrders(bookings: any[]) {
    const today = new Date().toLocaleDateString();
    // Mise à jour des propriétés de date et initialisation du chargement des images
    bookings.forEach((order) => {
      order.orderDate = new Date(order.start).toLocaleDateString();
      order.orderTime = new Date(order.start).toLocaleTimeString();
      if (order._id) {
        this.imageLoaded[order._id] = false;
      }
    });
    const upcomingStatuses = ['pending', 'accepted'];
    const pastStatuses = ['finished'];
    const cancelStatuses = ['deleted', 'refused', 'no-show-client', 'no-show-pro'];
    // this. = bookings.filter(order => order.status === 'deleted' || order.status === 'refused' || order.status === 'no-show-pro' || order.status === 'no-show-client');



    // Filtrage des commandes annulées
    this.cancelledOrders = bookings.filter(order => {
      if (new Date(order.start).toLocaleDateString() === today) {
        return cancelStatuses.includes(order.status);
      }
      return cancelStatuses.includes(order.status);
    });
    // Filtrage des commandes à venir
    this.upcomingOrders = bookings.filter(order => {
      if (new Date(order.start).toLocaleDateString() === today) {
        return upcomingStatuses.includes(order.status);
      }
      return new Date(order.end) > new Date() && upcomingStatuses.includes(order.status);
    });
    // Filtrage des commandes passées
    this.pastOrders = bookings.filter(order => {
      if (new Date(order.start).toLocaleDateString() === today) {
        return pastStatuses.includes(order.status);
      }
      return new Date(order.end) <= new Date() && pastStatuses.includes(order.status);
    });
    console.log("Image Loaded INIT: ", JSON.stringify(this.imageLoaded));
  }

  switchUserOrPro() {
    this.upcomingOrders = [];
    this.pastOrders = [];
    this.getAllBooking(this.me);
  }

  previewInvoice(order: any) {
    if (!order) {
      console.error("❌ Erreur: Aucune commande fournie.");
      return;
    }

    console.log("👀 Prévisualisation de la facture pour :", order);
    this.invoiceService.previewInvoice(order);
  }

  downloadInvoice(order: any) {
    if (!order) {
      console.error("❌ Erreur: Aucune commande fournie.");
      return;
    }

    console.log("📄 Téléchargement de la facture pour :", order);
    try {
      this.invoiceService.downloadInvoice(order);
      console.log("✅ Facture téléchargée !");
    } catch (error) {
      console.error("❌ Erreur lors du téléchargement de la facture :", error);
    }
  }

  /**
   * Vérifie le code saisi en appelant le backend et met à jour le booking en conséquence.
   * @param booking Le booking concerné
   * @param inputCode Le code saisi par l'utilisateur
   */
  confirmCode(booking: any, inputCode: string) {
    // Vérifier que le booking possède un identifiant
    if (!booking || !booking._id) {
      console.error("Booking non valide");
      return;
    }
    this.bookingService.confirmBookingCode(booking._id, inputCode)
      .subscribe(response => {
        if (response.confirmed) {
          booking.proCodeConfirmed = true;
          console.log("Code confirmé pour booking", booking._id);
        } else {
          console.log("Code invalide pour booking", booking._id);
          // Optionnel : afficher une notification ou message d'erreur à l'utilisateur
        }
      }, error => {
        console.error("Erreur lors de la confirmation du code :", error);
        // Optionnel : notifier l'utilisateur de l'erreur
      });
  }

  finishOrder(order: any) {
    console.log("Booking to finishd : " + JSON.stringify(order));
    this.bookingService.updateBookingStatus(order._id, 'finished', this.storedLangue)
      .subscribe(response => {
        console.log("Booking finishd response :", JSON.stringify(response));
        console.log("FINISHED OK");
        // Actualiser l'affichage ou rediriger
        this.switchUserOrPro();
      }, error => {
        console.error("Erreur lors de la mise à jour du booking :", JSON.stringify(error));
        console.log("FINISHED FAILED");
      });
  }

  markClientAbsent(order: any) {
    console.log('Client absent pour la commande', order);
    console.log("Booking to no-show-client : " + JSON.stringify(order));
    // Mettre à jour le booking pour le marquer comme no-show-client
    this.bookingService.updateBookingStatus(order._id, 'no-show-client', this.storedLangue)
      .subscribe(response => {
        console.log("Booking no-show-client response :", JSON.stringify(response));
        // Mise à jour de la transaction initiale associée au booking pour indiquer que le paiement est définitivement validé
        this.transactionService.getAll().subscribe((transactions: any[]) => {
          const matchingTransactions = transactions.filter(tx => tx.idBooking === order._id);
          console.log("Transactions trouvées pour ce booking :", matchingTransactions);
          if (matchingTransactions.length > 0) {
            matchingTransactions.forEach((tx: any) => {
              // On considère la transaction comme finalisée puisque la prestation est validée malgré l'absence du client
              tx.status = "completed";
              this.transactionService.update(tx).subscribe(
                updatedTx => {
                  console.log("Transaction mise à jour pour no-show-client :", JSON.stringify(updatedTx));
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

        console.log("no-show-client OK");
        // Actualiser l'affichage ou rediriger selon votre logique
        this.switchUserOrPro();
      }, error => {
        console.error("Erreur lors de la mise à jour du booking :", JSON.stringify(error));
        console.log("no-show-client FAILED");
      });
  }
  deleteBooking(order: any) {
    console.log("Booking to delete:", JSON.stringify(order));
    // Mise à jour du statut du booking
    this.bookingService.updateBookingStatus(order._id, 'deleted', this.storedLangue).subscribe({
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
              this.switchUserOrPro();
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
                this.switchUserOrPro();
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

  // Méthode de rechargement des données
  refreshPage(event: any) {
    this.upcomingOrders = [];
    this.pastOrders = [];
    console.log('🔄 Rafraîchissement des données...');
    this.getAllBooking(this.me);
    setTimeout(() => {
      event.target.complete();
      console.log('✅ Rafraîchissement terminé.');
    }, 1000);
  }

  // -------------------------------
  // Nouvelles méthodes pour le code confidentiel
  // -------------------------------

  /**
   * Vérifie si l'heure actuelle est entre 2h avant et 15 minutes après le début de la prestation.
   */
  isWithinDisplayTime(booking: any): boolean {
    const now = new Date();
    const startTime = new Date(booking.start);
    // Calcul du début de la fenêtre (2h avant le début)
    const startWindow = new Date(startTime.getTime() - 2 * 60 * 60 * 1000);
    // Calcul de la fin de la fenêtre (15 minutes après le début)
    const endWindow = new Date(startTime.getTime() + 15 * 60 * 1000);
    return now >= startWindow && now <= endWindow;
  }

  /**
 * Vérifie si l'heure actuelle est supérieure à 15 minutes après le début de la prestation.
 */
  isAfterGracePeriod(booking: any): boolean {
    const now = new Date();
    const startTime = new Date(booking.start);
    return now.getTime() > startTime.getTime() + 15 * 60 * 1000;
  }
  markPrestataireAbsent(order: any) {
    console.log('Prestataire absent pour la commande', order);
    console.log("Booking to no-show-pro : " + JSON.stringify(order));

    // Mise à jour du statut du booking en "no-show-pro"
    this.bookingService.updateBookingStatus(order._id, 'no-show-pro', this.storedLangue)
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
        this.switchUserOrPro();
      }, error => {
        console.error("Erreur lors de la mise à jour du booking :", JSON.stringify(error));
        console.log("no-show-pro FAILED");
      });
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
        this.switchUserOrPro();
      }, error => {
        console.log(JSON.stringify(error));
        console.log("ACCEPTED FAILED");
      });
  }


  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return '⏳ En attente';
      case 'accepted': return '✅ Confirmée';
      case 'refused': return '❌ Refusée';
      case 'cancelled': return '❌ Annulée';
      case 'finished': return '✅ Terminée';
      case 'no-show-client': return '🚫 Client absent';
      case 'no-show-pro': return '🚫 Pro absent';
      default: return status;
    }
  }

  getAvailableActions(order: any): string[] {
    const paid = order?.paid;
    const status = order?.status;

    const actionsPerStatus: { [key: string]: string[] } = {
      pending: ['invoice', 'cancel'],
      accepted: ['cancel', 'invoice'],
      refused: ['delete', 'invoice'],
      cancelled: ['delete', 'invoice'],
      finished: ['invoice', 'review', 'delete'],
      'no-show-client': ['invoice', 'delete', 'support'],
      'no-show-pro': ['invoice', 'delete', 'support']
    };

    return actionsPerStatus[status] || [];
  }

  canShow(order: any, action: string): boolean {
    return this.getAvailableActions(order).includes(action);
  }

  onUpdateAsked() {
    this.initOrders();
  }

}
