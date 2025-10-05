import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CategoryService } from 'src/app/core/services/category.service';
import { SessionService } from 'src/app/core/services/session.service';
import { SharedService } from 'src/app/core/services/shared.service';
import { ShopService } from 'src/app/core/services/shop.service';
import { UserService } from 'src/app/core/services/user.service';
import { environment } from 'src/environments/environment';
import { Router } from '@angular/router';
import { AdvertisementService } from 'src/app/core/services/advertisement.service';
import { FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import { MqttService } from 'src/app/core/services/mqtt.service';
import { VilleService } from 'src/app/core/services/ville.service';
import { AdminService } from 'src/app/core/services/admin.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
})
export class MainComponent implements OnInit, AfterViewInit {
  me: any = {};
  imgStorageUrl: string = environment.imgStorageUrl;

  // --- GEO SAFE MODE ---
  geolocationAvailable = false;      // vrai si l’app a le droit + peut lire une position
  locationCheckDone = false;         // pour éviter tout "blocage" UI pendant la détection
  locationError: string = '';        // message informatif (non bloquant)
  // ----------------------

  filteredItems: any[] = [];
  filteredItemsAdecouvrir: any[] = [];
  filteredItemsApprecier: any[] = [];
  filteredItemsMalin: any[] = [];
  filteredItemsTop10: any[] = [];
  selectedCategory: string | undefined;
  filterClicked = false;
  promotedShops: any[] = [];
  categoriesFilter: any[] = [];
  showAddressModal: boolean = false;
  shops: any[] = [];
  searchQuery: string = '';
  searchActive: boolean = false;
  filteredSearchResults: any[] = [];

  // Sélection adresse / code postal
  selectedPostalCode: string = '75001';
  availablePostalCodes: string[] = ['75001'];
  userAddresses: any[] = [];
  displayedAddresses: any[] = []; // <- liste réellement affichée (sans "Ma position" si géoloc OFF)
  selectedAddress: any = null;

  allCitiesData: any[] = []; // on stocke ici toutes les villes brutes
  searchControl = new FormControl('');
  categoryTrad: string = '';
  availableArrondissements: string[] = []; // liste filtrée d'arrondissements (name) pour une ville
  isAddingAddress = false;
  newAddress: any = {};
  selectedCountry = 'France';
  selectedCity: any = '';
  selectedArrondissement = '';
  availableCountries = ['France'];
  availableCities: any[] = [];
  postalCode: string = '';
  pubActivated: boolean = false;
  promoActivated: boolean = false;

  private searchSubject = new Subject<string>();
  private subscription!: Subscription;
  loading = false;

  @ViewChild('scrollContainerCategory') private scrollContainerCategory?: ElementRef;
  @ViewChild('scrollContainerDiscover') private scrollContainerDiscover?: ElementRef;
  @ViewChild('scrollContainerAround') private scrollContainerAround?: ElementRef;
  @ViewChild('scrollContainerPromo') private scrollContainerPromo?: ElementRef;
  @ViewChild('scrollContainerTop10') private scrollContainerTop10?: ElementRef;
  @ViewChild('scrollContainerSmart') private scrollContainerSmart?: ElementRef;

  constructor(
    private sharedService: SharedService,
    private shopService: ShopService,
    public sessionService: SessionService,
    private villeService: VilleService,
    private categoryService: CategoryService,
    private userService: UserService,
    private router: Router,
    private advertisementService: AdvertisementService,
    private mqttService: MqttService,
    private cd: ChangeDetectorRef,
    private toastr: ToastrService,
    private translate: TranslateService,
    private adminService: AdminService
  ) { }

  // ---------------------------------------------------
  // ⏱️ Initialisation : auth, paramètres, data, géoloc
  // ---------------------------------------------------
  ngOnInit() {
    // 🔐 Redirection si non connecté
    if (!this.sessionService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    this.loading = true;

    // 🔎 Recherche globale (non bloquante)
    this.subscription = this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((query) => this.performSearch(query));

    // ⚙️ Paramètres plateforme
    this.adminService.getAdminSettings().subscribe({
      next: (data: any) => {
        this.pubActivated = data.pubActivated;
        this.promoActivated = data.promoActivated;
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des paramètres :', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });

    // 🚀 On charge l’utilisateur + les shops PAR CODE POSTAL (indépendant de la géoloc)
    this.loadUserAndShops();

    // 🧭 On vérifie la géolocalisation EN ARRIÈRE-PLAN (non bloquant)
    this.checkGeolocationAvailability();
  }

  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();
  }

  // ================================================
  // 🌍 GÉOLOCALISATION : détection non bloquante
  // ================================================
  private async checkGeolocationAvailability() {
    try {
      // 1) Permissions API (si dispo) – rapide
      // @ts-ignore
      if (navigator?.permissions?.query) {
        // @ts-ignore
        const status = await navigator.permissions.query({ name: 'geolocation' });
        if (status.state === 'denied') {
          this.geolocationAvailable = false;
          this.locationError = 'La géolocalisation est désactivée par le navigateur.';
          this.locationCheckDone = true;
          this.refreshDisplayedAddresses();
          return;
        }
      }

      // 2) Tentative ultra-courte pour savoir si on peut obtenir une position
      await new Promise<void>((resolve, reject) => {
        if (!navigator?.geolocation) {
          reject(new Error('API geolocation indisponible'));
          return;
        }
        const onSuccess = () => resolve();
        const onError = () => reject(new Error('Refus ou indisponible'));

        navigator.geolocation.getCurrentPosition(
          onSuccess,
          onError,
          { enableHighAccuracy: false, timeout: 1500, maximumAge: 600000 }
        );
      });

      this.geolocationAvailable = true;
      this.locationError = '';
    } catch (e: any) {
      this.geolocationAvailable = false;
      this.locationError = 'Géolocalisation non autorisée. Utilisez le code postal.';
    } finally {
      this.locationCheckDone = true;
      this.refreshDisplayedAddresses();
    }
  }

  // Met à jour la liste visible en fonction de la géoloc
  private refreshDisplayedAddresses() {
    const hideGeoSpecial = !this.geolocationAvailable;
    this.displayedAddresses = (this.userAddresses || []).filter((a: any) => {
      // On masque l'entrée spéciale "Ma position" si géoloc OFF
      const isMyPosition = a?.street === 'MAIN_PAGE.MA_POSITION';
      return hideGeoSpecial ? !isMyPosition : true;
    });

    // Si adresse sélectionnée n’est plus visible, on en choisit une autre
    if (this.selectedAddress && hideGeoSpecial && this.selectedAddress?.street === 'MAIN_PAGE.MA_POSITION') {
      this.selectedAddress = this.displayedAddresses[0] || null;
      if (this.selectedAddress?.code_postal) {
        this.selectedPostalCode = this.selectedAddress.code_postal;
        this.loadCategories();
        this.loadShops();
      }
    }
  }
  // === FIN GÉOLOCALISATION ===

  // ---------------------------------------------------
  // 🔎 Recherche "live" (avec Subject + debounce)
  // ---------------------------------------------------
  onSearchChange(query: string) {
    this.searchSubject.next(query);
  }

  performSearch(query: string) {
    if (!query || query.trim().length < 2) {
      this.filteredSearchResults = [];
      return;
    }
    // 🔎 Toujours par code postal -> pas dépendant de la géoloc
    this.shopService
      .searchShopsWithServices(this.selectedPostalCode, query)
      .subscribe({
        next: (results) => {
          this.filteredSearchResults = results;
        },
        error: (err) => {
          console.error('Erreur lors de la recherche de shops avec services :', err);
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        }
      });
  }

  // ---------------------------------------------------
  // 🖱️ Drag-to-scroll sur les listes horizontales
  // ---------------------------------------------------
  ngAfterViewInit(): void {
    const elements = document.querySelectorAll('.drag-scroll');
    elements.forEach((el) => {
      let isDown = false;
      let startX = 0;
      let scrollLeft = 0;

      (el as HTMLElement).addEventListener('mousedown', (event) => {
        const e = event as MouseEvent;
        isDown = true;
        (el as HTMLElement).classList.add('active-drag');
        startX = e.pageX - (el as HTMLElement).offsetLeft;
        scrollLeft = (el as HTMLElement).scrollLeft;
      });

      (el as HTMLElement).addEventListener('mouseleave', () => {
        isDown = false;
        (el as HTMLElement).classList.remove('active-drag');
      });

      (el as HTMLElement).addEventListener('mouseup', () => {
        isDown = false;
        (el as HTMLElement).classList.remove('active-drag');
      });

      (el as HTMLElement).addEventListener('mousemove', (event) => {
        const e = event as MouseEvent;
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - (el as HTMLElement).offsetLeft;
        const walk = (x - startX) * 1.2; // ajustable
        (el as HTMLElement).scrollLeft = scrollLeft - walk;
      });
    });
  }

  // ---------------------------------------------------
  // 🔗 Navigation (lien interne ou externe)
  // ---------------------------------------------------
  goTo(link: string) {
    if (link.startsWith('http://') || link.startsWith('https://')) {
      window.open(link, '_blank');
    } else {
      this.router.navigateByUrl(link);
    }
  }

  // ---------------------------------------------------
  // 👤 Charge l’utilisateur puis ses shops (par CP)
  // ---------------------------------------------------
  private loadUserAndShops() {
    this.userService.getMe().subscribe({
      next: (data: any) => {
        this.me = data;
        this.sharedService.updateMe(data);

        // Nettoyage localStorage
        localStorage.removeItem('shopSelected');
        localStorage.removeItem('productToBuy');
        localStorage.removeItem('selectItemFromShop');
        localStorage.removeItem('menu-param');

        // ✅ Gestion des adresses
        if (data.address && data.address.length > 0) {
          this.userAddresses = data.address;

          // Si rien n’est sélectionné, on prend la première adresse "affichable"
          this.refreshDisplayedAddresses();

          if (!this.selectedAddress) {
            this.selectedAddress = this.displayedAddresses[0] || this.userAddresses[0];
          }

          // Liste des CP dispos
          this.availablePostalCodes = this.userAddresses
            .map((a: any) => a.code_postal)
            .filter(Boolean);

          // Force le CP courant si sélection valide
          if (this.selectedAddress?.code_postal) {
            this.selectedPostalCode = this.selectedAddress.code_postal;
          }
        } else {
          // Aucune adresse en base => on reste sur le CP par défaut (75001)
          this.userAddresses = [];
          this.displayedAddresses = [];
        }

        // Chargement des catégories & shops selon le code postal sélectionné
        this.loadCategories();
        this.loadShops();
      },
      error: (err) => {
        console.error('Erreur lors du chargement de l’utilisateur et des shops :', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });
  }

  // ---------------------------------------------------
  // 🌍 Sélecteurs pays / ville / CP
  // ---------------------------------------------------
  onCountryChange() {
    this.postalCode = '';
    this.availableCities = [];
    this.selectedCity = {};
  }

  onPostalCodeEntered() {
    if (!this.postalCode || this.postalCode.length < 4) return;
    this.villeService
      .getByPostalCode(this.postalCode, this.selectedCountry)
      .subscribe({
        next: (cities: any[]) => {
          this.availableCities = cities;
          this.newAddress.code_postal = this.postalCode;

          if (cities.length === 1) {
            this.selectedCity = cities[0];
          }
        },
        error: (err) => {
          console.error('Erreur lors de la récupération des villes par code postal :', err);
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        }
      });
  }

  // ---------------------------------------------------
  // 🗂️ Catégories disponibles pour le CP sélectionné
  // ---------------------------------------------------
  private loadCategories() {
    // On passe toujours par le code postal sélectionné (aucune dépendance à la géoloc)
    this.categoryService
      .getAvailableCategories(undefined, undefined, [this.selectedPostalCode])
      .subscribe({
        next: (data: any[]) => {
          this.categoriesFilter = data.sort((a, b) => a.position - b.position);
        },
        error: (err) => {
          console.error('Erreur lors du chargement des catégories disponibles :', err);
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        }
      });
  }

  // ---------------------------------------------------
  // 🔍 Filtre local (par nom) sur la liste des shops
  // ---------------------------------------------------
  filterShops() {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      this.filteredSearchResults = [...this.shops];
      return;
    }
    this.filteredSearchResults = this.shops.filter(shop =>
      this.normalizeText(shop.name).includes(this.normalizeText(query))
    );
  }

  normalizeText(text: string): string {
    return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  // ---------------------------------------------------
  // 🏪 Charge les shops pour le CP sélectionné
  // ---------------------------------------------------
  private loadShops() {
    this.shopService.getShopsByPostalCodes([this.selectedPostalCode]).subscribe({
      next: async (categories: any) => {
        const favoriteShops = this.me.favoriteShops || [];

        this.shops = (categories.discover || []).map((shop: any) => ({
          ...shop,
          isFavorite: favoriteShops.includes(shop._id),
        }));

        // On map chaque catégorie et on ajoute isFavorite
        this.filteredItemsAdecouvrir = (categories.discover || []).map((shop: any) => ({
          ...shop,
          isFavorite: favoriteShops.includes(shop._id),
        }));

        this.filteredItemsApprecier = (categories.appreciated || []).map((shop: any) => ({
          ...shop,
          isFavorite: favoriteShops.includes(shop._id),
        }));

        this.filteredItemsMalin = (categories.smart || []).map((shop: any) => ({
          ...shop,
          isFavorite: favoriteShops.includes(shop._id),
        }));

        this.filteredItemsTop10 = (categories.top10 || []).map((shop: any) => ({
          ...shop,
          isFavorite: favoriteShops.includes(shop._id),
        }));

        // Promo = tous shops avec promo active (peu importe la catégorie)
        this.promotedShops = [
          ...this.filteredItemsAdecouvrir,
          ...this.filteredItemsApprecier,
          ...this.filteredItemsMalin,
          ...this.filteredItemsTop10,
        ].filter((x: any) => x.promo?.active === true);

        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des shops par code postal :', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        this.loading = false; // ✅ Évite le loader infini en cas d’erreur
      }
    });
  }

  // ---------------------------------------------------
  // 🧭 Filtres de catégories (UI)
  // ---------------------------------------------------
  filterByCategory(type: string, trad: string) {
    this.categoryTrad = trad;
    if (!this.filterClicked) {
      this.selectedCategory = type;
      this.filterClicked = true;
      this.filteredItems = this.shops.filter((x: any) => x.type === type);
      return;
    }
    if (this.selectedCategory === type) {
      this.cancelFilter();
      this.categoryTrad = '';
    } else {
      this.selectedCategory = type;
      this.filteredItems = this.shops.filter((x: any) => x.type === type);
    }
  }

  cancelFilter() {
    this.selectedCategory = '';
    this.filterClicked = false;
    this.filteredItems = this.shops;
  }

  // ---------------------------------------------------
  // 🔄 Utilitaires
  // ---------------------------------------------------
  shuffleArray<T>(array: T[]): T[] {
    let shuffledArray = array.slice();
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray;
  }

  // ---------------------------------------------------
  // ↔️ Scroll horizontal des carrousels
  // ---------------------------------------------------
  scrollLeft(type: string) {
    this.scrollBy(type, -this.calculateScrollAmount());
  }
  scrollRight(type: string) {
    this.scrollBy(type, this.calculateScrollAmount());
  }
  private scrollBy(type: string, amount: number) {
    const containerMap: { [key: string]: ElementRef | undefined } = {
      category: this.scrollContainerCategory,
      discover: this.scrollContainerDiscover,
      around: this.scrollContainerAround,
      promo: this.scrollContainerPromo,
      top10: this.scrollContainerTop10,
      smart: this.scrollContainerSmart,
    };

    const container = containerMap[type];
    if (container) {
      container.nativeElement.scrollBy({
        left: amount,
        behavior: 'smooth',
      });
    }
  }
  private calculateScrollAmount(): number {
    return (300 + 20) * 4;
  }

  // ---------------------------------------------------
  // 🏠 Modal d’adresse (ouvrir/fermer/choisir)
  // ---------------------------------------------------
  openAddressModal() {
    this.showAddressModal = true;
  }
  closeAddressModal() {
    this.showAddressModal = false;
    this.isAddingAddress = false;
  }
  selectPostalCode(address: any) {
    this.selectedAddress = address;
    this.selectedPostalCode = address.code_postal;
    this.loadCategories();
    this.loadShops();
    this.closeAddressModal();
  }
  isSameAddress(a: any, b: any): boolean {
    return a?.street === b?.street && a?.city === b?.city && a?.code_postal === b?.code_postal;
  }

  // ---------------------------------------------------
  // ➕ Ajout d’adresse (saisie puis enregistrement)
  // ---------------------------------------------------
  toggleAddAddress() {
    this.isAddingAddress = !this.isAddingAddress;
  }

  // 📌 Enregistre la nouvelle adresse
  saveAddress() {
    if (!this.selectedCity || !this.newAddress.street) return;

    // Assigne city et country aux nouvelles valeurs sélectionnées
    this.newAddress.city = this.selectedCity.nom;
    this.newAddress.country = this.selectedCountry;

    if (this.newAddress.street && this.newAddress.code_postal && this.newAddress.city && this.newAddress.country) {
      const addressToAdd = { ...this.newAddress };

      // MAJ locale immédiate
      this.userAddresses.push(addressToAdd);
      this.refreshDisplayedAddresses();

      // Appel API
      this.userService.addAddress(this.me._id, addressToAdd).subscribe({
        next: (result: any) => {
          this.loadUser(); // recharge synchronisation

          // Si aucune adresse sélectionnée, on bascule sur celle qu’on vient d’ajouter
          if (!this.selectedAddress) {
            this.selectedAddress = addressToAdd;
          }

          this.selectedPostalCode = addressToAdd.code_postal;
          this.loadCategories();
          this.loadShops();
        },
        error: (err) => {
          console.error('Erreur lors de l’ajout d’une nouvelle adresse :', err);
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        }
      });

      // Reset form
      this.newAddress = { street: '', code_postal: '', city: '', country: '' };
      this.isAddingAddress = false;
    }
  }

  loadUser() {
    // ⚠️ Selon ton UserService, getMe() peut être un getter sync (cache) — on conserve le comportement d’origine
    this.me = this.userService.getMe();
    this.sharedService.updateMe(this.me);
  }

  removeAddress(index: number) {
    this.me.address.splice(index, 1);

    this.userService.update(this.me).subscribe({
      next: (result: any) => {
        // Après suppression, on recalcule la liste visible et on garantit un CP sélectionné
        this.userAddresses = this.me.address || [];
        this.refreshDisplayedAddresses();

        if (!this.selectedAddress && this.displayedAddresses[0]) {
          this.selectPostalCode(this.displayedAddresses[0]);
        }
      },
      error: (err) => {
        console.error('Erreur lors de la suppression d’une adresse :', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });
  }

  // -----------------------------------------
  // Sélecteurs pays / ville / arrondissement
  // -----------------------------------------
  onCityChange() {
    const filteredByCity = this.allCitiesData.filter(
      v => v.pays === this.selectedCountry && v.city === this.selectedCity.nom
    );
    if (filteredByCity.length > 1) {
      this.availableArrondissements = [...new Set(filteredByCity.map(v => v.name))];
      this.newAddress.code_postal = '';
    } else if (filteredByCity.length === 1) {
      const doc = filteredByCity[0];
      this.availableArrondissements = [doc.name];
      this.selectedArrondissement = doc.name;
      this.newAddress.code_postal = doc.code_postal;
    }
    this.newAddress.city = this.selectedCity.nom;
  }

  onArrondissementChange() {
    const doc = this.allCitiesData.find(
      v =>
        v.pays === this.selectedCountry &&
        v.city === this.selectedCity.nom &&
        v.name === this.selectedArrondissement
    );
    if (doc) {
      this.newAddress.code_postal = doc.code_postal;
    }
    this.newAddress.arrondissement = this.selectedArrondissement;
  }

  // ---------------------------------------------------
  // ✨ Toast d’erreur styliséizyGlam (centralisé)
  // ---------------------------------------------------
  showCustomToast(message: string) {
    // ⚠️ StandardizyGlam : pour les erreurs, on utilise toastr.error
    // Exemple clé i18n : this.translate.instant('ERROR.GENERIC_ERROR')
    this.toastr.error(message);
  }
}
