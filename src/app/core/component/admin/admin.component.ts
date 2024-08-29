import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {

  totalShops: number = 20; // Nombre total de boutiques
  totalUsers: number = 5000; // Nombre total d'utilisateurs
  totalRevenue: number = 150000; // Chiffre d'affaires total généré

  shops = [
    { name: 'Boutique 1', ville: 'Paris', revenue: 30000, reservations: 200, averageRating: 4.5 },
    { name: 'Boutique 2', ville: 'Lyon', revenue: 20000, reservations: 150, averageRating: 4.3 },
    { name: 'Boutique 3', ville: 'Marseille', revenue: 25000, reservations: 180, averageRating: 4.7 },
    // Plus de boutiques fictives...
  ];

  selectedShop: any = null;

  constructor() {}

  ngOnInit(): void {
    // Charger les données initiales si nécessaire
  }

  viewShopDetails(shop: any): void {
    // Fonctionnalité pour voir les détails d'une boutique (fictif pour le moment)
    this.selectedShop = shop;
  }

  adjustShop(shop: any): void {
    // Fonctionnalité pour ajuster une boutique (fictif pour le moment)
    this.selectedShop = shop;
  }

  closeModal(): void {
    this.selectedShop = null;
  }
}
