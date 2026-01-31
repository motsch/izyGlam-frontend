import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

// import * as pdfMake from 'pdfmake/build/pdfmake';
// import * as pdfFonts from 'pdfmake/build/vfs_fonts';

import { BookingService } from '../../services/booking.service';
import { RatingModalComponent } from '../rating-modal/rating-modal.component';

import { environment } from 'src/environments/environment';

// Notifications / i18n
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { ShopService } from '../../services/shop.service';

// ⚠️ pdfMake doit connaître ses polices

const pdfMake = require('pdfmake/build/pdfmake');
const pdfFonts = require('pdfmake/build/vfs_fonts');
pdfMake.vfs = pdfFonts.vfs;

@Component({
  selector: 'app-order-item',
  templateUrl: './order-item.component.html',
  styleUrls: ['./order-item.component.scss']
})
export class OrderItemComponent implements OnInit {
  // ======= Inputs / état local =======
  @Input() order: any;

  APIimgStorageUrl: string = environment.APIimgStorageUrl.replace(/\/$/, '');
  storedLangue = (localStorage.getItem('langue') || '')
    .replace(/^"(.*)"$/, '$1')
    .trim()
    .slice(0, 2)
    .toLowerCase();

  constructor(
    private bookingService: BookingService,
    private dialog: MatDialog,
    private router: Router,
    private toastr: ToastrService,
    private shopService: ShopService,
    private translate: TranslateService
  ) { }

  ngOnInit(): void { }

  // ============================================================
  // ==================  FACTURATION / PDF  =====================
  // ============================================================

  /**
   * Demande les deux factures :
   * - Facture prestataire (prestation)
   * - Facture de commission (izyGlam)
   */
  requestInvoice() {
    try {
      this.generateProfessionalInvoice();
      this.generateIzyGlamCommissionInvoice();
      this.showCustomToast(
        this.translate.instant('SUCCESS.INVOICE_GENERATED') || 'Factures générées.',
        'success'
      );
    } catch (e) {
      console.error('[OrderItem] requestInvoice ERROR:', e);
      this.showCustomToast(
        this.translate.instant('ERROR.INVOICE_GENERATED_ERROR') || 'Erreur lors de la génération des factures.',
        'error'
      );
    }
  }

  /**
   * Génère la facture de prestation (pour le professionnel).
   */
  generateProfessionalInvoice() {
    try {
      // Gestion des dates (compat MongoDB $date ou ISO)
      const startDate = new Date(this.order?.start?.$date || this.order?.start);
      const endDate = new Date(this.order?.end?.$date || this.order?.end);

      const price = this.safeParseFloat(this.order?.price);
      const tva = this.safeParseFloat(this.order?.tva); // en %
      const shopEarnings = this.safeParseFloat(this.order?.shopEarnings);

      const tvaAmount = price * (tva / 100);

      const docDefinition: any = {
        content: [
          { text: this.tr('INVOICE.SERVICE_TITLE', 'Facture de prestation'), style: 'header' },
          `${this.tr('INVOICE.ESTABLISHMENT', 'Établissement')}: ${this.order?.establishmentName || '-'}`,
          `${this.tr('INVOICE.ADDRESS', 'Adresse')}: ${this.order?.address || '-'}`,
          {
            table: {
              body: [
                [
                  this.tr('INVOICE.DESCRIPTION', 'Description'),
                  this.tr('INVOICE.QUANTITY', 'Quantité'),
                  this.tr('INVOICE.PRICE', 'Prix'),
                  this.tr('INVOICE.VAT', 'TVA'),
                  this.tr('INVOICE.TOTAL', 'Total')
                ],
                [
                  this.order?.productName || this.tr('INVOICE.SERVICE', 'Prestation'),
                  '1',
                  `${price.toFixed(2)} €`,
                  `${tvaAmount.toFixed(2)} €`,
                  `${price.toFixed(2)} €`
                ]
              ]
            },
            layout: 'lightHorizontalLines'
          },
          `${this.tr('INVOICE.TOTAL_FOR_ESTABLISHMENT', 'Total pour l\'établissement')}: ${shopEarnings.toFixed(2)} €`,
          `${this.tr('INVOICE.SERVICE_DATE', 'Date du service')}: ${startDate.toLocaleString()} → ${endDate.toLocaleString()}`
        ],
        styles: {
          header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
          tableHeader: { fillColor: '#FFC0CB' }
        }
      };

      pdfMake.createPdf(docDefinition).download(`facture_prestation_${this.order?.clientId || ''}.pdf`);
    } catch (e) {
      console.error('[OrderItem] generateProfessionalInvoice ERROR:', e);
      this.showCustomToast(
        this.translate.instant('ERROR.GENERIC_ERROR') || 'Erreur lors de la génération de la facture prestation.',
        'error'
      );
      throw e; // Propager pour prévenir requestInvoice()
    }
  }

  /**
   * Génère la facture de commission (pour la plateforme).
   */
  generateIzyGlamCommissionInvoice() {
    try {
      const commission = this.safeParseFloat(this.order?.commission);
      const tva = this.safeParseFloat(this.order?.tva); // en %
      const tvaAmount = commission * (tva / 100);

      const docDefinition: any = {
        content: [
          { text: this.tr('INVOICE.COMMISSION_TITLE', 'Facture de commission'), style: 'header' },
          `${this.tr('INVOICE.PROVIDER', 'Prestataire')}: izyGlam`,
          `${this.tr('INVOICE.ADDRESS', 'Adresse')}: 123 Avenue de la République, 75011 Paris`,
          {
            table: {
              body: [
                [
                  this.tr('INVOICE.DESCRIPTION', 'Description'),
                  this.tr('INVOICE.QUANTITY', 'Quantité'),
                  this.tr('INVOICE.COMMISSION', 'Commission'),
                  this.tr('INVOICE.VAT', 'TVA'),
                  this.tr('INVOICE.TOTAL', 'Total')
                ],
                [
                  this.tr('INVOICE.IZYGLAM_COMMISSION', 'Frais de service'),
                  '1',
                  `${commission.toFixed(2)} €`,
                  `${tvaAmount.toFixed(2)} €`,
                  `${(commission + tvaAmount).toFixed(2)} €`
                ]
              ]
            },
            layout: 'lightHorizontalLines'
          },
          `${this.tr('INVOICE.TOTAL_COMMISSION', 'Total commission')}: ${commission.toFixed(2)} €`
        ],
        styles: {
          header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
          tableHeader: { fillColor: '#FFC0CB' }
        }
      };

      pdfMake.createPdf(docDefinition).download(`facture_commission_${this.order?.clientId || ''}.pdf`);
    } catch (e) {
      console.error('[OrderItem] generateIzyGlamCommissionInvoice ERROR:', e);
      this.showCustomToast(
        this.translate.instant('ERROR.GENERIC_ERROR') || 'Erreur lors de la génération de la facture commission.',
        'error'
      );
      throw e;
    }
  }

  // ============================================================
  // =====================  ACTIONS UI  =========================
  // ============================================================

  /**
   * Ré-achat / retour vers la boutique
   */
  reorder() {
    try {
      if (!this.order?.shopId) return;
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
      console.error('[OrderItem] reorder ERROR:', e);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR') || 'Navigation impossible.', 'error');
    }
  }

  /**
   * Ouverture de la modale d’avis, puis MAJ du booking (reviewAdded = true)
   */
  openRatingDialog() {
    try {
      const shopId = this.order?.shopId;
      const dialogRef = this.dialog.open(RatingModalComponent, {
        width: '300px',
        data: { shopId }
      });

      dialogRef.afterClosed().subscribe({
        next: (result) => {
          if (!result) return;

          // Marquer la commande comme "avis déposé"
          const updatedOrder = { ...this.order, reviewAdded: true };

          this.bookingService.update(updatedOrder).subscribe({
            next: (data: any) => {
              console.log('[OrderItem] Review saved, order updated:', data);
              this.order.reviewAdded = true;
              this.showCustomToast(
                this.translate.instant('SUCCESS.REVIEW_SAVED') || 'Avis enregistré, merci !',
                'success'
              );
            },
            error: (error: any) => {
              console.error('[OrderItem] Update order after review ERROR:', error);
              this.showCustomToast(
                this.translate.instant('ERROR.ORDER_ERROR') || 'Erreur lors de la mise à jour de la commande.',
                'error'
              );
            }
          });
        },
        error: (err) => {
          console.error('[OrderItem] rating dialog close ERROR:', err);
        }
      });
    } catch (e) {
      console.error('[OrderItem] openRatingDialog try/catch ERROR:', e);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), 'error');
    }
  }

  /**
   * Annuler la commande (statut "cancelled")
   */
  cancelOrder() {
    try {
      const updatedStatus = 'cancelled';
      if (!this.order?._id) return;

      this.bookingService.updateBookingStatus(this.order._id, updatedStatus, this.storedLangue).subscribe({
        next: (response: any) => {
          console.log('[OrderItem] Order cancelled:', response);
          this.order.status = updatedStatus;
          this.showCustomToast(
            this.translate.instant('SUCCESS.ORDER_CANCELLED') || 'Commande annulée.',
            'success'
          );
        },
        error: (error: any) => {
          console.error('[OrderItem] cancelOrder ERROR:', error);
          this.showCustomToast(
            this.translate.instant('ERROR.GENERIC_ERROR') || 'Erreur lors de l’annulation.',
            'error'
          );
        }
      });
    } catch (e) {
      console.error('[OrderItem] cancelOrder try/catch ERROR:', e);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), 'error');
    }
  }

  // ============================================================
  // ====================  HELPERS DIVERS  ======================
  // ============================================================

  /**
   * Parse float sécurisé (retour 0 si NaN/undefined)
   */
  private safeParseFloat(v: any): number {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : 0;
  }

  /**
   * Helper traduction avec fallback message clair
   */
  private tr(key: string, fallback: string): string {
    const t = this.translate.instant(key);
    return t && t !== key ? t : fallback;
  }

  /**
   * Toast générique (clé i18n ou message brut)
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
