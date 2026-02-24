import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { ShopService } from '../../services/shop.service';
import { BookingService } from '../../services/booking.service';

// ✅ AjoutsizyGlam : toasts + i18n
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { AdminService } from '../../services/admin.service';

type BalanceStatus = 'ok' | 'unavailable' | 'error';

interface ProviderBalance {
  amount: number | null;
  currency: string | null;
  status: BalanceStatus;
  updatedAt: string | null; // ISO string
}

interface AdminBalancesResponse {
  twilio: ProviderBalance;
  bigbuy: ProviderBalance;
  openai: ProviderBalance;
}

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {
  balances: AdminBalancesResponse = {
    twilio: { amount: null, currency: null, status: 'unavailable', updatedAt: null },
    bigbuy: { amount: null, currency: null, status: 'unavailable', updatedAt: null },
    openai: { amount: null, currency: null, status: 'unavailable', updatedAt: null },
  };
  // -----------------------------
  // 📊 KPIs affichés sur le dashboard
  // -----------------------------
  totalShops: number = 20;     // Nombre total de boutiques (valeur par défaut)
  totalUsers: number = 5000;   // Nombre total d'utilisateurs (valeur par défaut)
  totalRevenue: number = 150000; // Chiffre d'affaires total généré (valeur par défaut)

  // -----------------------------
  // 🏪 Échantillon de boutiques (mock)
  // -----------------------------
  shops = [];

  // Détail d’une boutique sélectionnée (modal)
  selectedShop: any = null;

  constructor(
    private userService: UserService,
    private shopService: ShopService,
    private bookingService: BookingService,
    private adminService: AdminService,

    // ✅ InjectionsizyGlam
    private toastr: ToastrService,
    private translate: TranslateService
  ) { }

  // ------------------------------------------------------
  // ⏱️ Au chargement : sauvegarde menu + récupération KPIs
  // ------------------------------------------------------
  ngOnInit(): void {
    // Conserve l’onglet dans le menu latéral
    localStorage.setItem('menu-param', 'admin');

    // 👥 Compteur d’utilisateurs
    this.userService.getUsersCount().subscribe({
      next: (count: number) => {
        console.log("Nombre d'utilisateurs :", count);
        this.totalUsers = count;
      },
      error: (error: any) => {
        console.error("Erreur lors de la récupération du nombre d'utilisateurs :", error);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });

    // 🏪 Compteur de boutiques
    this.shopService.getShopsCount().subscribe({
      next: (count: number) => {
        this.totalShops = count;
      },
      error: (error: any) => {
        console.error("Erreur lors de la récupération du nombre de boutiques :", error);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });

    // 💶 Chiffre d’affaires global
    this.bookingService.getCACount().subscribe({
      next: (amount: number) => {
        this.totalRevenue = amount;
      },
      error: (error: any) => {
        console.error("Erreur lors de la récupération du chiffre d'affaires :", error);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });
    this.loadBalances();
  }

  // ------------------------------------------------------
  // ❌ Fermer la modale d’une boutique
  // ------------------------------------------------------
  closeModal(): void {
    this.selectedShop = null;
  }

  // ------------------------------------------------------
  // ✨ Toast d’erreur styliséizyGlam (centralisé)
  // ------------------------------------------------------
  private showCustomToast(message: string) {
    // StandardizyGlam : erreurs → toastr.error
    // Clé i18n recommandée : ERROR.GENERIC_ERROR
    this.toastr.error(message);
  }

  loadBalances(): void {
    this.adminService.getBalances().subscribe({
      next: (data) => {
        this.balances = data;
      },
      error: (err) => {
        console.error('Erreur balances admin:', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        // On laisse les valeurs par défaut (unavailable)
      }
    });
  }

  getStatusLabel(status: 'ok' | 'unavailable' | 'error'): string {
    if (status === 'ok') return 'OK';
    if (status === 'unavailable') return 'Indispo';
    return 'Erreur';
  }

  getAltLabel(status: 'ok' | 'unavailable' | 'error'): string {
    if (status === 'unavailable') return 'N/A';
    if (status === 'error') return '--';
    return '';
  }
}
