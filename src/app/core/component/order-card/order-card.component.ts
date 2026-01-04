import { Component, EventEmitter, Input, Output } from '@angular/core';
import moment from 'moment';
import { Router } from '@angular/router';

import { environment } from 'src/environments/environment';

// Services métier
import { BookingService } from '../../services/booking.service';
import { FinancialService } from '../../services/financial.service';
import { TransactionService } from '../../services/transaction.service';
import { StripeService } from '../../services/stripe.service';

// Notifications / i18n
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { ShopService } from '../../services/shop.service';

@Component({
  selector: 'app-order-card',
  standalone: false,
  templateUrl: './order-card.component.html',
  styleUrl: './order-card.component.scss'
})
export class OrderCardComponent {
  // === Constantes / Inputs / Outputs ==========================
  APIimgStorageUrl: string = environment.APIimgStorageUrl.replace(/\/$/, '');
  imgStorageUrl: string = environment.APIimgStorageUrl.replace(/\/$/, '');
  apiImageUrl = environment.APIimgStorageUrl;

  @Input() order: any;
  @Input() index: number = 0;
  @Input() imageLoaded: boolean = false;
  @Input() isWithinDisplayTime: boolean = false; // ⬅ affichage du code confidentiel
  @Input() isAfterGracePeriod: boolean = false;  // ⬅ expiration du délai
  @Input() availableActions: string[] = [];      // ⬅ actions filtrées par parent

  @Output() onDownloadInvoice = new EventEmitter<any>();
  @Output() onUpdateNeeded = new EventEmitter<any>();
  @Output() modalReview = new EventEmitter<any>();

  confirmCodeInput: string = '';

  // Langue stockée (2 lettres) pour les appels backend
  storedLangue = (localStorage.getItem('langue') || '')
    .replace(/^"(.*)"$/, '$1')
    .trim()
    .slice(0, 2)
    .toLowerCase();

  constructor(
    private stripeService: StripeService,
    private router: Router,
    private transactionService: TransactionService,
    private bookingService: BookingService,
    private financialService: FinancialService,
    private toastr: ToastrService,
    private shopService: ShopService,
    private translate: TranslateService
  ) { }

  // ============================================================
  // ===============  Actions principales (CRUD)  ===============
  // ============================================================

  /**
   * Suppression (côté client) d’un booking :
   * - Passe le statut en 'deleted'
   * - Déclenche un remboursement complet (>24h) ou partiel (<24h) via FinancialService
   * - Emet un événement vers le parent pour rafraîchir la liste
   */
  deleteBooking(order: any) {
    try {
      if (!order?._id) return;

      console.log('[OrderCard] deleteBooking →', order?._id);
      this.bookingService.updateBookingStatus(order._id, 'deleted', this.storedLangue).subscribe({
        next: (response: any) => {
          try {
            console.log('[OrderCard] Booking deleted OK:', response);

            const bookingStart = moment(order.start);
            const now = moment();
            const diffHours = bookingStart.diff(now, 'hours');
            console.log(`[OrderCard] Hours until start: ${diffHours}`);

            if (diffHours >= 24) {
              // ➜ Remboursement complet
              this.financialService.processRefund(order._id, 'customer-cancel-greater-than-24').subscribe({
                next: (refundResponse: any) => {
                  console.log('[OrderCard] Refund full OK:', refundResponse);
                  this.showCustomToast(this.translate.instant('SUCCESS.REFUND_OK') || 'Remboursement effectué.', 'success');
                  this.onUpdateNeeded.emit(order); // ⬅ informer le parent de rafraîchir
                },
                error: (refundError: any) => {
                  console.error('[OrderCard] Refund full ERROR:', refundError);
                  this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR') || 'Erreur de remboursement.', 'error');
                }
              });
            } else {
              // ➜ Remboursement partiel, confirmation côté UI
              // (Tu peux translater ce confirm si besoin)
              if (window.confirm("Attention, si vous continuez, vous ne serez remboursé qu'à 50% du montant payé. Voulez-vous confirmer ?")) {
                this.financialService.processRefund(order._id, 'customer-cancel-less-than-24').subscribe({
                  next: (refundResponse: any) => {
                    console.log('[OrderCard] Refund partial OK:', refundResponse);
                    this.showCustomToast(this.translate.instant('SUCCESS.REFUND_OK') || 'Remboursement effectué.', 'success');
                    this.onUpdateNeeded.emit(order);
                  },
                  error: (refundError: any) => {
                    console.error('[OrderCard] Refund partial ERROR:', refundError);
                    this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR') || 'Erreur de remboursement.', 'error');
                  }
                });
              } else {
                console.log('[OrderCard] Partial refund cancelled by user.');
              }
            }
          } catch (e) {
            console.error('[OrderCard] deleteBooking(next) processing error:', e);
            this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), 'error');
          }
        },
        error: (error: any) => {
          console.error('[OrderCard] deleteBooking ERROR:', error);
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), 'error');
        }
      });
    } catch (e) {
      console.error('[OrderCard] deleteBooking try/catch ERROR:', e);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), 'error');
    }
  }

  /**
   * Annulation via bouton "Annuler" (cas UX distinct, même logique que delete).
   * Laisse un hook d’UI différent si tu veux des textes / toasts différents.
   */
  cancelBooking(order: any) {
    try {
      if (!order?._id) return;

      console.log('[OrderCard] cancelBooking →', order?._id);
      this.bookingService.updateBookingStatus(order._id, 'deleted', this.storedLangue).subscribe({
        next: (response: any) => {
          try {
            console.log('[OrderCard] cancelBooking OK:', response);

            const bookingStart = moment(order.start);
            const now = moment();
            const diffHours = bookingStart.diff(now, 'hours');
            console.log(`[OrderCard] Hours until start: ${diffHours}`);

            if (diffHours >= 24) {
              // Remboursement complet
              this.financialService.processRefund(order._id, 'customer-cancel-greater-than-24').subscribe({
                next: (refundResponse: any) => {
                  console.log('[OrderCard] cancelBooking full refund OK:', refundResponse);
                  this.showCustomToast(this.translate.instant('SUCCESS.REFUND_OK') || 'Remboursement effectué.', 'success');
                  this.onUpdateNeeded.emit(order);
                },
                error: (refundError: any) => {
                  console.error('[OrderCard] cancelBooking full refund ERROR:', refundError);
                  this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR') || 'Erreur de remboursement.', 'error');
                }
              });
            } else {
              // Remboursement partiel
              if (window.confirm("Attention, si vous continuez, vous ne serez remboursé qu'à 50% du montant payé. Voulez-vous confirmer ?")) {
                this.financialService.processRefund(order._id, 'customer-cancel-less-than-24').subscribe({
                  next: (refundResponse: any) => {
                    console.log('[OrderCard] cancelBooking partial refund OK:', refundResponse);
                    this.showCustomToast(this.translate.instant('SUCCESS.REFUND_OK') || 'Remboursement effectué.', 'success');
                    this.onUpdateNeeded.emit(order);
                  },
                  error: (refundError: any) => {
                    console.error('[OrderCard] cancelBooking partial refund ERROR:', refundError);
                    this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR') || 'Erreur de remboursement.', 'error');
                  }
                });
              } else {
                console.log('[OrderCard] cancelBooking partial refund cancelled by user.');
              }
            }
          } catch (e) {
            console.error('[OrderCard] cancelBooking(next) processing error:', e);
            this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), 'error');
          }
        },
        error: (error: any) => {
          console.error('[OrderCard] cancelBooking ERROR:', error);
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), 'error');
        }
      });
    } catch (e) {
      console.error('[OrderCard] cancelBooking try/catch ERROR:', e);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), 'error');
    }
  }

  /**
   * Génère un code confidentiel à 6 chiffres et le sauvegarde dans le booking.
   */
  generateCode(booking: any) {
    try {
      if (!booking?._id) return;
      booking.generatedCode = Math.floor(100000 + Math.random() * 900000);
      console.log(`[OrderCard] Code generated for ${booking._id}: ${booking.generatedCode}`);

      this.bookingService.update(booking).subscribe({
        next: (response: any) => {
          console.log('[OrderCard] Code saved OK:', response);
          this.showCustomToast(this.translate.instant('SUCCESS.CODE_SAVED') || 'Code généré.', 'success');
        },
        error: (err: any) => {
          console.error('[OrderCard] Code save ERROR:', err);
          this.showCustomToast(this.translate.instant('ERROR.CODE_ERROR') || 'Erreur lors de la sauvegarde du code.', 'error');
        }
      });
    } catch (e) {
      console.error('[OrderCard] generateCode try/catch ERROR:', e);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), 'error');
    }
  }

  /**
   * Marque le prestataire comme absent (no-show-pro)
   * - Update statut
   * - Remboursement Stripe du client
   * - MAJ des transactions (refunded)
   * - Pénalité : commission + 10% du total, débit prestataire + crédit plateforme
   */
  markPrestataireAbsent(order: any) {
    try {
      if (!order?._id) return;

      console.log('[OrderCard] no-show-pro →', order?._id);
      this.bookingService.updateBookingStatus(order._id, 'no-show-pro', this.storedLangue).subscribe({
        next: () => {
          // 1) Remboursement Stripe intégral du client
          this.stripeService.refundPayment(order.paymentIntentId).subscribe({
            next: (refundResponse: any) => {
              console.log('[OrderCard] Stripe refund OK:', refundResponse);

              // 2) MAJ transaction(s) associée(s) en "refunded"
              this.transactionService.getAll().subscribe({
                next: (transactions: any[]) => {
                  try {
                    const matching = transactions.filter(tx => tx.idBooking === order._id);
                    if (matching.length > 0) {
                      matching.forEach((tx: any) => {
                        tx.status = 'refunded';
                        this.transactionService.update(tx).subscribe({
                          next: (updatedTx) => console.log('[OrderCard] Tx updated as refunded:', updatedTx),
                          error: (err) => console.error('[OrderCard] Tx update ERROR:', err)
                        });
                      });
                    } else {
                      console.warn('[OrderCard] No transaction found for this booking.');
                    }
                  } catch (e) {
                    console.error('[OrderCard] process transactions error:', e);
                  }
                },
                error: (err) => {
                  console.error('[OrderCard] getAll transactions ERROR:', err);
                }
              });

              // 3) Pénalité : commission + 10% du total
              const totalAmount = parseFloat(order.price || 0);
              const commission = order.commission ? parseFloat(order.commission) : 0;
              const additionalPenalty = totalAmount * 0.1; // 10%
              const totalPenalty = commission + additionalPenalty;

              // 3a) Débit prestataire
              const penaltyTransactionPayload = {
                userProId: order.userProId,
                type: 'debit',
                amount: totalPenalty,
                description: 'Pénalité no-show-pro : commission + 10%',
                status: 'completed',
                idBooking: order._id
              };
              this.transactionService.create(penaltyTransactionPayload).subscribe({
                next: () => {
                  // 3b) Crédit plateforme
                  const platformTransactionPayload = {
                    userProId: 'platform',
                    type: 'credit',
                    amount: totalPenalty,
                    description: 'Crédit pénalité no-show-pro',
                    status: 'completed',
                    idBooking: order._id
                  };
                  this.transactionService.create(platformTransactionPayload).subscribe({
                    next: () => {
                      this.showCustomToast(this.translate.instant('SUCCESS.NO_SHOW_PRO') || 'Pénalité appliquée & remboursement effectué.', 'success');
                    },
                    error: (platformTxError: any) => {
                      console.error('[OrderCard] Platform tx create ERROR:', platformTxError);
                      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), 'error');
                    }
                  });
                },
                error: (penaltyError: any) => {
                  console.error('[OrderCard] Penalty tx create ERROR:', penaltyError);
                  this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), 'error');
                }
              });
            },
            error: (refundError: any) => {
              console.error('[OrderCard] Stripe refund ERROR:', refundError);
              this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), 'error');
            }
          });
        },
        error: (err: any) => {
          console.error('[OrderCard] no-show-pro status update ERROR:', err);
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), 'error');
        }
      });
    } catch (e) {
      console.error('[OrderCard] markPrestataireAbsent try/catch ERROR:', e);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), 'error');
    }
  }

  // ============================================================
  // =======================  UI helpers  =======================
  // ============================================================

  onImageLoad(_orderId: string) {
    // hook visuel si tu veux marquer le skeleton comme "loaded"
    console.log('[OrderCard] image loaded');
  }

  goToShop(order: any) {
    try {
      if (!order?.shopId) return;      
      this.shopService.getById(this.order?.shopId).subscribe({
        next: (shop) => {
          if (!shop) return;
          this.router.navigate(['shop/' + shop.handle]);
        },
        error: (err) => {
          console.error('[OrderItem] rating dialog close ERROR:', err);
        }
      })
    } catch (e) {
      console.error('[OrderCard] goToShop ERROR:', e);
    }
  }

  formatPrice(price: any): string {
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice)) return '0.00 €';
    return numericPrice.toFixed(2);
  }

  contactSupport(order: any) {
    // Hook pour ouvrir le chat support pré-rempli, ou router vers /support
    console.log('[OrderCard] contactSupport →', order?._id);
  }

  reviewBooking(order: any) {
    // Ouvre la modale d’avis (parent)
    this.modalReview.emit(order);
  }

  closeReviewModal() {
    // Ferme la modale d’avis (parent)
    this.modalReview.emit();
  }

  // ============================================================
  // =======================  Toast helper  =====================
  // ============================================================

  /**
   * Affiche un toast i18n (clé ou message brut).
   * @param keyOrMessage Clé i18n (p.ex. 'ERROR.GENERIC_ERROR') ou message direct
   * @param type 'success' | 'error'
   */
  private showCustomToast(keyOrMessage: string, type: 'success' | 'error' = 'success') {
    try {
      const translated = this.translate.instant(keyOrMessage);
      const message = translated && translated !== keyOrMessage ? translated : keyOrMessage;
      if (type === 'success') this.toastr.success(message);
      else this.toastr.error(message);
    } catch {
      if (type === 'success') this.toastr.success(keyOrMessage);
      else this.toastr.error(keyOrMessage);
    }
  }
}
