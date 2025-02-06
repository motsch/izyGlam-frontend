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
  currentUser: any = {};
  constructor(
      private router: Router,
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

    this.loadFavoriteShops();
  }



  // Charge les shops favoris de l'utilisateur
  private loadFavoriteShops() {
    
    this.userService.getMe().subscribe((user) => {
      this.currentUser = user;
    console.log(this.currentUser);
      // Récupérer les shops par leurs IDs stockés dans les favoris
      if (this.currentUser.favoriteShops && this.currentUser.favoriteShops.length > 0) {
        this.shopService.getShopsByIds(this.currentUser.favoriteShops).subscribe((shops:any) => {
            for(let elem of shops) {
                elem.isFavorite = true;
            }
          this.shops = shops;
        });
      }
    });
  }

  // Redirige vers la page d'une boutique spécifique
  toShopPage(id: string) {
      this.router.navigate(['shop/' + id]); // Navigation programmée vers la page du shop
  }
}
