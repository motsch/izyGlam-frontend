import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
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
  // URL de base pour afficher les images stockées (CDN / bucket)
  imgStorageUrl: string = environment.imgStorageUrl;

  // Données UI
  filteredItems: any[] = [];
  shops: any[] = [];          // boutiques favorites chargées depuis l'API
  currentUser: any = {};
  me: any = {};

  constructor(
    private router: Router,
    private shopService: ShopService,
    public sessionService: SessionService,
    private userService: UserService,
    private translate: TranslateService,
    private toastr: ToastrService
  ) { }

  // ----------------------------------------------------
  // ⏱️ Initialisation du composant
  // ----------------------------------------------------
  ngOnInit() {
    // Nettoyage des résidus de navigation / panier
    localStorage.removeItem('shopSelected');
    localStorage.removeItem('productToBuy');
    localStorage.removeItem('selectItemFromShop');
    localStorage.removeItem('menu-param');

    // Charge la liste des favoris
    this.loadFavoriteShops();
  }
  
  // ----------------------------------------------------
  // 💖 Charge les shops favoris de l'utilisateur
  // ----------------------------------------------------
  private loadFavoriteShops() {
    this.userService.getMe().subscribe({
      next: (user) => {
        this.currentUser = user;
        console.log('Utilisateur courant (pour favoris) :', this.currentUser);

        // Si on a des favoris, on récupère les shops correspondants
        if (this.currentUser.favoriteShops && this.currentUser.favoriteShops.length > 0) {
          this.shopService.getShopsByIds(this.currentUser.favoriteShops).subscribe({
            next: (shops: any) => {
              // Marque chaque shop comme favori pour l'UI
              for (let elem of shops) {
                elem.isFavorite = true;
              }
              this.shops = shops;
            },
            error: (err) => {
              console.error('Erreur lors du chargement des shops favoris :', err);
              this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
            }
          });
        } else {
          // Aucun favori → on vide explicitement pour l’UI (état cohérent)
          this.shops = [];
        }
      },
      error: (err) => {
        console.error('Erreur lors de la récupération de l’utilisateur :', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });
  }

  // ----------------------------------------------------
  // 🔗 Navigation vers la page d’un shop
  // ----------------------------------------------------
  toShopPage(id: string) {
    this.router.navigate(['shop/' + id]);
  }

  // ----------------------------------------------------
  // ✨ Toast d’erreur stylisé IzyGlam (centralisé)
  // ----------------------------------------------------
  showCustomToast(message: string) {
    // Standard : erreurs → toastr.error
    this.toastr.error(message);
  }
}
