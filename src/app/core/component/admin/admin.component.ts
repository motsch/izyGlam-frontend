import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { ShopService } from '../../services/shop.service';
import { BookingService } from '../../services/booking.service';

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

  constructor(private userService: UserService, private shopService: ShopService, private bookingService: BookingService) {}

  ngOnInit(): void {
    localStorage.setItem("menu-param", 'admin');
    this.userService.getUsersCount().subscribe(
      (count:number) => {
        console.log('Nombre d\'utilisateurs :', count);
        this.totalUsers = count;
      },
      (error: any) => {
        console.error('Erreur lors de la récupération du nombre d\'utilisateurs', error);
      }
    );
    this.shopService.getShopsCount().subscribe(
      (count:number) => {
        this.totalShops = count;
      },
      (error: any) => {
        console.error('Erreur lors de la récupération du nombre de boutiques', error);
      }
    );
    this.bookingService.getCACount().subscribe(
      (count:number) => {
        this.totalRevenue = count;
      },
      (error: any) => {
        console.error('Erreur lors de la récupération du chiffre d\'affaires', error);
      }
    );
  }
  
  closeModal(): void {
    this.selectedShop = null;
  }
}
