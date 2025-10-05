import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { ShopService } from '../../services/shop.service';
import { BookingService } from '../../services/booking.service';

// ✅ Ajouts IzyGlam : toasts + i18n
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {

  // -----------------------------
  // 📊 KPIs affichés sur le dashboard
  // -----------------------------
  totalShops: number = 20;     // Nombre total de boutiques (valeur par défaut)
  totalUsers: number = 5000;   // Nombre total d'utilisateurs (valeur par défaut)
  totalRevenue: number = 150000; // Chiffre d'affaires total généré (valeur par défaut)

  // -----------------------------
  // 🏪 Échantillon de boutiques (mock)
  // -----------------------------
  shops = [
    { name: 'Boutique 1', ville: 'Paris', revenue: 30000, reservations: 200, averageRating: 4.5 },
    { name: 'Boutique 2', ville: 'Lyon', revenue: 20000, reservations: 150, averageRating: 4.3 },
    { name: 'Boutique 3', ville: 'Marseille', revenue: 25000, reservations: 180, averageRating: 4.7 },
    // Plus de boutiques fictives...
  ];

  // Détail d’une boutique sélectionnée (modal)
  selectedShop: any = null;

  constructor(
    private userService: UserService,
    private shopService: ShopService,
    private bookingService: BookingService,

    // ✅ Injections IzyGlam
    private toastr: ToastrService,
    private translate: TranslateService
  ) {}

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
  }
  
  // ------------------------------------------------------
  // ❌ Fermer la modale d’une boutique
  // ------------------------------------------------------
  closeModal(): void {
    this.selectedShop = null;
  }

  // ------------------------------------------------------
  // ✨ Toast d’erreur stylisé IzyGlam (centralisé)
  // ------------------------------------------------------
  private showCustomToast(message: string) {
    // Standard IzyGlam : erreurs → toastr.error
    // Clé i18n recommandée : ERROR.GENERIC_ERROR
    this.toastr.error(message);
  }
}
