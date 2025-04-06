import { Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';
import { AdvertisementService } from '../../services/advertisement.service';
import { MqttService } from 'ngx-mqtt';

@Component({
  selector: 'app-horizontal-shop-list',
  templateUrl: './horizontal-shop-list.component.html',
  styleUrls: ['./horizontal-shop-list.component.scss']
})
export class HorizontalShopListComponent implements OnChanges {
  @Input() title: string = '';
  @Input() shops: any[] = [];
  @Input() me: any;
  @Input() pubIndexe: string = "1";
  displayTimes: { [key: string]: number } = {}; // Stocker le temps d'affichage par pub
  displayIntervals: { [key: string]: any } = {}; // Stocker les intervalles de temps pour chaque pub

  @ViewChild('scrollContainerAds') scrollContainerAds!: ElementRef;
  loadedShops: { [key: string]: boolean } = {};
  advertisements: any[] = [];
  displayItems: any[] = [];

  constructor(private adService: AdvertisementService,
      private mqttService: MqttService,) {}

  ngOnChanges(): void {
    if (this.shops) {
      this.loadedShops = {};
      for (const shop of this.shops) {
        this.loadedShops[shop._id] = false;
      }

      this.getAds();
    }
  }

  onShopLoaded(shopId: string) {
    this.loadedShops[shopId] = true;
  }

  private loadAdvertisements() {
    this.adService.getAdvertisements().subscribe((ads:any[]) => {
      this.advertisements = ads.filter(ad => new Date(ad.date_expiration) > new Date());
      this.injectAdsIntoShops();
    });
  }


  getAds() {
    this.adService.getAdvertisements().subscribe(ads => {
      console.log("📢 Publicités récupérées :", ads);
  
      this.advertisements = this.balanceAds(ads.filter(ad => new Date(ad.date_expiration) > new Date()));
      this.injectAdsIntoShops();
  
      setTimeout(() => {
        console.log("🚀 Activation du tracking après affichage des pubs.");
        this.trackImpressions();
      }, 500);
    });
  }

  balanceAds(ads: any[]): any[] {
    return ads.sort((a, b) => {
      // ✅ 1ère priorité : Trier par nombre d'affichages valides (moins d'affichages valides en premier)
      if (a.nombre_affichages_valides !== b.nombre_affichages_valides) {
        return a.nombre_affichages_valides - b.nombre_affichages_valides;
      }
      // ✅ 2ème priorité : Trier par temps total d'affichage (moins affiché en premier)
      if (a.temps_affichage_total !== b.temps_affichage_total) {
        return a.temps_affichage_total - b.temps_affichage_total;
      }
      // ✅ 3ème priorité : Trier par taux de conversion (on garde ceux qui performent bien)
      return b.taux_conversion - a.taux_conversion;
    });
  }

  

  // Suivi des impressions avec Intersection Observer API
  trackImpressions() {
    console.log("🔍 Initialisation de l'observateur d'impressions...");

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const pubId = entry.target.getAttribute('data-pub-id');
        const visibilityRatio = entry.intersectionRatio;

        console.log(`👀 Élément détecté : ${pubId} - Visible : ${entry.isIntersecting} - Ratio: ${visibilityRatio}`);

        if (entry.isIntersecting && pubId && visibilityRatio >= 0.7) {
          this.incrementImpression(pubId);
          this.startTrackingDisplayTime(pubId);
        } else if (!entry.isIntersecting && pubId) {
          this.stopTrackingDisplayTime(pubId);
        }
      });
    }, { threshold: 0.7 });

    setTimeout(() => {
      const ads = this.scrollContainerAds?.nativeElement?.querySelectorAll('.pub-card');
      if (!ads || ads.length === 0) {
        console.log("❌ Aucune publicité détectée dans le DOM !");
      } else {
        console.log(`✅ ${ads.length} publicités détectées pour le tracking.`);
        ads.forEach((ad: any) => observer.observe(ad));
      }
    }, 1000);
  }

  // Incrémentation des impressions en base de données
  incrementImpression(pubId: any) {
    console.log(`📢 Tentative d'incrémentation d'impression pour pub ${pubId}`);
    const pub = this.displayItems.find(p => p._id == pubId);
    if (pub) {
      pub.impressions++;
      pub.taux_conversion = pub.impressions > 0 ? (pub.clics / pub.impressions) * 100 : 0;

      console.log(`✅ Impression détectée pour pub ${pub._id}, envoi de la mise à jour...`);
      this.trackImpression(pub._id)

    } else {
      console.log(`⚠️ Impossible de trouver la publicité avec ID: ${pubId}`);
    }
  }

  trackImpression(pubId: string) {
    const payload:any = {
      pubId,
      timestamp: new Date().toISOString(),
    };
    this.mqttService.publish('pub/impression', payload);
  }

  // ✅ Démarrer le suivi du temps d'affichage
  startTrackingDisplayTime(pubId: string) {
    if (!this.displayTimes[pubId]) {
      this.displayTimes[pubId] = 0;
    }
    this.displayIntervals[pubId] = setInterval(() => {
      this.displayTimes[pubId]++;
    }, 1000);
  }

  // ✅ Arrêter le suivi du temps et envoyer les données
  stopTrackingDisplayTime(pubId: string) {
    if (this.displayIntervals[pubId]) {
      clearInterval(this.displayIntervals[pubId]);
      delete this.displayIntervals[pubId];
      const timeSpent = this.displayTimes[pubId] || 0;
      if (timeSpent > 0) {
        this.sendDisplayTimeToBackend(pubId, timeSpent);
      }
      delete this.displayTimes[pubId];
    }
  }


  private injectAdsIntoShops() {
    const startIndex = parseInt(this.pubIndexe || '1', 10);
    const interval = 5;
    let adIndex = 0;

    this.displayItems = [];

    for (let i = 0; i < this.shops.length; i++) {
      if ((i - startIndex) % interval === 0 && (i - startIndex) >= 0 && adIndex < this.advertisements.length) {
        this.displayItems.push({ type: 'ad', data: this.advertisements[adIndex] });
        adIndex++;
      }
      this.displayItems.push({ type: 'shop', data: this.shops[i] });
    }
  }

  // ✅ Envoyer le temps d'affichage au backend
  sendDisplayTimeToBackend(pubId: string, timeSpent: number) {
    this.adService.updateAdDisplayTime(pubId, timeSpent).subscribe(
      () => console.log(`✅ Temps d'affichage (${timeSpent}s) enregistré pour pub ${pubId}`),
      err => console.error(`❌ Erreur lors de l'enregistrement du temps d'affichage :`, err)
    );
  }

  onAdClick(ad: any) {
    this.adService.incrementClick(ad._id).subscribe();
  }
}
