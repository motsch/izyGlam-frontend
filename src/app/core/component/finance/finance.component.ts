import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BookingService } from '../../services/booking.service';
import { UserService } from '../../services/user.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'src/environments/environment';
import { StripeService } from '../../services/stripe.service';

@Component({
  selector: 'app-finance',
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.scss'],
})
export class FinanceComponent implements OnInit {
  /** Boutique sélectionnée (injectée par le parent) */
  @Input() myShopData: any = {};
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

  /** Coordonnées bancaires de l’utilisateur */
  bank = {
    iban: '',
    bic: '',
    bank_name: '',
    holder_name: '',
    country: ''
  };

  constructor(
    private fb: FormBuilder,
    private bookingService: BookingService,
    private userService: UserService,
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

  // ---------------------------------------
  // Cycle de vie
  // ---------------------------------------

  ngOnInit(): void {
    // Marque la section active (pour ton menu latéral)
    localStorage.setItem('menu-param', 'management');

    // Sécurise l’accès aux infos bancaires (si me ou me.bank non défini)
    this.bank = (this.me && this.me.bank) ? { ...this.me.bank } : { ...this.bank };

    // Charge les stats si la boutique est connue au démarrage
    if (this.myShopData && this.myShopData._id) {
      this.loadDashboardStats(this.myShopData._id);
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
      this.shopCopyData = { ...this.myShopData };
      if (this.myShopData?._id) {
        this.loadDashboardStats(this.myShopData._id);
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

  /** Sauvegarde des informations bancaires de l’utilisateur */
  saveBankInfo(): void {
    // Merge dans me (backend attend probablement user complet)
    if (!this.me) {
      console.warn('Utilisateur non chargé, impossible de sauver les infos bancaires.');
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), true);
      return;
    }

    this.me.bank = { ...this.bank };

    this.userService.update(this.me).subscribe({
      next: () => {
        this.showCustomToast(this.translate.instant('SUCCESS.SUBSCRIBE_SUCCESS')); // message de succès existant côté i18n
        this.closeBankModal();
      },
      error: (err: any) => {
        console.error('Erreur lors de la mise à jour des infos bancaires :', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), true);
      }
    });
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
        this.toastr.error("Impossible de démarrer l'activation des paiements.");
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
        this.toastr.error("Impossible de rafraîchir le statut Stripe.");
      }
    });
  }

}
