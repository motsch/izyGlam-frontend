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

// ✅ AjoutsizyGlam : toasts
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
})
export class CalendarComponent implements OnInit {
  @Input() selectionUser: boolean | undefined;

  // -----------------------------
  // 📦 Données
  // -----------------------------
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
  selectedBooking: any = null;

  // Langue stockée (2 lettres)
  storedLangue = (localStorage.getItem('langue') || '')
    .replace(/^"(.*)"$/, '$1')
    .trim()
    .slice(0, 2)
    .toLowerCase();

  constructor(
    private bookingService: BookingService,
    private userService: UserService,
    private translate: TranslateService,
    private router: Router,
    private invoiceService: InvoiceService,
    private stripeService: StripeService,
    private transactionService: TransactionService,
    private financialService: FinancialService,

    // ✅izyGlam
    private toastr: ToastrService
  ) {
    // Définir la langue par défaut
    this.translate.setDefaultLang('en');
  }

  // ------------------------------------------------------
  // ⏱️ Cycle de vie
  // ------------------------------------------------------
  ngOnInit(): void {
    this.initOrders();
  }

  // ------------------------------------------------------
  // 🧭 Modale de notation
  // ------------------------------------------------------
  openModal(order: any) {
    if (order) {
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

  // ------------------------------------------------------
  // 🔄 Initialisation des commandes
  // ------------------------------------------------------
  initOrders() {
    this.cancelledOrders = [];
    this.upcomingOrders = [];
    this.pastOrders = [];

    this.userService.getMe().subscribe(
      (data: any) => {
        console.log('Utilisateur courant :', data);
        this.me = data;
        this.getAllBooking(data);
      },
      (error: any) => {
        console.error('Erreur lors du chargement utilisateur :', error);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    );
  }

  // ------------------------------------------------------
  // 📥 Récupération de toutes les réservations du client
  // ------------------------------------------------------
  getAllBooking(data: any) {
    this.bookingService.getBookingByClient(data._id).subscribe({
      next: async (bookings: any[]) => {
        console.log('bookings:', JSON.stringify(bookings));
        this.processOrders(bookings);
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des bookings client :', error);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      },
    });
  }

  // ------------------------------------------------------
  // ✅ Accepter une réservation (côté pro)
  // ------------------------------------------------------
  acceptBooking(order: any) {
    console.log('Accept booking:', JSON.stringify(order));
    this.bookingService
      .updateBookingStatus(order._id, 'accepted', this.storedLangue)
      .subscribe(
        (response) => {
          console.log('Booking accepted response:', JSON.stringify(response));
          this.toastr.success(
            this.translate.instant('SUCCESS.BOOKING_ACCEPTED') ||
              'Réservation acceptée.'
          );
          this.switchUserOrPro();
        },
        (error) => {
          console.error('Erreur acceptBooking :', JSON.stringify(error));
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        }
      );
  }

  // ------------------------------------------------------
  // 🧭 Ouvrir Waze / fallback Google Maps
  // ------------------------------------------------------
  navigateToAddress(order: any) {
    try {
      console.log('Navigate to address:', order.address);
      const encodedAddress = encodeURIComponent(order.address || '');

      const wazeUrl = `waze://?q=${encodedAddress}`;
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;

      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = wazeUrl;
      document.body.appendChild(iframe);

      setTimeout(() => {
        document.body.removeChild(iframe);
        window.location.href = googleMapsUrl;
      }, 1500);
    } catch (err) {
      console.error('Erreur navigateToAddress :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // ------------------------------------------------------
  // ❌ Annuler (refuser) une réservation en attente (côté pro)
  // ------------------------------------------------------
  cancelPendingBooking(order: any) {
    console.log('Refused booking:', JSON.stringify(order));

    this.bookingService
      .updateBookingStatus(order._id, 'refused', this.storedLangue)
      .subscribe({
        next: (response: any) => {
          console.log('Booking update response:', JSON.stringify(response));
          console.log('REFUSED OK');

          // Remboursement complet (annulation côté prestataire)
          this.financialService
            .processRefund(order._id, 'provider-cancel')
            .subscribe({
              next: (refundResponse: any) => {
                console.log(
                  'Remboursement (provider-cancel) via FinancialService :',
                  refundResponse
                );
                this.toastr.success(
                  this.translate.instant('SUCCESS.BOOKING_REFUSED') ||
                    'Réservation refusée.'
                );
                this.switchUserOrPro();
              },
              error: (refundError: any) => {
                console.error(
                  'Erreur remboursement FinancialService :',
                  refundError
                );
                this.showCustomToast(
                  this.translate.instant('ERROR.GENERIC_ERROR')
                );
              },
            });
        },
        error: (error: any) => {
          console.error(
            'Erreur lors de la mise à jour du booking (refused) :',
            JSON.stringify(error)
          );
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        },
      });
  }

  // ------------------------------------------------------
  // 🧮 Tri des commandes (à venir / passées / annulées)
  // ------------------------------------------------------
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
    const cancelStatuses = [
      'deleted',
      'refused',
      'no-show-client',
      'no-show-pro',
    ];

    // Commandes annulées
    this.cancelledOrders = bookings.filter((order) => {
      if (new Date(order.start).toLocaleDateString() === today) {
        return cancelStatuses.includes(order.status);
      }
      return cancelStatuses.includes(order.status);
    });

    // Commandes à venir
    this.upcomingOrders = bookings.filter((order) => {
      if (new Date(order.start).toLocaleDateString() === today) {
        return upcomingStatuses.includes(order.status);
      }
      return new Date(order.end) > new Date() && upcomingStatuses.includes(order.status);
    });

    // Commandes passées
    this.pastOrders = bookings.filter((order) => {
      if (new Date(order.start).toLocaleDateString() === today) {
        return pastStatuses.includes(order.status);
      }
      return new Date(order.end) <= new Date() && pastStatuses.includes(order.status);
    });

    console.log('Image Loaded INIT:', JSON.stringify(this.imageLoaded));
  }

  // ------------------------------------------------------
  // 🔁 Rafraîchir la vue
  // ------------------------------------------------------
  switchUserOrPro() {
    this.upcomingOrders = [];
    this.pastOrders = [];
    this.getAllBooking(this.me);
  }

  // ------------------------------------------------------
  // 🧾 Factures (prévisualiser)
  // ------------------------------------------------------
  previewInvoice(order: any) {
    if (!order) {
      console.error('❌ Erreur: Aucune commande fournie.');
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      return;
    }

    try {
      console.log('👀 Prévisualisation de la facture pour :', order);
      this.invoiceService.previewInvoice(order);
    } catch (err) {
      console.error('Erreur previewInvoice :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // ------------------------------------------------------
  // 🧾 Factures (télécharger)
  // ------------------------------------------------------
  downloadInvoice(order: any) {
    if (!order) {
      console.error('❌ Erreur: Aucune commande fournie.');
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      return;
    }

    console.log('📄 Téléchargement de la facture pour :', order);
    try {
      this.invoiceService.downloadInvoice(order);
      this.toastr.success(
        this.translate.instant('SUCCESS.INVOICE_DOWNLOADED') ||
          'Facture téléchargée.'
      );
    } catch (error) {
      console.error('❌ Erreur downloadInvoice :', error);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // ------------------------------------------------------
  // 🔐 Confirmation de code (prestataire)
  // ------------------------------------------------------
  confirmCode(booking: any, inputCode: string) {
    if (!booking || !booking._id) {
      console.error('Booking non valide');
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      return;
    }
    this.bookingService.confirmBookingCode(booking._id, inputCode).subscribe(
      (response) => {
        if (response.confirmed) {
          booking.proCodeConfirmed = true;
          console.log('Code confirmé pour booking', booking._id);
          this.toastr.success(
            this.translate.instant('SUCCESS.CODE_CONFIRMED') ||
              'Code confirmé.'
          );
        } else {
          console.log('Code invalide pour booking', booking._id);
          this.showCustomToast(
            this.translate.instant('ERROR.INVALID_CODE') || 'Code invalide.'
          );
        }
      },
      (error) => {
        console.error('Erreur lors de la confirmation du code :', error);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    );
  }

  // ------------------------------------------------------
  // ✅ Finir une réservation
  // ------------------------------------------------------
  finishOrder(order: any) {
    console.log('Booking to finish :', JSON.stringify(order));
    this.bookingService
      .updateBookingStatus(order._id, 'finished', this.storedLangue)
      .subscribe(
        (response) => {
          console.log('Booking finished response :', JSON.stringify(response));
          this.toastr.success(
            this.translate.instant('SUCCESS.BOOKING_FINISHED') ||
              'Réservation terminée.'
          );
          this.switchUserOrPro();
        },
        (error) => {
          console.error('Erreur finishOrder :', JSON.stringify(error));
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        }
      );
  }

  // ------------------------------------------------------
  // 🚫 Client absent
  // ------------------------------------------------------
  markClientAbsent(order: any) {
    console.log('Client absent pour la commande', order);
    this.bookingService
      .updateBookingStatus(order._id, 'no-show-client', this.storedLangue)
      .subscribe(
        (response) => {
          console.log(
            'Booking no-show-client response :',
            JSON.stringify(response)
          );

          // Mise à jour des transactions liées
          this.transactionService.getAll().subscribe(
            (transactions: any[]) => {
              const matchingTransactions = transactions.filter(
                (tx) => tx.idBooking === order._id
              );
              console.log(
                'Transactions trouvées pour ce booking :',
                matchingTransactions
              );
              if (matchingTransactions.length > 0) {
                matchingTransactions.forEach((tx: any) => {
                  tx.status = 'completed';
                  this.transactionService.update(tx).subscribe(
                    (updatedTx) => {
                      console.log(
                        'Transaction mise à jour (no-show-client) :',
                        JSON.stringify(updatedTx)
                      );
                    },
                    (error) => {
                      console.error(
                        'Erreur MAJ transaction (no-show-client) :',
                        JSON.stringify(error)
                      );
                      this.showCustomToast(
                        this.translate.instant('ERROR.GENERIC_ERROR')
                      );
                    }
                  );
                });
              } else {
                console.warn('Aucune transaction trouvée pour ce booking.');
              }
            },
            (error) => {
              console.error(
                'Erreur lors de la récupération des transactions :',
                JSON.stringify(error)
              );
              this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
            }
          );

          this.toastr.success(
            this.translate.instant('SUCCESS.MARKED_NO_SHOW_CLIENT') ||
              'Client marqué absent.'
          );
          this.switchUserOrPro();
        },
        (error) => {
          console.error(
            'Erreur MAJ booking (no-show-client) :',
            JSON.stringify(error)
          );
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        }
      );
  }

  // ------------------------------------------------------
  // 🗑️ Supprimer (annuler côté client)
  // ------------------------------------------------------
  deleteBooking(order: any) {
    console.log('Booking to delete:', JSON.stringify(order));

    this.bookingService
      .updateBookingStatus(order._id, 'deleted', this.storedLangue)
      .subscribe({
        next: (response: any) => {
          console.log('Booking update response:', JSON.stringify(response));
          console.log('DELETE OK');

          // Différence en heures (moment.js)
          const bookingStart = moment(order.start);
          const now = moment();
          const diffHours = bookingStart.diff(now, 'hours');
          console.log(
            `Différence en heures entre maintenant et le début du booking : ${diffHours}`
          );

          if (diffHours >= 24) {
            // Remboursement complet
            this.financialService
              .processRefund(order._id, 'customer-cancel-greater-than-24')
              .subscribe({
                next: (refundResponse: any) => {
                  console.log(
                    'Remboursement complet via FinancialService:',
                    refundResponse
                  );
                  this.toastr.success(
                    this.translate.instant('SUCCESS.BOOKING_DELETED') ||
                      'Réservation supprimée.'
                  );
                  this.switchUserOrPro();
                },
                error: (refundError: any) => {
                  console.error('Erreur remboursement complet:', refundError);
                  this.showCustomToast(
                    this.translate.instant('ERROR.GENERIC_ERROR')
                  );
                },
              });
          } else {
            // Confirmation remboursement partiel
            if (
              window.confirm(
                "Attention, si vous continuez, vous ne serez remboursé qu'à 50% du montant payé. Voulez-vous confirmer ?"
              )
            ) {
              this.financialService
                .processRefund(order._id, 'customer-cancel-less-than-24')
                .subscribe({
                  next: (refundResponse: any) => {
                    console.log(
                      'Remboursement partiel via FinancialService:',
                      refundResponse
                    );
                    this.toastr.success(
                      this.translate.instant('SUCCESS.BOOKING_DELETED') ||
                        'Réservation supprimée.'
                    );
                    this.switchUserOrPro();
                  },
                  error: (refundError: any) => {
                    console.error(
                      'Erreur remboursement partiel:',
                      refundError
                    );
                    this.showCustomToast(
                      this.translate.instant('ERROR.GENERIC_ERROR')
                    );
                  },
                });
            } else {
              console.log("Annulation de l'opération par le client.");
            }
          }
        },
        error: (error: any) => {
          console.error(
            'Erreur lors de la mise à jour du booking (deleted) :',
            JSON.stringify(error)
          );
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        },
      });
  }

  // ------------------------------------------------------
  // 🔄 Pull-to-refresh (UI)
  // ------------------------------------------------------
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
  // 🔐 Fenêtre d’affichage du code
  // -------------------------------
  isWithinDisplayTime(booking: any): boolean {
    const now = new Date();
    const startTime = new Date(booking.start);
    const startWindow = new Date(startTime.getTime() - 2 * 60 * 60 * 1000);
    const endWindow = new Date(startTime.getTime() + 15 * 60 * 1000);
    return now >= startWindow && now <= endWindow;
  }

  isAfterGracePeriod(booking: any): boolean {
    const now = new Date();
    const startTime = new Date(booking.start);
    return now.getTime() > startTime.getTime() + 15 * 60 * 1000;
  }

  // ------------------------------------------------------
  // 🚫 Prestataire absent (no-show-pro)
  // ------------------------------------------------------
  markPrestataireAbsent(order: any) {
    console.log('Prestataire absent pour la commande', order);

    this.bookingService
      .updateBookingStatus(order._id, 'no-show-pro', this.storedLangue)
      .subscribe(
        (response) => {
          console.log(
            'Booking no-show-pro response :',
            JSON.stringify(response)
          );

          // Remboursement Stripe
          this.stripeService.refundPayment(order.paymentIntentId).subscribe({
            next: (refundResponse: any) => {
              console.log(
                'Remboursement complet réussi via Stripe :',
                refundResponse
              );

              // MAJ des transactions → statut refunded
              this.transactionService.getAll().subscribe(
                (transactions: any[]) => {
                  const matchingTransactions = transactions.filter(
                    (tx) => tx.idBooking === order._id
                  );
                  console.log(
                    'Transactions trouvées pour ce booking :',
                    matchingTransactions
                  );
                  if (matchingTransactions.length > 0) {
                    matchingTransactions.forEach((tx: any) => {
                      tx.status = 'refunded';
                      this.transactionService.update(tx).subscribe(
                        (updatedTx) => {
                          console.log(
                            'Transaction MAJ pour remboursement :',
                            JSON.stringify(updatedTx)
                          );
                        },
                        (error) => {
                          console.error(
                            'Erreur MAJ transaction (refund) :',
                            JSON.stringify(error)
                          );
                          this.showCustomToast(
                            this.translate.instant('ERROR.GENERIC_ERROR')
                          );
                        }
                      );
                    });
                  } else {
                    console.warn('Aucune transaction trouvée pour ce booking.');
                  }
                },
                (error) => {
                  console.error(
                    'Erreur récupération des transactions :',
                    JSON.stringify(error)
                  );
                  this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
                }
              );

              // Pénalité additionnelle (commission + 10%)
              const totalAmount = parseFloat(order.price);
              const commission = order.commission ? parseFloat(order.commission) : 0;
              const additionalPenalty = totalAmount * 0.1;
              const totalPenalty = commission + additionalPenalty;

              const penaltyTransactionPayload = {
                userProId: order.userProId,
                type: 'debit',
                amount: totalPenalty,
                description:
                  'Pénalité pour no-show-pro : commission + 10% additionnels',
                status: 'completed',
                idBooking: order._id,
              };

              this.transactionService.create(penaltyTransactionPayload).subscribe({
                next: (penaltyResponse: any) => {
                  console.log(
                    'Transaction de pénalité créée pour le prestataire :',
                    penaltyResponse
                  );

                  // Crédit plateforme
                  const platformTransactionPayload = {
                    userProId: 'platform',
                    type: 'credit',
                    amount: totalPenalty,
                    description:
                      'Crédit de pénalité suite à no-show-pro (commission + 10% additionnels)',
                    status: 'completed',
                    idBooking: order._id,
                  };

                  this.transactionService.create(platformTransactionPayload).subscribe({
                    next: (platformTxResponse: any) => {
                      console.log(
                        'Transaction de crédit pour la plateforme :',
                        platformTxResponse
                      );
                      this.toastr.success(
                        this.translate.instant('SUCCESS.MARKED_NO_SHOW_PRO') ||
                          'Prestataire marqué absent.'
                      );
                    },
                    error: (platformTxError: any) => {
                      console.error(
                        'Erreur création transaction plateforme :',
                        platformTxError
                      );
                      this.showCustomToast(
                        this.translate.instant('ERROR.GENERIC_ERROR')
                      );
                    },
                  });
                },
                error: (penaltyError: any) => {
                  console.error(
                    'Erreur création transaction pénalité :',
                    penaltyError
                  );
                  this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
                },
              });
            },
            error: (refundError: any) => {
              console.error('Erreur remboursement Stripe :', refundError);
              this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
            },
          });

          // Rafraîchir la vue
          this.switchUserOrPro();
        },
        (error) => {
          console.error(
            'Erreur MAJ booking (no-show-pro) :',
            JSON.stringify(error)
          );
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        }
      );
  }

  // ------------------------------------------------------
  // 🔢 Générer un code à 6 chiffres
  // ------------------------------------------------------
  generateCode(booking: any) {
    booking.generatedCode = Math.floor(100000 + Math.random() * 900000);
    console.log(
      `Code généré pour le booking ${booking._id}: ${booking.generatedCode}`
    );

    this.bookingService.update(booking).subscribe(
      (response) => {
        console.log('Code généré sauvegardé :', JSON.stringify(response));
        this.toastr.success(
          this.translate.instant('SUCCESS.CODE_GENERATED') ||
            'Code généré.'
        );
        this.switchUserOrPro();
      },
      (error) => {
        console.error('Erreur lors de la sauvegarde du code :', error);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    );
  }

  // ------------------------------------------------------
  // 🏷️ Libellés de statut pour l’UI
  // ------------------------------------------------------
  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending':
        return '⏳ En attente';
      case 'accepted':
        return '✅ Confirmée';
      case 'refused':
        return '❌ Refusée';
      case 'cancelled':
        return '❌ Annulée';
      case 'finished':
        return '✅ Terminée';
      case 'no-show-client':
        return '🚫 Client absent';
      case 'no-show-pro':
        return '🚫 Pro absent';
      default:
        return status;
    }
  }

  // ------------------------------------------------------
  // ⚙️ Actions disponibles selon statut
  // ------------------------------------------------------
  getAvailableActions(order: any): string[] {
    const status = order?.status;

    const actionsPerStatus: { [key: string]: string[] } = {
      pending: ['invoice', 'cancel'],
      accepted: ['cancel', 'invoice'],
      refused: ['delete', 'invoice'],
      cancelled: ['delete', 'invoice'],
      finished: ['invoice', 'review', 'delete'],
      'no-show-client': ['invoice', 'delete', 'support'],
      'no-show-pro': ['invoice', 'delete', 'support'],
    };

    return actionsPerStatus[status] || [];
  }

  canShow(order: any, action: string): boolean {
    return this.getAvailableActions(order).includes(action);
  }

  // ------------------------------------------------------
  // 🔁 Demande de refresh externe
  // ------------------------------------------------------
  onUpdateAsked() {
    this.initOrders();
  }

  // ------------------------------------------------------
  // ✨ Toast d’erreur styliséizyGlam (centralisé)
  // ------------------------------------------------------
  private showCustomToast(message: string) {
    // Standard : erreurs → toastr.error
    this.toastr.error(message);
  }
}
