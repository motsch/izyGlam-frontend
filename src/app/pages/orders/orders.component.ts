import { ChangeDetectorRef, Component, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { BookingService } from 'src/app/core/services/booking.service';
import { FinancialService } from 'src/app/core/services/financial.service';
import { StripeService } from 'src/app/core/services/stripe.service';
import { TransactionService } from 'src/app/core/services/transaction.service';
import { UserService } from 'src/app/core/services/user.service';
import { environment } from 'src/environments/environment';
import moment from 'moment';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html',
  styleUrls: ['./orders.component.scss'],
})
export class OrdersComponent implements OnInit {

  // -------------------------------
  // 🔹 Déclaration des propriétés
  // -------------------------------

  @Output() selectionUser = true; // Définit si on est en mode "client" ou "pro"
  me: any = {}; // Données de l’utilisateur connecté
  upcomingOrders: any[] = []; // Commandes à venir
  pastOrders: any[] = []; // Commandes passées
  cancelledOrders: any[] = []; // Commandes annulées
  orders: any[] = []; // Toutes les commandes
  selectedOrderType: 'upcoming' | 'past' | 'cancelled' = 'upcoming'; // Type d’ordre sélectionné (pour l’affichage)
  imgStorageUrl: string = environment.APIimgStorageUrl.replace(/\/$/, ''); // URL de base pour les images (suppression du slash final)
  storedLangue = (localStorage.getItem('langue') || '').replace(/^"(.*)"$/, '$1').trim().slice(0, 2).toLowerCase(); // Langue stockée localement
  imageLoaded: { [key: string]: boolean } = {}; // Suivi du chargement des images

  // -------------------------------
  // 🔹 Injection des services nécessaires
  // -------------------------------
  constructor(
    private bookingService: BookingService,
    private userService: UserService,
    private translate: TranslateService,
    private router: Router,
    private stripeService: StripeService,
    private transactionService: TransactionService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private financialService: FinancialService
  ) {
    // Langue par défaut (fallback)
    this.translate.setDefaultLang('en');
  }

  // -------------------------------
  // 🔹 Méthode principale d’initialisation du composant
  // -------------------------------
  ngOnInit(): void {
    localStorage.setItem('tabs', 'orders'); // Sauvegarde le contexte d’onglet

    // Détection automatique de la langue du navigateur
    const browserLang = navigator.language.split('-')[0];
    console.log('Langue du navigateur détectée :', browserLang);

    // Détermination de la langue à utiliser (stockée ou détectée)
    let storedLangue = (localStorage.getItem('langue') || browserLang || 'en').replace(/"/g, '');

    // Application de la langue
    this.translate.use(storedLangue).subscribe({
      next: () => {
        console.log('Langue appliquée :', storedLangue);
      },
      error: (err) => {
        console.error('Erreur lors de l’application de la langue :', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });

    // Récupération de l’utilisateur connecté
    this.userService.getMe().subscribe({
      next: (data: any) => {
        console.log('Utilisateur chargé :', data);
        this.me = data;
        this.getAllBooking(this.me); // Chargement des bookings associés à cet utilisateur
      },
      error: (err) => {
        console.error('Erreur lors du chargement des informations utilisateur :', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });
  }

  // -------------------------------
  // 🔹 Récupère toutes les commandes selon le rôle (client ou pro)
  // -------------------------------
  getAllBooking(data: any) {
    if (this.selectionUser) {
      // Mode "client"
      this.bookingService.getBookingByClient(data._id).subscribe({
        next: async (bookings: any[]) => {
          console.log('Bookings client récupérés :', bookings);
          this.processOrders(bookings);
        },
        error: (err) => {
          console.error('Erreur lors du chargement des bookings client :', err);
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        }
      });
    } else {
      // Mode "professionnel"
      this.bookingService.getBookingByUserPro(data._id).subscribe({
        next: (bookingsForPro: any[]) => {
          console.log('Bookings pro récupérés :', bookingsForPro);
          this.processOrders(bookingsForPro);
        },
        error: (err) => {
          console.error('Erreur lors du chargement des bookings pro :', err);
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        }
      });
    }
  }

  // -------------------------------
  // 🔹 Accepter une commande
  // -------------------------------
  acceptBooking(order: any) {
    console.log("Accept booking:", order);

    this.bookingService.updateBookingStatus(order._id, 'accepted', this.storedLangue).subscribe({
      next: (response) => {
        console.log('Booking accepté :', response);
        this.switchUserOrPro(); // Rechargement
      },
      error: (err) => {
        console.error('Erreur lors de l’acceptation du booking :', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });
  }

  // -------------------------------
  // 🔹 Ouvre l’adresse dans Waze (ou Google Maps en fallback)
  // -------------------------------
  navigateToAddress(order: any) {
    try {
      console.log('Navigation vers adresse :', order.address);
      const encodedAddress = encodeURIComponent(order.address);
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
      console.error('Erreur lors de la navigation :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // -------------------------------
  // 🔹 Refuser une commande (prestataire)
  // -------------------------------
  cancelPendingBooking(order: any) {
    console.log('Refused booking:', order);

    this.bookingService.updateBookingStatus(order._id, 'refused', this.storedLangue).subscribe({
      next: () => {
        // Si succès : remboursement complet du client
        this.financialService.processRefund(order._id, 'provider-cancel').subscribe({
          next: () => {
            console.log('Remboursement effectué.');
            this.switchUserOrPro();
          },
          error: (err) => {
            console.error('Erreur remboursement FinancialService :', err);
            this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
          }
        });
      },
      error: (err) => {
        console.error('Erreur lors du refus du booking :', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });
  }

  // -------------------------------
  // 🔹 Classe les bookings (upcoming, past, cancelled)
  // -------------------------------
  processOrders(bookings: any[]) {
    const today = new Date().toLocaleDateString();

    // Formate les dates et prépare l’état du chargement des images
    bookings.forEach((order) => {
      order.orderDate = new Date(order.start).toLocaleDateString();
      order.orderTime = new Date(order.start).toLocaleTimeString();
      if (order._id) this.imageLoaded[order._id] = false;
    });

    const upcomingStatuses = ['pending', 'accepted'];
    const pastStatuses = ['finished', 'no-show-client', 'no-show-pro'];

    this.cancelledOrders = bookings.filter(order => order.status === 'deleted');
    this.upcomingOrders = bookings.filter(order =>
      (new Date(order.end) > new Date() && upcomingStatuses.includes(order.status))
    );
    this.pastOrders = bookings.filter(order =>
      (new Date(order.end) <= new Date() && pastStatuses.includes(order.status))
    );
  }

  // -------------------------------
  // 🔹 Quand une image de commande est chargée
  // -------------------------------
  onImageLoad(orderId: string) {
    this.imageLoaded[orderId] = true;
    this.cdr.detectChanges();
  }

  // -------------------------------
  // 🔹 Recharge les bookings après action
  // -------------------------------
  switchUserOrPro() {
    this.upcomingOrders = [];
    this.pastOrders = [];
    this.getAllBooking(this.me);
  }

  // -------------------------------
  // 🔹 Marquer une commande comme terminée
  // -------------------------------
  finishOrder(order: any) {
    this.bookingService.updateBookingStatus(order._id, 'finished', this.storedLangue).subscribe({
      next: (response) => {
        console.log('Booking terminé :', response);
        this.switchUserOrPro();
      },
      error: (err) => {
        console.error('Erreur lors de la finalisation du booking :', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });
  }

  // -------------------------------
  // 🔹 Supprimer une commande (client)
  // -------------------------------
  deleteBooking(order: any) {
    this.bookingService.updateBookingStatus(order._id, 'deleted', this.storedLangue).subscribe({
      next: () => {
        const diffHours = moment(order.start).diff(moment(), 'hours');

        if (diffHours >= 24) {
          // Remboursement complet
          this.financialService.processRefund(order._id, 'customer-cancel-greater-than-24').subscribe({
            next: () => this.switchUserOrPro(),
            error: (err) => {
              console.error('Erreur remboursement complet :', err);
              this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
            }
          });
        } else {
          // Remboursement partiel
          if (window.confirm(this.translate.instant('SUCCESS.PARTIAL_REFUND_CONFIRM'))) {
            this.financialService.processRefund(order._id, 'customer-cancel-less-than-24').subscribe({
              next: () => this.switchUserOrPro(),
              error: (err) => {
                console.error('Erreur remboursement partiel :', err);
                this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
              }
            });
          }
        }
      },
      error: (err) => {
        console.error('Erreur suppression booking :', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });
  }

  // -------------------------------
  // 🔹 Marquer un client absent
  // -------------------------------
  markClientAbsent(order: any) {
    this.bookingService.updateBookingStatus(order._id, 'no-show-client', this.storedLangue).subscribe({
      next: () => {
        this.transactionService.getAll().subscribe({
          next: (transactions: any[]) => {
            const matching = transactions.filter(tx => tx.idBooking === order._id);
            matching.forEach(tx => {
              tx.status = 'completed';
              this.transactionService.update(tx).subscribe({
                error: (err) => {
                  console.error('Erreur update transaction client absent :', err);
                  this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
                }
              });
            });
          },
          error: (err) => {
            console.error('Erreur récupération transactions client absent :', err);
            this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
          }
        });
        this.switchUserOrPro();
      },
      error: (err) => {
        console.error('Erreur no-show-client :', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });
  }

  // -------------------------------
  // 🔹 Marquer un prestataire absent
  // -------------------------------
  markPrestataireAbsent(order: any) {
    this.bookingService.updateBookingStatus(order._id, 'no-show-pro', this.storedLangue).subscribe({
      next: () => {
        // Remboursement client
        this.stripeService.refundPayment(order.paymentIntentId).subscribe({
          next: () => {
            // Mise à jour transaction prestataire
            this.transactionService.getAll().subscribe({
              next: (transactions: any[]) => {
                const match = transactions.filter(tx => tx.idBooking === order._id);
                match.forEach(tx => {
                  tx.status = 'refunded';
                  this.transactionService.update(tx).subscribe({
                    error: (err) => {
                      console.error('Erreur maj transaction pro absent :', err);
                      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
                    }
                  });
                });
              },
              error: (err) => {
                console.error('Erreur récupération transactions :', err);
                this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
              }
            });
          },
          error: (err) => {
            console.error('Erreur remboursement Stripe :', err);
            this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
          }
        });
        this.switchUserOrPro();
      },
      error: (err) => {
        console.error('Erreur no-show-pro :', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });
  }

  // -------------------------------
  // 🔹 Générer un code pour le booking
  // -------------------------------
  generateCode(booking: any) {
    booking.generatedCode = Math.floor(100000 + Math.random() * 900000);
    console.log(`Code généré : ${booking.generatedCode}`);

    this.bookingService.update(booking).subscribe({
      next: (response) => {
        console.log('Code généré sauvegardé :', response);
        this.switchUserOrPro();
      },
      error: (err) => {
        console.error('Erreur sauvegarde code généré :', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });
  }

  // -------------------------------
  // 🔹 Vérifie le code de validation de prestation
  // -------------------------------
  confirmCode(booking: any, inputCode: string) {
    if (!booking || !booking._id) {
      console.error('Booking invalide pour la confirmation de code');
      return;
    }

    this.bookingService.confirmBookingCode(booking._id, inputCode).subscribe({
      next: (response) => {
        if (response.confirmed) {
          booking.proCodeConfirmed = true;
          console.log('Code confirmé pour booking :', booking._id);
        } else {
          console.warn('Code invalide pour booking :', booking._id);
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        }
      },
      error: (err) => {
        console.error('Erreur confirmation code booking :', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });
  }

  // -------------------------------
  // 🔹 Méthode d’affichage toast stylisé IzyGlam
  // -------------------------------
  showCustomToast(message: string) {
    this.toastr.error(message);
  }
}
