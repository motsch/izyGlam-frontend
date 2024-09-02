import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DrawerService } from 'src/app/core/services/drawer.service';
import { SessionService } from 'src/app/core/services/session.service';
import { ShopService } from 'src/app/core/services/shop.service';
import { environment } from 'src/environments/environment';


@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss']
})
export class FavoritesComponent implements OnInit {
  imgStorageUrl: string = environment.imgStorageUrl; // URL de stockage des images, récupérée depuis les variables d'environnement
  filteredItems: any[] = [];
  filteredItemsAdecouvrir: any[] = []; // Tableau pour stocker les éléments filtrés affichés à l'utilisateur
  filteredItemsApprecier: any[] = []; // Tableau pour stocker les éléments filtrés affichés à l'utilisateur
  filteredItemsMalin: any[] = []; // Tableau pour stocker les éléments filtrés affichés à l'utilisateur
  filteredItemsTop10: any[] = []; // Tableau pour stocker les éléments filtrés affichés à l'utilisateur
  selectedCategory: string | undefined; // Catégorie sélectionnée actuellement par l'utilisateur
  promotedShops: any[] = []; // Tableau pour stocker les boutiques promues
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
      public sessionService: SessionService
  ) {}

  // Fonction appelée à l'initialisation du composant
  ngOnInit() {
      localStorage.removeItem('shopSelected');
      localStorage.removeItem('productToBuy');
      localStorage.removeItem('selectItemFromShop');
      localStorage.removeItem('activeMenu');
      this.getLocationAndLoadShops(); // Charge les shops basés sur la localisation du client
  }

  // Récupère la localisation de l'utilisateur et charge les shops correspondants
  private getLocationAndLoadShops() {
      navigator.geolocation.getCurrentPosition((position) => {
          console.log('Latitude: ' + position.coords.latitude); // Log de la latitude pour le débogage
          console.log('Longitude: ' + position.coords.longitude); // Log de la longitude pour le débogage
          this.shopService
              .getShopsNearby(
                  position.coords.latitude,
                  position.coords.longitude
              )
              .subscribe((shops: any[]) => {
                  console.log(JSON.stringify(shops)); // Log des données pour le débogage
                  this.shops = shops;
                  // this.filteredItems =  this.shuffleArray(shops); // Initialise les éléments filtrés avec tous les shops récupérés
                  // URL de stockage des images, récupérée depuis les variables d'environnement
                  this.filteredItemsAdecouvrir = this.shuffleArray(shops); // Tableau pour stocker les éléments filtrés affichés à l'utilisateur
                  this.filteredItemsApprecier = this.shuffleArray(shops); // Tableau pour stocker les éléments filtrés affichés à l'utilisateur
                  this.filteredItemsMalin = this.shuffleArray(shops); // Tableau pour stocker les éléments filtrés affichés à l'utilisateur
                  this.filteredItemsTop10 = this.shuffleArray(shops);
                  this.promotedShops = shops.filter(
                      (x: any) => x.promo.active === true
                  ); // Filtre les shops promus
              });
      });
  }

  shuffleArray<T>(array: T[]): T[] {
      // Création d'une copie du tableau pour ne pas modifier l'original
      let shuffledArray = array.slice();

      // Algorithme de Fisher-Yates
      for (let i = shuffledArray.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffledArray[i], shuffledArray[j]] = [
              shuffledArray[j],
              shuffledArray[i],
          ];
      }

      return shuffledArray;
  }

  // Fonctions pour gérer le défilement horizontal des différents conteneurs
  scrollLeft(type: string) {
      switch (type) {
          case 'category':
              this.scrollContainerCategory!.nativeElement.scrollBy({
                  left: -this.calculateScrollAmount(),
                  behavior: 'smooth',
              });
              break;
          case 'around':
              this.scrollContainerAround!.nativeElement.scrollBy({
                  left: -this.calculateScrollAmount(),
                  behavior: 'smooth',
              });
              break;
          case 'promo':
              this.scrollContainerPromo!.nativeElement.scrollBy({
                  left: -this.calculateScrollAmount(),
                  behavior: 'smooth',
              });
              break;
          case 'top10':
              this.scrollContainerTop10!.nativeElement.scrollBy({
                  left: -this.calculateScrollAmount(),
                  behavior: 'smooth',
              });
              break;
      }
  }

  scrollRight(type: string) {
      switch (type) {
          case 'category':
              this.scrollContainerCategory!.nativeElement.scrollBy({
                  left: this.calculateScrollAmount(),
                  behavior: 'smooth',
              });
              break;
          case 'around':
              this.scrollContainerAround!.nativeElement.scrollBy({
                  left: this.calculateScrollAmount(),
                  behavior: 'smooth',
              });
              break;
          case 'promo':
              this.scrollContainerPromo!.nativeElement.scrollBy({
                  left: this.calculateScrollAmount(),
                  behavior: 'smooth',
              });
              break;
          case 'top10':
              this.scrollContainerTop10!.nativeElement.scrollBy({
                  left: this.calculateScrollAmount(),
                  behavior: 'smooth',
              });
              break;
      }
  }

  // Calcule la quantité de défilement basée sur une estimation de la taille d'un 'app-card' et sa marge
  private calculateScrollAmount(): number {
      return (300 + 20) * 4; // 300px par carte plus 20px de marge, multiplié par 4 cartes
  }

  // Redirige vers la page d'une boutique spécifique
  toShopPage(id: string) {
      this.router.navigate(['shop/' + id]); // Navigation programmée vers la page du shop
  }
}
