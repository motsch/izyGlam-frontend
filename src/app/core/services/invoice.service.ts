import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

declare module 'jspdf' {
  interface jsPDF {
    lastAutoTable?: { finalY: number };
  }
}

@Injectable({ providedIn: 'root' })
export class InvoiceService {
  constructor() { }

  async previewInvoice(order: any) {
    const doc = await this.generateStyledInvoice(order);
    window.open(doc.output('bloburl'), '_blank');
  }

  async downloadInvoice(order: any) {
    const doc = await this.generateStyledInvoice(order);
    doc.save(`Facture-${order.generatedCode || order._id || 'commande'}.pdf`);
  }

  private async generateStyledInvoice(order: any): Promise<jsPDF> {
    const doc = new jsPDF();
    const roseColor = '#f48bbd';
    const logo = await this.loadLogo();

    // LOGO
    if (logo) doc.addImage(logo, 'PNG', 160, 10, 30, 30);

    // TITRE
    doc.setTextColor(roseColor);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('Facture', 20, 30);

    // INFOS VENDEUR / CLIENT
    doc.setTextColor(0).setFontSize(12).setFont('helvetica', 'normal');
    doc.text('Vendeur', 20, 45);
    doc.text('izyGlam\n22, avenue Voltaire\n75000 Paris', 20, 50);

    doc.text('Client', 110, 45);
    doc.text(order.title || 'Client inconnu', 110, 50);
    doc.text(order.address || '', 110, 55);
    doc.text(order.phoneNumber || '', 110, 60);

    // INFOS FACTURE
    doc.setFont('helvetica', 'bold');
    doc.text('Date de facturation :', 20, 75);
    doc.setFont('helvetica', 'normal');
    doc.text(this.formatDate(order.orderDate || new Date()), 70, 75);

    doc.setFont('helvetica', 'bold');
    doc.text('Numéro de facture :', 20, 80);
    doc.setFont('helvetica', 'normal');
    doc.text(order.generatedCode || order._id || 'Non défini', 70, 80);

    doc.setFont('helvetica', 'bold');
    doc.text('Échéance :', 20, 85);
    doc.setFont('helvetica', 'normal');
    doc.text('Immédiate', 70, 85);

    doc.setFont('helvetica', 'bold');
    doc.text('État du paiement :', 20, 90);
    doc.setFont('helvetica', 'normal');
    doc.text('Pending', 70, 90);

    doc.setFont('helvetica', 'bold');
    doc.text('Date du service :', 20, 95);
    doc.setFont('helvetica', 'normal');
    doc.text(this.formatDate(order.start), 70, 95);

    // CALCULS FIXES
    const ttc = parseFloat(order.price); // Prix TTC payé par le client
    const tvaRate = 20; // Taux de TVA (%)
    const commissionHT = parseFloat(order.commission || '0'); // Commission HT
    const shopHT = parseFloat(order.shopEarnings || '0'); // Revenu pro HT

    const totalHT = +(commissionHT + shopHT).toFixed(2); // Total HT
    const totalTVA = +(ttc - totalHT).toFixed(2); // Calcul correct de la TVA
    const expectedTTC = +(totalHT + totalTVA).toFixed(2); // Doit être ≈ TTC initial (vérif)


    // TABLEAU
    autoTable(doc, {
      startY: 110,
      head: [['Description', 'Quantité', 'Unité', 'Prix unitaire HT', '% TVA', 'Total TVA', 'Total TTC']],
      body: [
        [
          order.productName || 'Prestation réservée',
          '1',
          'prestation',
          this.formatCurrency(order.shopEarnings || 0),
          '0 %',
          this.formatCurrency(0),
          this.formatCurrency(order.shopEarnings || 0),
        ],
        [
          'CommissionizyGlam',
          '1',
          'prestation',
          this.formatCurrency(order.commission || 0),
          '0 %',
          this.formatCurrency(0),
          this.formatCurrency(order.commission || 0),
        ],
        [
          'TVA (État)',
          '—',
          '',
          '',
          '20 %',
          this.formatCurrency(this.getTVA(order)),
          this.formatCurrency(this.getTVA(order)),
        ]
      ],
      headStyles: {
        fillColor: this.hexToRgb(roseColor),
        textColor: [255, 255, 255],
      },
      styles: {
        fontSize: 10,
      }
    });


    // TOTALS
    const y = (doc.lastAutoTable?.finalY ?? 120) + 10;
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Total HT', 150, y);
    doc.text(this.formatCurrency(totalHT), 200, y, { align: 'right' });

    doc.text('TVA (20%)', 150, y + 7);
    doc.text(this.formatCurrency(totalTVA), 200, y + 7, { align: 'right' });

    doc.setTextColor(roseColor);
    doc.text('Total TTC', 150, y + 14);
    doc.text(this.formatCurrency(expectedTTC), 200, y + 14, { align: 'right' });

    // PIED DE PAGE
    doc.setTextColor(0);
    doc.setFontSize(8);
    doc.text(`IzyGlam - Service à domicile`, 20, 285);
    doc.text(`www.izyglam.com`, 200, 285, { align: 'right' });

    return doc;
  }

  private formatCurrency(value: string | number): string {
    const number = typeof value === 'string' ? parseFloat(value) : value;
    return `${number.toFixed(2).replace('.', ',')} €`;
  }

  private formatDate(date: Date | string | null | undefined): string {
    if (!date) return 'Date invalide';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Date invalide';
    return d.toLocaleDateString('fr-FR');
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

  private getTVA(order: any): number {
    const price = parseFloat(order.price); // TTC total
    const shopHT = parseFloat(order.shopEarnings || '0');
    const commission = parseFloat(order.commission || '0');
    const totalHT = shopHT + commission;
    return +(price - totalHT).toFixed(2); // TVA = TTC - HT
  }

}
