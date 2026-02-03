import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BookingService } from '../../services/booking.service';
import { UserService } from '../../services/user.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { StripeService } from '../../services/stripe.service';

import { environment } from 'src/environments/environment';

const pdfMake = require('pdfmake/build/pdfmake');
const pdfFonts = require('pdfmake/build/vfs_fonts');

pdfMake.vfs = pdfFonts.vfs;




@Component({
  selector: 'app-finance',
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.scss'],
})
export class FinanceComponent implements OnInit, OnChanges {
  /** Boutique sélectionnée (injectée par le parent) */
  @Input() myShopData: any[] = [];
  shop: any = {};
  /** Copie locale (si besoin de modifier sans toucher l’input directement) */
  shopCopyData: any = {};

  /** Utilisateur courant (injecté par le parent) */
  @Input() me: any = {};

  /** Transactions (si tu souhaites les afficher plus tard) */
  transactions: any[] = [];

  /** Formulaire de demande de retrait */
  withdrawalForm: FormGroup;

  /** État de la modale d’infos bancaires */
  bankModalVisible = false;
  stripeLoading = false;

  /** KPIs du dashboard finance */
  totalRevenue = 0;
  totalCommission = 0;
  evolution = 0;
  totalEarnings = 0;
  totalBookings = 0;
  cancelledBookings = 0;
  avgPrice = 0;
  reviewRatio = 0;
  topProducts: any[] = [];
  avgDuration = 0;

  // -----------------------------
  // Comptabilité (ngModel simple)
  // -----------------------------
  accountingMode: 'week' | 'month' = 'week';
  accountingDate: string = this.getTodayISO();

  accountingLoading = false;
  accountingData: any = null;
  accountingError: string | null = null;
  accountingPeriodLabel = '';


  constructor(
    private fb: FormBuilder,
    private bookingService: BookingService,
    private stripeService: StripeService,
    private translate: TranslateService,
    private toastr: ToastrService
  ) {
    // Définition du formulaire de retrait (montant + compte)
    this.withdrawalForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(1)]],
      accountDetails: ['', Validators.required],
    });
  }



  private formatMoney(v: any): string {
    const n = Number(v ?? 0);
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
  }

  private safe(v: any): string {
    const s = (v ?? '').toString().trim();
    return s.length ? s : "—";
  }

  private buildShopAddress(shop: any): string {
    const a1 = this.safe(shop?.legal?.addressLine1);
    const a2 = (shop?.legal?.addressLine2 || '').toString().trim();
    const cp = this.safe(shop?.legal?.postalCode);
    const city = this.safe(shop?.legal?.city);
    const country = this.safe(shop?.legal?.country || shop?.country);
    return [a1, a2, `${cp} ${city}`.trim(), country].filter(x => x && x !== "—").join('\n');
  }

  private buildIzyAddress(): string {
    const c = environment.izyglamCompany;
    const a2 = (c.addressLine2 || '').toString().trim();
    return [c.addressLine1, a2, `${c.postalCode} ${c.city}`.trim(), c.country].filter(Boolean).join('\n');
  }

  private periodDocNumber(shopId: string, fromISO: string, toISO: string): string {
    // Numéro stable et “comptable”
    const s = shopId.slice(-6).toUpperCase();
    return `ACC-${s}-${fromISO.replaceAll('-', '')}-${toISO.replaceAll('-', '')}`;
  }

  // ---------------------------------------
  // Cycle de vie
  // ---------------------------------------

  ngOnInit(): void {
    this.shop = this.myShopData[0];
    // Marque la section active (pour ton menu latéral)
    localStorage.setItem('menu-param', 'management');

    // Charge les stats si la boutique est connue au démarrage
    if (this.shop && this.shop._id) {
      this.loadDashboardStats(this.shop._id);
    } else {
      console.warn('FinanceComponent → myShopData est vide, en attente de ngOnChanges.');
    }


    const params = new URLSearchParams(window.location.search);
    const stripeReturn = params.get("stripe");

    if (stripeReturn === "return" || stripeReturn === "refresh") {
      this.refreshStripeStatus();
    }
  }

  /** Recharge les stats si l’@Input myShopData change (sélecteur de boutique côté parent) */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['myShopData'] && changes['myShopData'].currentValue) {
      this.shopCopyData = { ...this.shop };
      if (this.shop?._id) {
        this.loadDashboardStats(this.shop._id);
      }
    }
  }

  // ---------------------------------------
  // Données / API
  // ---------------------------------------

  /** Récupère toutes les statistiques d’un shop */
  private loadDashboardStats(shopId: string): void {
    this.bookingService.getDashboardStats(shopId).subscribe({
      next: (data: any) => {
        // Hydrate toutes les métriques
        this.totalRevenue = data?.totalRevenue ?? 0;
        this.totalCommission = data?.totalCommission ?? 0;
        this.evolution = data?.evolution ?? 0;
        this.totalEarnings = data?.totalEarnings ?? 0;
        this.totalBookings = data?.totalBookings ?? 0;
        this.cancelledBookings = data?.cancelledBookings ?? 0;
        this.avgPrice = data?.avgPrice ?? 0;
        this.reviewRatio = data?.reviewRatio ?? 0;
        this.topProducts = data?.topProducts ?? [];
        this.avgDuration = data?.avgDuration ?? 0;
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des stats finance :', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), true);
      }
    });
  }

  // ---------------------------------------
  // Modale d’infos bancaires
  // ---------------------------------------

  openBankModal(): void {
    this.bankModalVisible = true;
    this.autoRefreshStripeStatus();
  }

  private autoRefreshStripeStatus(): void {
    // évite l'appel si pas d'user
    if (!this.me?._id) return;

    // évite de spam si déjà en cours
    if (this.stripeLoading) return;

    this.refreshStripeStatus();
  }

  closeBankModal(): void {
    this.bankModalVisible = false;
  }

  // ---------------------------------------
  // Utilitaires UI
  // ---------------------------------------

  /**
   * Affiche un toast uniformeizyGlam
   * @param message  texte déjà traduit (ou clé si tu préfères)
   * @param isError  true → toast erreur | false → toast succès
   */
  private showCustomToast(message: string, isError: boolean = false): void {
    if (isError) {
      this.toastr.error(message);
    } else {
      this.toastr.success(message);
    }
  }

  startStripeOnboarding(): void {
    this.stripeLoading = true;

    this.stripeService.createStripeOnboardingLink(this.me._id).subscribe({
      next: ({ url }) => {
        window.location.href = url;
      },
      error: (e) => {
        console.error(e);
        this.stripeLoading = false;
        this.toastr.error(this.translate.instant("FINANCE.START_ACTIVATION"));
      }
    });
  }

  refreshStripeStatus(): void {
    this.stripeLoading = true;

    this.stripeService.refreshStripeStatus(this.me._id).subscribe({
      next: (updatedUser) => {
        this.me = updatedUser;
        this.stripeLoading = false;
        // this.toastr.success("Statut Stripe mis à jour.");
      },
      error: (e) => {
        console.error(e);
        this.stripeLoading = false;
        this.toastr.error(this.translate.instant("FINANCE.REFRESH_STRIPE"));
      }
    });
  }

  private get finishedTotal(): number {
    const t = this.shop?.stats?.bookings?.finished?.total;
    return Number.isFinite(+t) ? +t : 0;
  }

  get shopLevelUi(): { emoji: string; class: string; trads: string } {
    const total = this.finishedTotal;

    if (total < 30) return { emoji: "🌱", class: "lvl-starter", trads: "UILEVEL.STARTER" };
    if (total < 120) return { emoji: "🔥", class: "lvl-active", trads: "UILEVEL.ACTIVE" };
    if (total < 250) return { emoji: "💎", class: "lvl-ambassador", trads: "UILEVEL.AMBASSADOR" };
    return { emoji: "👑", class: "lvl-icon", trads: "UILEVEL.ICONE" };
  }

  get nextLevelUi(): null | { trads: string; remaining: number } {
    const total = this.finishedTotal;

    if (total < 30) return { trads: "UILEVEL.ACTIVE", remaining: 30 - total };
    if (total < 120) return { trads: "UILEVEL.AMBASSADOR", remaining: 120 - total };
    if (total < 250) return { trads: "UILEVEL.ICONE", remaining: 250 - total };

    return null; // déjà au max
  }

  // ---------------------------------------
  // Comptabilité (API + exports)
  // ---------------------------------------

  private getTodayISO(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  onAccountingParamsChange(): void {
    // Option : on reset l’aperçu quand l’utilisateur change période/date
    this.accountingData = null;
    this.accountingError = null;
    this.accountingPeriodLabel = '';
  }

  loadAccounting(): void {
    if (!this.shop?._id) return;
    if (this.accountingData) {
      this.accountingData = null;
      return;
    }
    const mode = this.accountingMode;
    const date = this.accountingDate;


    if (!mode || !date) return;

    this.accountingLoading = true;
    this.accountingError = null;

    this.bookingService.getShopAccounting(this.shop._id, mode, date).subscribe({
      next: (data: any) => {
        this.accountingData = data;
        this.accountingLoading = false;

        const from = data?.period?.from ? new Date(data.period.from) : null;
        const to = data?.period?.to ? new Date(data.period.to) : null;
        this.accountingPeriodLabel = (from && to)
          ? `${from.toLocaleDateString()} → ${to.toLocaleDateString()}`
          : '';
      },
      error: (err: any) => {
        console.error('Erreur suivi comptable :', err);
        this.accountingLoading = false;
        this.accountingError = this.translate.instant("FINANCE.LOAD_DATA");
        this.showCustomToast(this.accountingError!, true);
      }
    });
  }

  downloadAccountingCSV(): void {
    if (!this.shop?._id) return;

    // On charge si pas déjà chargé
    if (!this.accountingData) {
      this.loadAccounting();
      // l’utilisateur reclique ensuite : simple et safe
      return;
    }

    const mode = this.accountingMode;
    const date = this.accountingDate;

    const totals = this.accountingData?.totals || {};
    const breakdown = this.accountingData?.breakdown || [];

    const lines: string[] = [];
    lines.push(`ShopId;${this.shop._id}`);
    lines.push(`Mode;${mode}`);
    lines.push(`Date;${date}`);
    lines.push(`Periode;${this.accountingPeriodLabel}`);
    lines.push('');
    lines.push('TOTALS');
    lines.push('Bookings;CA;ServiceFee;Commission;Net;TVA');
    lines.push([
      totals.bookingsCount ?? 0,
      totals.totalPrice ?? 0,
      totals.totalServiceFee ?? 0,
      totals.totalCommission ?? 0,
      totals.totalShopEarnings ?? 0,
      totals.totalTva ?? 0
    ].join(';'));

    lines.push('');
    lines.push('BREAKDOWN');

    if (mode === 'week') {
      lines.push([
        this.translate.instant('ACCOUNTING_EXPORT.DAY'),
        this.translate.instant('ACCOUNTING_EXPORT.BOOKINGS'),
        this.translate.instant('ACCOUNTING_EXPORT.TURNOVER'),
        this.translate.instant('ACCOUNTING_EXPORT.SERVICE_FEE'),
        this.translate.instant('ACCOUNTING_EXPORT.COMMISSION'),
        this.translate.instant('ACCOUNTING_EXPORT.NET'),
        this.translate.instant('ACCOUNTING_EXPORT.VAT')
      ].join(';'));

      breakdown.forEach((b: any) => {
        lines.push([
          b.day ?? '',
          b.bookingsCount ?? 0,
          b.totalPrice ?? 0,
          b.totalServiceFee ?? 0,
          b.totalCommission ?? 0,
          b.totalShopEarnings ?? 0,
          b.totalTva ?? 0
        ].join(';'));
      });
    }
    else {
      lines.push([
        this.translate.instant('ACCOUNTING_EXPORT.YEAR'),
        this.translate.instant('ACCOUNTING_EXPORT.ISO_WEEK'),
        this.translate.instant('ACCOUNTING_EXPORT.BOOKINGS'),
        this.translate.instant('ACCOUNTING_EXPORT.TURNOVER'),
        this.translate.instant('ACCOUNTING_EXPORT.SERVICE_FEE'),
        this.translate.instant('ACCOUNTING_EXPORT.COMMISSION'),
        this.translate.instant('ACCOUNTING_EXPORT.NET'),
        this.translate.instant('ACCOUNTING_EXPORT.VAT')
      ].join(';'));

      breakdown.forEach((b: any) => {
        lines.push([
          b.year ?? '',
          b.isoWeek ?? '',
          b.bookingsCount ?? 0,
          b.totalPrice ?? 0,
          b.totalServiceFee ?? 0,
          b.totalCommission ?? 0,
          b.totalShopEarnings ?? 0,
          b.totalTva ?? 0
        ].join(';'));
      });
    }

    const csv = lines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });

    const fileName = `izyglam_compta_${this.shop._id}_${mode}_${date}.csv`;
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);
  }

  downloadAccountingPDF(): void {
    if (!this.shop?._id) return;

    if (!this.accountingData) {
      this.loadAccounting();
      return;
    }

    const shop = this.shop; // @Input myShopData
    const izy = environment.izyglamCompany;

    const mode = this.accountingMode; // ngModel
    const date = this.accountingDate; // ngModel

    const fromDate = this.accountingData?.period?.from ? new Date(this.accountingData.period.from) : null;
    const toDate = this.accountingData?.period?.to ? new Date(this.accountingData.period.to) : null;

    const fromISO = fromDate ? fromDate.toISOString().slice(0, 10) : "0000-00-00";
    const toISO = toDate ? toDate.toISOString().slice(0, 10) : "0000-00-00";

    const documentNumber = this.periodDocNumber(shop._id, fromISO, toISO);
    const issueDate = new Date().toLocaleDateString('fr-FR');

    const totals = this.accountingData?.totals || {};
    const breakdown = this.accountingData?.breakdown || [];

    // Lignes du tableau
    // Lignes du tableau
    const tableBody: any[] = [
      [
        {
          text: mode === 'week'
            ? this.translate.instant('ACCOUNTING_EXPORT.DAY')
            : this.translate.instant('ACCOUNTING_EXPORT.ISO_WEEK'),
          style: 'th'
        },
        { text: this.translate.instant('ACCOUNTING_EXPORT.BOOKINGS'), style: 'th' },
        { text: this.translate.instant('ACCOUNTING_EXPORT.TURNOVER_SHORT'), style: 'th' },
        { text: this.translate.instant('ACCOUNTING_EXPORT.SERVICE_FEE_SHORT'), style: 'th' },
        { text: this.translate.instant('ACCOUNTING_EXPORT.COMMISSION'), style: 'th' },
        { text: this.translate.instant('ACCOUNTING_EXPORT.NET_PROVIDER'), style: 'th' },
        { text: this.translate.instant('ACCOUNTING_EXPORT.VAT'), style: 'th' }
      ]
    ];


    breakdown.forEach((b: any) => {
      const label = mode === 'week'
        ? this.safe(b.day)
        : `${this.safe(b.year)}-W${this.safe(b.isoWeek)}`;

      tableBody.push([
        { text: label, style: 'td' },
        { text: String(b.bookingsCount ?? 0), style: 'td' },
        { text: this.formatMoney(b.totalPrice), style: 'tdRight' },
        { text: this.formatMoney(b.totalServiceFee), style: 'tdRight' },
        { text: this.formatMoney(b.totalCommission), style: 'tdRight' },
        { text: this.formatMoney(b.totalShopEarnings), style: 'tdRight' },
        { text: this.formatMoney(b.totalTva), style: 'tdRight' },
      ]);
    });

    // Totaux
    const totalsBlock = [
      [
        this.translate.instant('ACCOUNTING_EXPORT.TOTAL_TURNOVER'),
        this.formatMoney(totals.totalPrice)
      ],
      [
        this.translate.instant('ACCOUNTING_EXPORT.TOTAL_SERVICE_FEE'),
        this.formatMoney(totals.totalServiceFee)
      ],
      [
        this.translate.instant('ACCOUNTING_EXPORT.TOTAL_COMMISSION'),
        this.formatMoney(totals.totalCommission)
      ],
      [
        this.translate.instant('ACCOUNTING_EXPORT.TOTAL_NET_PROVIDER'),
        this.formatMoney(totals.totalShopEarnings)
      ],
      [
        this.translate.instant('ACCOUNTING_EXPORT.VAT'),
        this.formatMoney(totals.totalTva)
      ],
      [
        this.translate.instant('ACCOUNTING_EXPORT.BOOKINGS'),
        String(totals.bookingsCount ?? 0)
      ]
    ];


    // Logo en base64 : on le charge via fetch (assets)
    const logoUrl = izy.logoPath;
    const t = (key: string, params?: any) =>
      this.translate.instant(key, params);
    fetch(logoUrl)
      .then(r => r.blob())
      .then(blob => new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      }))
      .then((logoDataUrl) => {
        const docDefinition: any = {
          pageSize: 'A4',
          pageMargins: [30, 30, 30, 40],
          footer: (currentPage: number, pageCount: number) => ({
            columns: [
              { text: `${izy.brandName} • ${this.translate.instant("ACCOUNTING_EXPORT.DOCUMENT")} ${documentNumber}`, style: 'footer' },
              { text: `${this.translate.instant("ACCOUNTING_EXPORT.PAGE")} ${currentPage} / ${pageCount}`, alignment: 'right', style: 'footer' }
            ],
            margin: [30, 0, 30, 20]
          }),
          content: [
            // Header
            {
              columns: [
                {
                  width: 70,
                  image: logoDataUrl,
                  fit: [56, 56],
                },
                {
                  width: '*',
                  stack: [
                    { text: t('ACCOUNTING_EXPORT.DOCUMENT_TITLE'), style: 'h1' },
                    {
                      text: `${t('ACCOUNTING_EXPORT.PERIOD')} : ${fromDate?.toLocaleDateString('fr-FR')} → ${toDate?.toLocaleDateString('fr-FR')}`,
                      style: 'sub'
                    },
                    {
                      text:
                        `${t('ACCOUNTING_EXPORT.DOCUMENT_META')} : ${documentNumber} • ` +
                        `${t('ACCOUNTING_EXPORT.ISSUED_ON')} ${issueDate} • ` +
                        `${t('ACCOUNTING_EXPORT.MODE')} : ${mode} • ` +
                        `${t('ACCOUNTING_EXPORT.DATE')} : ${date}`,
                      style: 'sub2'
                    }
                  ]
                }
              ],
              columnGap: 12
            },

            { text: ' ', margin: [0, 10] },

            // Parties (Izyglam / Shop)
            {
              columns: [
                {
                  width: '*',
                  stack: [
                    { text: t('ACCOUNTING_EXPORT.ISSUER'), style: 'sectionTitle' },
                    { text: this.safe(izy.companyName), style: 'bold' },
                    { text: this.safe(izy.legalForm), style: 'text' },
                    { text: this.buildIzyAddress(), style: 'text' },
                    { text: `${t('ACCOUNTING_EXPORT.SIRET')} : ${this.safe(izy.siret)}`, style: 'text' },
                    { text: `${t('ACCOUNTING_EXPORT.VAT_LABEL')} : ${this.safe(izy.vatNumber)}`, style: 'text' },
                    { text: `${this.safe(izy.email)} • ${this.safe(izy.phone)}`, style: 'textSmall' },
                    { text: this.safe(izy.website), style: 'textSmall' },
                  ],
                  style: 'card'
                },
                {
                  width: '*',
                  stack: [
                    { text: t('ACCOUNTING_EXPORT.BENEFICIARY'), style: 'sectionTitle' },
                    { text: this.safe(shop?.legal?.companyName || ''), style: 'text' },
                    { text: this.safe(shop?.legal?.legalForm || ''), style: 'text' },
                    { text: this.buildShopAddress(shop), style: 'text' },
                    { text: `${t('ACCOUNTING_EXPORT.SIRET')} : ${this.safe(shop?.legal?.siret)}`, style: 'text' },
                    { text: `${t('ACCOUNTING_EXPORT.VAT_LABEL')} : ${this.safe(shop?.legal?.vatNumber)}`, style: 'text' },
                    { text: `${this.safe(shop?.legal?.email)} • ${this.safe(shop?.legal?.phone)}`, style: 'textSmall' },
                  ],
                  style: 'card'
                }
              ],
              columnGap: 12
            },

            { text: ' ', margin: [0, 10] },

            // Totaux
            { text: t('ACCOUNTING_EXPORT.SUMMARY'), style: 'sectionTitle', margin: [0, 0, 0, 6] },
            {
              table: {
                widths: ['*', 'auto', '*', 'auto'],
                body: [
                  [{ text: totalsBlock[0][0], style: 'td' }, { text: totalsBlock[0][1], style: 'tdRight' }, { text: totalsBlock[1][0], style: 'td' }, { text: totalsBlock[1][1], style: 'tdRight' }],
                  [{ text: totalsBlock[2][0], style: 'td' }, { text: totalsBlock[2][1], style: 'tdRight' }, { text: totalsBlock[3][0], style: 'td' }, { text: totalsBlock[3][1], style: 'tdRight' }],
                  [{ text: totalsBlock[4][0], style: 'td' }, { text: totalsBlock[4][1], style: 'tdRight' }, { text: totalsBlock[5][0], style: 'td' }, { text: totalsBlock[5][1], style: 'tdRight' }],
                ]
              },
              layout: 'lightHorizontalLines'
            },

            { text: ' ', margin: [0, 10] },

            // Détail
            { text: t('ACCOUNTING_EXPORT.DETAILS'), style: 'sectionTitle', margin: [0, 0, 0, 6] },
            {
              table: {
                headerRows: 1,
                widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
                body: tableBody
              },
              layout: {
                fillColor: (rowIndex: number) => (rowIndex === 0 ? '#FFEAF3' : null),
                hLineColor: () => '#F1D0E4',
                vLineColor: () => '#F1D0E4',
                paddingLeft: () => 6,
                paddingRight: () => 6,
                paddingTop: () => 6,
                paddingBottom: () => 6,
              }
            },

            { text: ' ', margin: [0, 10] },

            // Mentions
            {
              text:
                `${t('ACCOUNTING_EXPORT.MENTIONS_TITLE')} :\n` +
                `• ${t('ACCOUNTING_EXPORT.MENTION_1', { brand: izy.brandName })}\n` +
                `• ${t('ACCOUNTING_EXPORT.MENTION_2')}\n` +
                `• ${t('ACCOUNTING_EXPORT.MENTION_3')}`,
              style: 'note'
            }
          ],
          styles: {
            h1: { fontSize: 16, bold: true, color: '#B25280' },
            sub: { fontSize: 11, color: '#6E5564', margin: [0, 2, 0, 0] },
            sub2: { fontSize: 9.5, color: '#8B6A7C' },

            sectionTitle: { fontSize: 11, bold: true, color: '#B25280' },
            bold: { fontSize: 10.5, bold: true, color: '#2B1E26', margin: [0, 2, 0, 0] },
            text: { fontSize: 9.5, color: '#2B1E26', margin: [0, 1, 0, 0] },
            textSmall: { fontSize: 9, color: '#6E5564', margin: [0, 2, 0, 0] },

            card: { margin: [0, 0, 0, 0] },

            th: { fontSize: 9, bold: true, color: '#B25280' },
            td: { fontSize: 9, color: '#2B1E26' },
            tdRight: { fontSize: 9, color: '#2B1E26', alignment: 'right' },

            note: { fontSize: 9, color: '#6E5564', lineHeight: 1.2 },
            footer: { fontSize: 8.5, color: '#8B6A7C' }
          },
          defaultStyle: {
            font: 'Roboto'
          }
        };
        const fileName = `${this.translate.instant('ACCOUNTING_EXPORT.FILE_NAME')}_${shop._id}_${fromISO}_${toISO}.pdf`;
        (pdfMake as any).createPdf(docDefinition).download(fileName);
      })
      .catch((e) => {
        console.error(e);
        this.showCustomToast("Impossible de générer le PDF (logo/ressource introuvable).", true);
      });
  }

}
