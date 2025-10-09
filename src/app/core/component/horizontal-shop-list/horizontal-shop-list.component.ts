import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  ViewChild,
  OnDestroy
} from '@angular/core';
import { AdvertisementService } from '../../services/advertisement.service';
import { environment } from 'src/environments/environment';
import { MqttService } from '../../services/mqtt.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-horizontal-shop-list',
  templateUrl: './horizontal-shop-list.component.html',
  styleUrls: ['./horizontal-shop-list.component.scss']
})
export class HorizontalShopListComponent implements OnChanges, OnDestroy {
  @Input() subtitle: string = '';
  /** Titre affiché au-dessus du carrousel */
  @Input() title: string = '';
  /** Liste des shops à afficher */
  @Input() shops: any[] = [];
  /** User courant (si besoin de personnaliser) */
  @Input() me: any;
  /** Index de départ pour l’injection des pubs (chaines "0", "1", …) */
  @Input() pubIndexe: string = '1';
  /** Active/désactive l’injection des pubs CLASSIC */
  @Input() pubActivated: boolean = false;

  /** Base URL de stockage des images (API) */
  imgStorageUrl: string = environment.APIimgStorageUrl;

  /** Conteneur scrollable pour le carrousel */
  @ViewChild('scrollContainerAds') scrollContainer!: ElementRef;

  /** Publicités disponibles (CLASSIC) */
  advertisements: any[] = [];
  /** Items intercalés (shops + pubs) pour l’affichage */
  displayItems: Array<{ type: 'shop' | 'ad'; data: any }> = [];

  /** Suivi de chargement des shops (skeleton) */
  loadedShops: Record<string, boolean> = {};
  /** Temps d’affichage cumulé par élément (id) */
  displayTimes: Record<string, number> = {};
  /** IDs des intervalles actifs par élément */
  displayIntervals: Record<string, number> = {};
  /** Déjà vu (impression déjà envoyée) */
  alreadySeen: Record<string, boolean> = {};

  /** Observer conservé pour un cleanup propre */
  private listObserver: IntersectionObserver | null = null;

  constructor(
    private adService: AdvertisementService,
    private mqttService: MqttService,
    private translate: TranslateService,
    private toastr: ToastrService
  ) {}

  // -------------------------------------------------
  // Lifecycle
  // -------------------------------------------------
  ngOnChanges(): void {
    try {
      // Reset du state visuel des shops
      if (Array.isArray(this.shops)) {
        this.loadedShops = {};
        this.shops.forEach((shop) => {
          if (shop && shop._id) this.loadedShops[shop._id] = false;
        });
      }

      // Si les pubs sont activées → charge puis injecte
      // Sinon on n’affiche que les shops
      if (this.pubActivated) {
        this.getAds();
      } else {
        this.advertisements = [];
        this.injectAdsIntoShops(); // injectAdsIntoShops gère l’absence de pubs
      }
    } catch (err) {
      console.error('[HorizontalShopList] ngOnChanges error:', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), true);
    }
  }

  ngOnDestroy(): void {
    // 🧹 À la destruction : on envoie les temps restants, coupe tous les intervals,
    // et débranche l’observer pour éviter les fuites mémoire.
    try {
      Object.keys(this.displayIntervals).forEach((id) => {
        const timeSpent = this.displayTimes[id] || 0;
        if (timeSpent > 0) {
          this.sendDisplayTimeToBackend(id, timeSpent);
        }
        clearInterval(this.displayIntervals[id]);
        delete this.displayIntervals[id];
        delete this.displayTimes[id];
      });

      if (this.listObserver) {
        this.listObserver.disconnect();
        this.listObserver = null;
      }
    } catch (err) {
      console.warn('[HorizontalShopList] cleanup error:', err);
    }
  }

  // -------------------------------------------------
  // Publicités (CLASSIC)
  // -------------------------------------------------
  /**
   * Récupère les publicités CLASSIC toujours valides et lance l’injection.
   */
  getAds(): void {
    try {
      this.adService.getAdvertisements('CLASSIC').subscribe({
        next: (ads: any[]) => {
          console.log('📢 Publicités récupérées :', ads);

          // Filtrer sur la date d’expiration (pubs valides)
          const now = new Date();
          const validAds = (Array.isArray(ads) ? ads : []).filter(
            (ad) => new Date(ad?.date_expiration) > now
          );

          // Équilibrage (moins affichées / moins de temps / meilleur taux)
          this.advertisements = this.balanceAds(validAds);

          // Construit la liste finale (shops + pubs)
          this.injectAdsIntoShops();
        },
        error: (err) => {
          console.error('Erreur lors du chargement des publicités :', err);
          // On n’empêche pas l’affichage des shops si pubs HS
          this.advertisements = [];
          this.injectAdsIntoShops();
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), true);
        }
      });
    } catch (err) {
      console.error('Erreur inattendue dans getAds():', err);
      this.advertisements = [];
      this.injectAdsIntoShops();
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), true);
    }
  }

  /**
   * Trie les pubs pour équilibrer la diffusion :
   * 1) moins d’affichages valides,
   * 2) moins de temps d’affichage,
   * 3) meilleur taux de conversion.
   */
  balanceAds(ads: any[]): any[] {
    try {
      const copy = [...(ads || [])];
      return copy.sort((a, b) => {
        const aNA = a?.nombre_affichages_valides ?? 0;
        const bNA = b?.nombre_affichages_valides ?? 0;
        if (aNA !== bNA) return aNA - bNA;

        const aTime = a?.temps_affichage_total ?? 0;
        const bTime = b?.temps_affichage_total ?? 0;
        if (aTime !== bTime) return aTime - bTime;

        const aConv = a?.taux_conversion ?? 0;
        const bConv = b?.taux_conversion ?? 0;
        return bConv - aConv;
      });
    } catch (err) {
      console.error('Erreur dans balanceAds():', err);
      return ads || [];
    }
  }

  /**
   * Intercale des pubs tous les “interval” éléments, à partir de “startIndex”.
   * Si aucune pub, on n’insère que les shops.
   */
  injectAdsIntoShops(): void {
    try {
      const startIndex = Number.isFinite(parseInt(this.pubIndexe, 10))
        ? parseInt(this.pubIndexe, 10)
        : 0;
      const interval = 5; // tous les 5 éléments
      this.displayItems = [];

      let adIndex = 0;
      const adsAvailable = this.pubActivated && this.advertisements.length > 0;

      for (let i = 0; i < (this.shops?.length || 0); i++) {
        // Placement des pubs en respectant startIndex/interval
        if (
          adsAvailable &&
          (i - startIndex) % interval === 0 &&
          (i - startIndex) >= 0
        ) {
          const adToShowIndex =
            (adIndex + startIndex) % this.advertisements.length;
          this.displayItems.push({
            type: 'ad',
            data: this.advertisements[adToShowIndex]
          });
          adIndex++;
        }

        // Ajout du shop
        this.displayItems.push({ type: 'shop', data: this.shops[i] });
      }

      console.log('🧪 displayItems après injection :', this.displayItems);

      // Démarre l’observer après rendu DOM
      setTimeout(() => {
        console.log('🚀 Activation du tracking après affichage des pubs/shops.');
        this.trackImpressions();
      }, 500);
    } catch (err) {
      console.error('Erreur dans injectAdsIntoShops():', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), true);
    }
  }

  // -------------------------------------------------
  // Chargement images (skeleton)
  // -------------------------------------------------
  onShopLoaded(shopId: string): void {
    if (shopId) {
      this.loadedShops[shopId] = true;
    }
  }

  // -------------------------------------------------
  // Scroll horizontal
  // -------------------------------------------------
  scrollLeft(): void {
    try {
      const container = this.scrollContainer?.nativeElement;
      container?.scrollBy({ left: -300, behavior: 'smooth' });
    } catch (err) {
      console.error('Erreur scrollLeft:', err);
    }
  }

  scrollRight(): void {
    try {
      const container = this.scrollContainer?.nativeElement;
      container?.scrollBy({ left: 300, behavior: 'smooth' });
    } catch (err) {
      console.error('Erreur scrollRight:', err);
    }
  }

  // -------------------------------------------------
  // Tracking : impressions & temps d’affichage
  // -------------------------------------------------
  /**
   * Met en place un IntersectionObserver pour :
   *  - envoyer une impression quand l’item est >= 70% visible,
   *  - démarrer/stopper le timer d’affichage.
   * Nécessite que chaque item ait les attributs data-type (shop|pub) et data-pub-id.
   */
  trackImpressions(): void {
    try {
      console.log("🔍 Initialisation de l'observateur d'impressions...");

      // Reset observer si réinvoqué
      if (this.listObserver) {
        this.listObserver.disconnect();
        this.listObserver = null;
      }

      this.listObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const el = entry.target as HTMLElement;
            const id = el.getAttribute('data-pub-id') || '';
            const type = el.getAttribute('data-type'); // 'shop' | 'pub'
            const ratio = entry.intersectionRatio;

            if (!id || !type) return;

            if (entry.isIntersecting && ratio >= 0.7) {
              // Impression + démarrage timer
              if (!this.alreadySeen[id]) {
                this.alreadySeen[id] = true;
                this.incrementImpression(id, type);
              }
              this.startTrackingDisplayTime(id, type);
            } else {
              // Arrêt du timer si l’élément sort
              this.stopTrackingDisplayTime(id, type);
            }
          });
        },
        { threshold: [0.7] }
      );

      // Cible tous les éléments trackables
      setTimeout(() => {
        const host = this.scrollContainer?.nativeElement;
        const items: NodeListOf<Element> | null = host
          ? host.querySelectorAll('[data-pub-id]')
          : null;

        if (!items || items.length === 0) {
          console.log('❌ Aucune pub/shop détectée dans le DOM !');
          return;
        }

        console.log(`✅ ${items.length} éléments détectés pour le tracking.`);
        items.forEach((el) => this.listObserver?.observe(el));
      }, 500);
    } catch (err) {
      console.error('Erreur dans trackImpressions():', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), true);
    }
  }

  /**
   * Émet une impression en MQTT sur le topic adéquat.
   */
  incrementImpression(id: string, type: string | null): void {
    try {
      console.log(`📢 Impression détectée pour ${type} ${id}`);
      const payload = {
        id,
        timestamp: new Date().toISOString()
      };

      if (type === 'shop') {
        // Impression d’un shop
        this.mqttService.publish('shop/impression', payload);
      } else if (type === 'pub') {
        // Impression d’une publicité
        this.mqttService.publish('pub/impression', payload);
      }
    } catch (err) {
      console.error('Erreur dans incrementImpression():', err);
    }
  }

  /**
   * Démarre un timer (1s) pour cumuler le temps d’affichage d’un item.
   */
  startTrackingDisplayTime(id: string, _type: string | null): void {
    try {
      if (!this.displayTimes[id]) this.displayTimes[id] = 0;
      // évite les doublons d’intervalle
      if (this.displayIntervals[id]) return;

      const intervalId = window.setInterval(() => {
        this.displayTimes[id] = (this.displayTimes[id] ?? 0) + 1;
      }, 1000);

      this.displayIntervals[id] = intervalId;
    } catch (err) {
      console.error('Erreur dans startTrackingDisplayTime():', err);
    }
  }

  /**
   * Stoppe le timer et envoie le temps au backend (via MQTT).
   */
  stopTrackingDisplayTime(id: string, _type: string | null): void {
    try {
      const intervalId = this.displayIntervals[id];
      if (!intervalId) return;

      console.log(`🛑 Fin de visibilité détectée pour ${_type} ${id}`);
      clearInterval(intervalId);
      delete this.displayIntervals[id];

      const timeSpent = this.displayTimes[id] || 0;
      if (timeSpent > 0) {
        this.sendDisplayTimeToBackend(id, timeSpent);
      }
      delete this.displayTimes[id];
    } catch (err) {
      console.error('Erreur dans stopTrackingDisplayTime():', err);
    }
  }

  /**
   * Envoie le temps d’affichage (seconds) via MQTT pour traitement backend.
   */
  sendDisplayTimeToBackend(pubId: string, timeSpent: number): void {
    try {
      const payload = {
        _id: pubId,
        timeSpent
      };
      // Topic générique côté shop/display (à adapter si nécessaire)
      this.mqttService.publish('shop/display', payload);
    } catch (err) {
      console.error('Erreur dans sendDisplayTimeToBackend():', err);
    }
  }

  // -------------------------------------------------
  // Click tracking sur pub
  // -------------------------------------------------
  onAdClick(ad: any): void {
    try {
      if (!ad?._id) return;
      this.adService.incrementClick(ad._id).subscribe({
        next: () => {
          // rien de spécial à faire ici
        },
        error: (err) => {
          console.error('Erreur lors de l’incrément du clic pub :', err);
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), true);
        }
      });
    } catch (err) {
      console.error('Erreur inattendue dans onAdClick():', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), true);
    }
  }

  // -------------------------------------------------
  // Toast unifié succès/erreur
  // -------------------------------------------------
  /**
   * Affiche un toast unifié avec ngx-toastr.
   * @param message (déjà traduit) – mettre les textes dans SUCCESS.* ou ERROR.* au niveau i18n
   * @param isError true => erreur | false => succès
   */
  private showCustomToast(message: string, isError: boolean = false): void {
    if (isError) {
      this.toastr.error(message);
    } else {
      this.toastr.success(message);
    }
  }
}
