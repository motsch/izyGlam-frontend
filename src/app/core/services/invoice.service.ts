import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TranslateService } from '@ngx-translate/core'; // <-- ngx-translate
import { SessionService } from './session.service';

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: { finalY: number };
  }
}

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  private readonly roseColor = '#f48bbd';

  constructor(
    private translate: TranslateService,
    private session: SessionService
  ) {}

  async previewInvoice(order: any) {
    const doc = await this.generateStyledInvoice(order);
    window.open(doc.output('bloburl'), '_blank');
  }

  async downloadInvoice(order: any) {
    const doc = await this.generateStyledInvoice(order);
    doc.save(`Facture-${order.generatedCode || order._id || 'commande'}.pdf`);
  }

  // === CORE ===
  private async generateStyledInvoice(order: any): Promise<jsPDF> {
    const lang = (this.session.getLang?.() || localStorage.getItem('langue') || 'fr').toString();
    // Ne change pas la langue globale ici: on lit juste les clés au moment T
    const t = (key: string, params?: Record<string, any>) => this.translate.instant(key, params);

    const locale = this.langToLocale(lang); // ex "fr" -> "fr-FR", "en" -> "en-US"
    const currency = this.detectCurrency(order, this.session?.country);

    const doc = new jsPDF();
    const logo = await this.loadLogo();

    // LOGO
    if (logo) doc.addImage(logo, 'PNG', 160, 10, 30, 30);

    // TITRE
    doc.setTextColor(this.roseColor);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(t('invoice.TITLE'), 20, 30);

    // INFOS VENDEUR / CLIENT
    doc.setTextColor(0).setFontSize(12).setFont('helvetica', 'normal');
    doc.text(t('invoice.SELLER'), 20, 45);
    // Tu peux internationaliser l’adresse si tu l’as dans tes fichiers (ici hardcodée pour l’exemple)
    doc.text(t('invoice.SELLER_ADDRESS', { linebreak: '\n' }) || 'izyGlam\n22, avenue Voltaire\n75000 Paris', 20, 50, { maxWidth: 80 });

    doc.text(t('invoice.CLIENT'), 110, 45);
    doc.text(order.title || t('invoice.UNKNOWN_CLIENT'), 110, 50, { maxWidth: 80 });
    if (order.address) doc.text(order.address, 110, 55, { maxWidth: 80 });
    if (order.phoneNumber) doc.text(order.phoneNumber, 110, 60, { maxWidth: 80 });

    // INFOS FACTURE
    doc.setFont('helvetica', 'bold');
    doc.text(t('invoice.BILLING_DATE'), 20, 75);
    doc.setFont('helvetica', 'normal');
    doc.text(this.formatDate(order.orderDate || new Date(), locale), 70, 75);

    doc.setFont('helvetica', 'bold');
    doc.text(t('invoice.NUMBER'), 20, 80);
    doc.setFont('helvetica', 'normal');
    doc.text(order.generatedCode || order._id || t('invoice.UNDEFINED'), 70, 80);

    doc.setFont('helvetica', 'bold');
    doc.text(t('invoice.DUE_DATE'), 20, 85);
    doc.setFont('helvetica', 'normal');
    doc.text(t('invoice.DUE_IMMEDIATE'), 70, 85);

    doc.setFont('helvetica', 'bold');
    doc.text(t('invoice.PAYMENT_STATUS'), 20, 90);
    doc.setFont('helvetica', 'normal');
    doc.text((order.status || 'Pending').toString(), 70, 90);

    doc.setFont('helvetica', 'bold');
    doc.text(t('invoice.SERVICE_DATE'), 20, 95);
    doc.setFont('helvetica', 'normal');
    doc.text(this.formatDate(order.start, locale), 70, 95);

    // === CALCULS ===
    const ttc          = this.num(order.price);        // Prix TTC (source de vérité)
    const shopHT       = this.num(order.shopEarnings); // Revenu prestataire HT
    const commissionHT = this.num(order.commission);   // Commission HT
    const serviceFeeHT = this.num(order.serviceFee);   // Frais de service HT

    const totalHT   = +(shopHT + commissionHT + serviceFeeHT).toFixed(2);
    const totalTVA  = +(ttc - totalHT).toFixed(2);
    const expectedTTC = +(totalHT + totalTVA).toFixed(2);

    // TABLEAU
    autoTable(doc, {
      startY: 110,
      head: [[
        t('invoice.DESCRIPTION'),
        t('invoice.QTY'),
        t('invoice.UNIT'),
        t('invoice.UNIT_PRICE_HT'),
        t('invoice.VAT_RATE'),
        t('invoice.TOTAL_VAT'),
        t('invoice.TOTAL_TTC'),
      ]],
      body: [
        [
          order.productName || t('invoice.DEFAULT_ITEM'),
          '1',
          t('invoice.SERVICE_UNIT'),
          this.formatCurrency(shopHT, locale, currency),
          '0 %',
          this.formatCurrency(0, locale, currency),
          this.formatCurrency(shopHT, locale, currency),
        ],
        [
          t('invoice.IG_COMMISSION'),
          '1',
          t('invoice.SERVICE_UNIT'),
          this.formatCurrency(commissionHT, locale, currency),
          '0 %',
          this.formatCurrency(0, locale, currency),
          this.formatCurrency(commissionHT, locale, currency),
        ],
        [
          t('invoice.SERVICE_FEES'),
          '1',
          t('invoice.SERVICE_UNIT'),
          this.formatCurrency(serviceFeeHT, locale, currency),
          '0 %',
          this.formatCurrency(0, locale, currency),
          this.formatCurrency(serviceFeeHT, locale, currency),
        ],
        [
          t('invoice.VAT_STATE'),
          '—',
          '',
          '',
          '—',
          this.formatCurrency(totalTVA, locale, currency),
          this.formatCurrency(totalTVA, locale, currency),
        ]
      ],
      headStyles: {
        fillColor: this.hexToRgb(this.roseColor),
        textColor: [255, 255, 255],
      },
      styles: { fontSize: 10 }
    });

    // TOTALS
    const y = (doc.lastAutoTable?.finalY ?? 120) + 10;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);

    doc.text(t('invoice.TOTAL_HT'), 150, y);
    doc.text(this.formatCurrency(totalHT, locale, currency), 200, y, { align: 'right' });

    doc.text(t('invoice.VAT'), 150, y + 7);
    doc.text(this.formatCurrency(totalTVA, locale, currency), 200, y + 7, { align: 'right' });

    doc.setTextColor(this.roseColor);
    doc.text(t('invoice.TOTAL_TTC'), 150, y + 14);
    doc.text(this.formatCurrency(expectedTTC, locale, currency), 200, y + 14, { align: 'right' });

    // PIED DE PAGE
    doc.setTextColor(0);
    doc.setFontSize(8);
    doc.text(t('invoice.FOOTER_LINE1'), 20, 285);
    doc.text(t('invoice.FOOTER_LINE2'), 200, 285, { align: 'right' });

    return doc;
  }

  // === HELPERS ===
  private num(v: any): number {
    const n = Number(v);
    return isNaN(n) ? 0 : n;
    }

  private formatCurrency(value: number, locale: string, currency: string): string {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        currencyDisplay: 'symbol',
        maximumFractionDigits: 2,
        minimumFractionDigits: 2
      }).format(value);
    } catch {
      // Fallback: 12,34 €
      return `${value.toFixed(2).replace('.', ',')} €`;
    }
  }

  private formatDate(date: Date | string | null | undefined, locale: string): string {
    if (!date) return this.translate.instant('invoice.INVALID_DATE');
    const d = new Date(date);
    if (isNaN(d.getTime())) return this.translate.instant('invoice.INVALID_DATE');
    try {
      return new Intl.DateTimeFormat(locale).format(d);
    } catch {
      return d.toLocaleDateString('fr-FR');
    }
  }

  private langToLocale(lang: string): string {
    // Adapter si tes codes sont du type 'en-GB', 'pt-BR' etc. Ici: mini-map avec fallback
    const map: Record<string, string> = {
      fr: 'fr-FR',
      en: 'en-US',
      es: 'es-ES',
      de: 'de-DE',
      it: 'it-IT',
      nl: 'nl-NL',
      pt: 'pt-PT',
      'pt-BR': 'pt-BR'
      // ajoute tes locales utiles
    };
    return map[lang] || (lang.includes('-') ? lang : `${lang}-${lang.toUpperCase()}`);
  }

  private detectCurrency(order: any, country?: string): string {
    // Priorité: devise de la commande si elle existe
    if (order?.currency && typeof order.currency === 'string') {
      return order.currency.toUpperCase();
    }
    // Sinon on déduit de ton pays si dispo
    const byCountry: Record<string, string> = {
      FR: 'EUR', BE: 'EUR', DE: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR', PT: 'EUR', IE: 'EUR',
      US: 'USD', GB: 'GBP', CH: 'CHF', CA: 'CAD', AU: 'AUD', JP: 'JPY', SE: 'SEK', NO: 'NOK', DK: 'DKK'
    };
    if (country && byCountry[country]) return byCountry[country];
    // Fallback IzyGlam
    return 'EUR';
  }

  private async loadLogo(): Promise<string | null> {
    try {
      const response = await fetch('assets/images/logo.png');
      const blob = await response.blob();
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.warn("Logo introuvable :", e);
      return null;
    }
  }

  private hexToRgb(hex: string): [number, number, number] {
    const bigint = parseInt(hex.replace('#', ''), 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  }
}
