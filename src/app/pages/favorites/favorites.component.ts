import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DrawerService } from 'src/app/core/services/drawer.service';
import { SessionService } from 'src/app/core/services/session.service';
import { ShopService } from 'src/app/core/services/shop.service';
import { UserService } from 'src/app/core/services/user.service';
import { environment } from 'src/environments/environment';


@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss']
})
export class FavoritesComponent implements OnInit {
  imgStorageUrl: string = environment.imgStorageUrl; // URL de stockage des images, récupérée depuis les variables d'environnement
  filteredItems: any[] = [];
  shops: any[] = []; // Tableau pour stocker les informations des boutiques récupérées de l'API

  // Références aux éléments du DOM pour gérer le défilement des conteneurs de contenu
  @ViewChild('scrollContainerCategory') private scrollContainerCategory:
      | ElementRef
      | undefined;
  @ViewChild('scrollContainerAround') private scrollContainerAround:
      | ElementRef
      | undefined;
  @ViewChild('scrollContainerPromo') private scrollContainerPromo:
      | ElementRef
      | undefined;
  @ViewChild('scrollContainerTop10') private scrollContainerTop10:
      | ElementRef
      | undefined;

  constructor(
      private router: Router,
      private drawerService: DrawerService,
      private shopService: ShopService,
      public sessionService: SessionService,
      private userService: UserService
  ) {}

  // Fonction appelée à l'initialisation du composant
  ngOnInit() {
      localStorage.removeItem('shopSelected');
      localStorage.removeItem('productToBuy');
      localStorage.removeItem('selectItemFromShop');
      localStorage.removeItem('activeMenu');
      // this.getLocationAndLoadShops(); // Charge les shops basés sur la localisation du client
      this.userService.getMe().subscribe({
          next: (data: any) => {
              console.log(data);
          },
          error: (error: any) => {
              console.log(error);
          },
      });
  }

  // Redirige vers la page d'une boutique spécifique
  toShopPage(id: string) {
      this.router.navigate(['shop/' + id]); // Navigation programmée vers la page du shop
  }
}
