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
import { CountryService } from 'src/app/core/services/country.service';
import { DrawerService } from 'src/app/core/services/drawer.service';
import { SeoService } from 'src/app/core/services/seo.service';

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
  countries: any[] = [];

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
  selectedCountry: any = {};
  selectedCity: any = '';
  selectedArrondissement = '';
  availableCountries = ['France'];
  availableCities: any[] = [];
  postalCode: string = '';
  pubActivated: boolean = false;
  promoActivated: boolean = false;

  // ✅ NEW : mode de prestation
  serviceMode: 'SALON' | 'DOMICILE' = 'SALON';

  get isSalonMode(): boolean {
    return this.serviceMode === 'SALON';
  }


  private shopsSub?: Subscription;
  private shopsReqId = 0;
  private searchSubject = new Subject<string>();
  private subscription!: Subscription;
  loading = false;
  count = 0;

  private readonly DEFAULT_ADDRESSES = [
    {
      street: "1 Rue de Rivoli",
      city: "Paris",
      code_postal: "75001",
      country: "France",
      floor: "",
      main: true,
    },
    {
      street: "1 Avenue de Wagram",
      city: "Paris",
      code_postal: "75017",
      country: "France",
      floor: "",
      main: false,
    },
  ];


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
    private countryService: CountryService,
    private adminService: AdminService,
    private drawerService: DrawerService,
    private seoService: SeoService
  ) { }

  // ---------------------------------------------------
  // ⏱️ Initialisation : auth, paramètres, data, géoloc
  // ---------------------------------------------------
  ngOnInit() {
    this.seoService.updateMeta('main');
    // 🔐 Redirection si non connecté
    /*if (!this.sessionService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }*/
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

    this.shopService
      .searchShopsWithServicesByMode(
        this.selectedPostalCode,
        query,
        this.serviceMode,
        this.me ? this.me.country : 'France'
      )
      .subscribe({
        next: (results) => {
          this.filteredSearchResults = results;
        },
        error: (err) => {
          console.error('Erreur recherche shops/services :', err);
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
        this.sharedService.updateMe(this.me);
        this.getCountries();

        // Nettoyage localStorage
        localStorage.removeItem('shopSelected');
        localStorage.removeItem('productToBuy');
        localStorage.removeItem('selectItemFromShop');
        localStorage.removeItem('menu-param');

        // ✅ Initialisation adresses (connecté)
        this.initAddressesFromUser(data);

        // Chargement des catégories & shops selon le code postal sélectionné
        this.loadCategories();
        this.loadShops();
      },
      error: (err) => {
        console.error('Erreur lors du chargement de l’utilisateur et des shops :', err);

        // ✅ Mode non connecté : on ne bloque pas la page
        this.me = null;
        this.sharedService.updateMe(null);

        // ✅ Initialise les adresses par défaut (75001 / 75017)
        this.initAddressesFromUser(null);

        // Tu peux garder getCountries si nécessaire à la page même sans user
        this.getCountries();

        // Chargement quand même
        this.loadCategories();
        this.loadShops();

        // Option : toast plus doux (pas une "erreur", juste non connecté)
        // this.showCustomToast(this.translate.instant('INFO.NOT_LOGGED_IN'));
        // ou rien du tout
      }
    });
  }


  private initAddressesFromUser(data: any | null) {
    // ✅ Gestion des adresses (connecté ou non)
    const addresses = (data?.address && data.address.length > 0)
      ? data.address
      : this.DEFAULT_ADDRESSES;

    this.userAddresses = addresses;

    // Construit displayedAddresses selon TA logique existante
    this.refreshDisplayedAddresses();

    // selectedAddress : si déjà sélectionnée, on la garde, sinon main, sinon première
    if (!this.selectedAddress) {
      this.selectedAddress =
        this.displayedAddresses.find((a: any) => a.main) ||
        this.displayedAddresses[0] ||
        this.userAddresses[0] ||
        null;
    }

    // Liste des CP dispos
    this.availablePostalCodes = this.userAddresses
      .map((a: any) => a.code_postal)
      .filter(Boolean);

    // selectedPostalCode : priorité à l’adresse sélectionnée, sinon premier CP
    if (this.selectedAddress?.code_postal) {
      this.selectedPostalCode = this.selectedAddress.code_postal;
    } else if (this.availablePostalCodes.length > 0) {
      this.selectedPostalCode = this.availablePostalCodes[0];
    }
  }


  /** 🔎 Recherche pays par name ou par translation (insensible à la casse) */
  private findCountryByNameOrTranslation(raw: string): any | undefined {
    const norm = raw.trim().toLowerCase();
    return this.countries.find(
      (c) => c.name?.toLowerCase() === norm || c.translation?.toLowerCase() === norm
    );
  }

  // ---------------------------------------------------
  // 🌍 Sélecteurs pays / ville / CP
  // ---------------------------------------------------
  onCountryChange() {
    this.postalCode = '';
    this.availableCities = [];
    this.selectedCity = {};
  }


  // ------------------------------------------------------
  // 🗺️ Charger les pays actifs, sélectionner le pays stocké, charger ses langues
  // ------------------------------------------------------
  getCountries(): void {
    this.countryService.getAll({ active: true }).subscribe({
      next: (countries: any[]) => {
        this.countries = countries || [];
        this.availableCountries = countries;
        // Lecture du localStorage (on stocke le *name* du pays)
        let storedCountry = this.me ? (this.me.country || '').replace(/^"(.*)"$/, '$1').trim() : "France";
        if (!storedCountry) storedCountry = 'France';

        // On tente de retrouver par name ou translation (case-insensitive)
        this.selectedCountry = this.findCountryByNameOrTranslation(storedCountry);
        console.log("selectedCountry : " + JSON.stringify(this.selectedCountry))
        // Fallback France / 1er pays dispo
        if (!this.selectedCountry) {
          this.selectedCountry =
            this.findCountryByNameOrTranslation('France') || this.countries[0] || null;
        }

        // Appliquer côté session + charger les langues
        if (this.selectedCountry) {
          this.sessionService.setCountry(this.selectedCountry.name);
        } else {
          console.error('Country not found for name:', storedCountry);
        }
      },
      error: (err) => {
        console.error('Erreur lors du chargement des pays', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      },
    });
  }

  onPostalCodeEntered() {
    if (!this.postalCode || this.postalCode.length < 4) return;
    this.villeService
      .getByPostalCode(this.postalCode, this.me.country)
      .subscribe({
        next: (cities: any[]) => {
          this.availableCities = cities;
          this.newAddress.code_postal = this.postalCode;

          if (cities.length === 1) {
            this.selectedCity = cities[0];
          } else if (cities.length === 0) {
            this.showCustomToast(this.translate.instant('ERROR.NO_CITIES'));
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
      .getAvailableCategories(undefined, undefined, this.selectedPostalCode ? [this.selectedPostalCode] : ["75001"], this.me ? this.me.country : "France")
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

  // Helper générique : garde un seul shop par _id (le dernier rencontré "gagne")
  private uniqById<T extends { _id?: string }>(items: T[]): T[] {
    const map = new Map<string, T>();
    for (const it of items || []) {
      if (!it || !it._id) continue;
      // Si le même _id revient avec des props différentes, on fusionne en
      // privilégiant les dernières valeurs (celles de la catégorie la plus récente).
      map.set(it._id, { ...(map.get(it._id) || {}), ...it });
    }
    return Array.from(map.values());
  }

  // ---------------------------------------------------
  // 🏪 Charge les shops pour le CP sélectionné (sans doublons)
  // ---------------------------------------------------
  private loadShops() {
    // Annule l'abonnement précédent (évite les chevauchements)
    this.shopsSub?.unsubscribe();
    // ID de requête pour ignorer les réponses obsolètes
    const reqId = ++this.shopsReqId;
    this.loading = true;
    this.cancelFilter();
    this.categoryTrad = '';
    // Reset immédiat (évite affichage d'anciennes données)
    this.shops = [];
    this.filteredItemsAdecouvrir = [];
    this.filteredItemsApprecier = [];
    this.filteredItemsMalin = [];
    this.filteredItemsTop10 = [];
    this.promotedShops = [];

    this.shopsSub = this.shopService
      .getShopsByPostalCodesWithCategories(
        this.selectedPostalCode ? [this.selectedPostalCode] : ["75001"],
        this.serviceMode,
        this.me ? this.me.country : "France"
      )
      .subscribe({
        next: (categories: any) => {
          if (reqId !== this.shopsReqId) return;

          const favoriteShops: string[] = this.me ? this.me.favoriteShops || [] : [];

          const mapIsFavorite = (arr: any[]) =>
            arr.map((s: any) => ({ ...s, isFavorite: favoriteShops.includes(s._id) }));

          const adecouvrir = mapIsFavorite(this.uniqById(categories?.discover || []));
          const apprecier = mapIsFavorite(this.uniqById(categories?.appreciated || []));
          const malin = mapIsFavorite(this.uniqById(categories?.smart || []));
          const top10 = mapIsFavorite(this.uniqById(categories?.top10 || []));

          this.filteredItemsAdecouvrir = adecouvrir;
          this.filteredItemsApprecier = apprecier;
          this.filteredItemsMalin = malin;
          this.filteredItemsTop10 = top10;

          this.shops = this.uniqById([...adecouvrir, ...apprecier, ...malin, ...top10])
            .sort((a: any, b: any) => {
              const aTotal = Number(a?.stats?.bookings?.finished?.total ?? 0);
              const bTotal = Number(b?.stats?.bookings?.finished?.total ?? 0);
              return bTotal - aTotal;
            });

          this.promotedShops = this.uniqById(
            this.shops.filter((x: any) => x?.promo?.active === true)
          );

          this.loading = false;
        },
        error: (err) => {
          if (reqId !== this.shopsReqId) return;
          console.error('Erreur shops par CP + mode :', err);
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
          this.loading = false;
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


  // -------------------------------------------------
  // Scroll horizontal
  // -------------------------------------------------
  scrollLeftCategory(): void {
    try {
      const container = this.scrollContainerCategory?.nativeElement;
      container?.scrollBy({ left: -300, behavior: 'smooth' });
    } catch (err) {
      console.error('Erreur scrollLeft:', err);
    }
  }

  scrollRightCategory(): void {
    try {
      const container = this.scrollContainerCategory?.nativeElement;
      container?.scrollBy({ left: 300, behavior: 'smooth' });
    } catch (err) {
      console.error('Erreur scrollRight:', err);
    }
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
    this.newAddress.country = this.selectedCountry.name;

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
      v => v.pays === this.selectedCountry.name && v.city === this.selectedCity.nom
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
        v.pays === this.selectedCountry.name &&
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

  toggleServiceMode(next: 'SALON' | 'DOMICILE') {
    if (this.serviceMode === next) return;

    this.serviceMode = next;

    // Reset UI liés aux shops
    this.searchQuery = '';
    this.filteredSearchResults = [];
    this.cancelFilter();
    this.categoryTrad = '';

    // Reload data avec le mode
    this.loadCategories();
    this.loadShops();
  }
}
