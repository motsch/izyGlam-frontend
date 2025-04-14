import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AdvertisementService } from '../../services/advertisement.service';
import { MqttService } from '../../services/mqtt.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-horizontal-pub-list',
  standalone: false,
  templateUrl: './horizontal-pub-list.component.html',
  styleUrl: './horizontal-pub-list.component.scss'
})
export class HorizontalPubListComponent implements OnInit {
  @Input() title: string = '';
  pubs: any[] = [];
  imgStorageUrl: string = environment.APIimgStorageUrl;
  displayTimes: { [key: string]: number } = {}; // Stocker le temps d'affichage par pub
  @Input() me: any;
  displayIntervals: { [key: string]: any } = {}; // Stocker les intervalles de temps pour chaque pub
  @ViewChild('scrollContainerAds') scrollContainerAds!: ElementRef;
  loadedImages: { [key: string]: boolean } = {};

  constructor(private router: Router,
    private adService: AdvertisementService,
    private mqttService: MqttService,) { }

  ngOnInit(): void {
    this.getAds();
  }

  goTo(link: string) {
    console.log("click: " + link);
    if (link.startsWith('http://') || link.startsWith('https://')) {
      window.open(link, '_blank'); // Ouvre le lien externe dans un nouvel onglet
    } else {
      this.router.navigateByUrl(link); // Navigation interne Angular
    }
  }

  getAds() {
    this.adService.getAdvertisements('PREMIUM').subscribe(ads => {
      console.log("📢 Publicités récupérées :", ads);
  
      this.pubs = this.balanceAds(ads);
  
      // 🔧 Initialisation des flags de chargement à false
      for (const pub of this.pubs) {
        this.loadedImages[pub._id] = false;
      }
  
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
    const pub = this.pubs.find(p => p._id == pubId);
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
    const payload = {
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

  // ✅ Envoyer le temps d'affichage au backend
  sendDisplayTimeToBackend(pubId: string, timeSpent: number) {
    this.adService.updateAdDisplayTime(pubId, timeSpent).subscribe(
      () => console.log(`✅ Temps d'affichage (${timeSpent}s) enregistré pour pub ${pubId}`),
      err => console.error(`❌ Erreur lors de l'enregistrement du temps d'affichage :`, err)
    );
  }

  onImageLoad(pubId: string) {
    this.loadedImages[pubId] = true;
  }
  
  onImageError(pubId: string) {
    this.loadedImages[pubId] = false; // on peut forcer à rester sur le skeleton
  }
}

