import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  ViewChild,
  AfterViewInit,
  OnDestroy
} from '@angular/core';
import { AdvertisementService } from '../../services/advertisement.service';
import { environment } from 'src/environments/environment';
import { MqttService } from '../../services/mqtt.service';

@Component({
  selector: 'app-horizontal-shop-list',
  templateUrl: './horizontal-shop-list.component.html',
  styleUrls: ['./horizontal-shop-list.component.scss']
})
export class HorizontalShopListComponent implements OnChanges, OnDestroy {
  @Input() title: string = '';
  @Input() shops: any[] = [];
  @Input() me: any;
  @Input() pubIndexe: string = "1";
  imgStorageUrl: string = environment.APIimgStorageUrl;

  @ViewChild('scrollContainerAds') scrollContainer!: ElementRef;

  advertisements: any[] = [];
  displayItems: any[] = [];
  loadedShops: { [key: string]: boolean } = {};
  displayTimes: { [key: string]: number } = {};
  displayIntervals: { [key: string]: any } = {};
  alreadySeen: { [key: string]: boolean } = {};

  constructor(
    private adService: AdvertisementService,
    private mqttService: MqttService
  ) { }

  ngOnChanges(): void {
    if (this.shops) {
      this.loadedShops = {};
      this.shops.forEach(shop => (this.loadedShops[shop._id] = false));
      this.getAds();
    }
  }

  ngOnDestroy(): void {
    // 🛑 À la destruction du composant : on envoie les temps d’affichage restants
    Object.keys(this.displayIntervals).forEach(pubId => {
      const timeSpent = this.displayTimes[pubId] || 0;
      if (timeSpent > 0) {
        this.sendDisplayTimeToBackend(pubId, timeSpent);
      }
      clearInterval(this.displayIntervals[pubId]);
      delete this.displayIntervals[pubId];
      delete this.displayTimes[pubId];
    });
  }

  getAds() {
    this.adService.getAdvertisements('CLASSIC').subscribe(ads => {
      console.log("📢 Publicités récupérées :", ads);
      this.advertisements = this.balanceAds(
        ads.filter(ad => new Date(ad.date_expiration) > new Date())
      );
      this.injectAdsIntoShops();
    });
  }

  injectAdsIntoShops() {
    const startIndex = parseInt(this.pubIndexe || '0', 10);
    const interval = 5;
    this.displayItems = [];
    let adIndex = 0;
    for (let i = 0; i < this.shops.length; i++) {
      if ((i - startIndex) % interval === 0 && (i - startIndex) >= 0 && this.advertisements.length > 0) {
        const adToShowIndex = (adIndex + startIndex) % this.advertisements.length;
        this.displayItems.push({ type: 'ad', data: this.advertisements[adToShowIndex] });
        adIndex++;
      }
      this.displayItems.push({ type: 'shop', data: this.shops[i] });
    }
    console.log('🧪 displayItems après injection :', this.displayItems);
    setTimeout(() => {
      console.log("🚀 Activation du tracking après affichage des pubs/shops.");
      this.trackImpressions();
    }, 500);
  }

  balanceAds(ads: any[]): any[] {
    return ads.sort((a, b) => {
      if (a.nombre_affichages_valides !== b.nombre_affichages_valides)
        return a.nombre_affichages_valides - b.nombre_affichages_valides;
      if (a.temps_affichage_total !== b.temps_affichage_total)
        return a.temps_affichage_total - b.temps_affichage_total;
      return b.taux_conversion - a.taux_conversion;
    });
  }

  onShopLoaded(shopId: string) {
    this.loadedShops[shopId] = true;
  }

  scrollLeft() {
    const container = this.scrollContainer.nativeElement;
    container.scrollBy({ left: -300, behavior: 'smooth' });
  }

  scrollRight() {
    const container = this.scrollContainer.nativeElement;
    container.scrollBy({ left: 300, behavior: 'smooth' });
  }

  trackImpressions() {
    console.log("🔍 Initialisation de l'observateur d'impressions...");
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const el = entry.target as HTMLElement;
          const pubId = el.getAttribute('data-pub-id');
          const type = el.getAttribute('data-type');
          const visibilityRatio = entry.intersectionRatio;
          if (pubId && entry.isIntersecting && visibilityRatio >= 0.7) {
            this.alreadySeen[pubId] = true;
            this.incrementImpression(pubId, type);
            this.startTrackingDisplayTime(pubId, type);
          } else if (pubId) {
            this.stopTrackingDisplayTime(pubId, type);
          }
        });
      }, { threshold: [0.7] }
    );
    setTimeout(() => {
      const items = this.scrollContainer?.nativeElement?.querySelectorAll('[data-pub-id]');
      if (!items || items.length === 0) {
        console.log("❌ Aucune pub/shop détectée dans le DOM !");
      } else {
        console.log(`✅ ${items.length} éléments détectés pour le tracking.`);
        items.forEach((el: any) => observer.observe(el));
      }
    }, 500);
  }

  incrementImpression(id: string, type: string | null) {
    console.log(`📢 Impression détectée pour ${type} ${id}`);
    const payload = JSON.stringify({
      id,
      timestamp: new Date().toISOString(),
    });
    if (type === 'shop') {
      console.log('shop impression')
      // this.mqttService.publish('shop/impression', payload).subscribe();
      this.mqttService.publish('pub/impression', payload);
    } else if (type === 'pub') {
      console.log('pub impression')
      // this.mqttService.publish('pub/impression', payload).subscribe();
      this.mqttService.publish('shop/impression', payload);
    }
  }

  startTrackingDisplayTime(id: string, type: string | null) {
    // if (type !== 'pub') return;
    if (!this.displayTimes[id]) {
      this.displayTimes[id] = 0;
    }
    this.displayIntervals[id] = setInterval(() => {
      this.displayTimes[id]++;
    }, 1000);
  }

  stopTrackingDisplayTime(id: string, type: string | null) {
    // if (type !== 'pub') return;
    if (this.displayIntervals[id]) {
      console.log(`🛑 Fin de visibilité détectée pour ${type} ${id}`);
      clearInterval(this.displayIntervals[id]);
      delete this.displayIntervals[id];
      const timeSpent = this.displayTimes[id] || 0;
      if (timeSpent > 0) {
        this.sendDisplayTimeToBackend(id, timeSpent);
      }
      delete this.displayTimes[id];
    }
  }

  sendDisplayTimeToBackend(pubId: string, timeSpent: number) {
    const payload = {
      _id: pubId,
      timeSpent: timeSpent,
    };
    this.mqttService.publish("shop/display", JSON.stringify(payload));
  }

  onAdClick(ad: any) {
    this.adService.incrementClick(ad._id).subscribe();
  }

}
