import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AdvertisementService } from '../../services/advertisement.service';
import { MqttService } from '../../services/mqtt.service';
import { environment } from 'src/environments/environment';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-horizontal-pub-list',
  standalone: false,
  templateUrl: './horizontal-pub-list.component.html',
  styleUrls: ['./horizontal-pub-list.component.scss'],
})
export class HorizontalPubListComponent implements OnInit, OnDestroy {
  /** Titre affiché au-dessus du carrousel */
  @Input() title: string = '';

  /** Utilisateur courant (si utile pour la personnalisation) */
  @Input() me: any;

  /** Liste des publicités (après équilibrage) */
  pubs: any[] = [];

  /** Base URL pour les images (API) */
  imgStorageUrl: string = environment.APIimgStorageUrl;

  /** Temps d’affichage cumulé par pub (en secondes) */
  displayTimes: Record<string, number> = {};

  /** Identifiant d’intervalle par pub */
  displayIntervals: Record<string, number> = {};

  /** Suivi du chargement des visuels (skeleton) */
  loadedImages: Record<string, boolean> = {};

  /** Référence du conteneur scrollable */
  @ViewChild('scrollContainerAds') scrollContainerAds!: ElementRef;

  /** Garde une ref à l’IntersectionObserver pour cleanup */
  private adsObserver: IntersectionObserver | null = null;

  constructor(
    private router: Router,
    private adService: AdvertisementService,
    private mqttService: MqttService,
    private translate: TranslateService,
    private toastr: ToastrService
  ) {}

  // -------------------------------------------------
  // Lifecycle
  // -------------------------------------------------
  ngOnInit(): void {
    // Charger la liste des publicités à l’ouverture du composant
    this.getAds();
  }

  ngOnDestroy(): void {
    // 🧹 Nettoyage intégral des intervals et de l’observer pour éviter les fuites mémoire
    try {
      // Clear tous les intervalles encore actifs
      Object.keys(this.displayIntervals).forEach((pubId) => {
        clearInterval(this.displayIntervals[pubId]);
        delete this.displayIntervals[pubId];
      });

      // Déconnecte l’observer si actif
      if (this.adsObserver) {
        this.adsObserver.disconnect();
        this.adsObserver = null;
      }
    } catch (err) {
      console.warn('[HorizontalPubList] Cleanup error:', err);
    }
  }

  // -------------------------------------------------
  // Navigation
  // -------------------------------------------------
  /**
   * Navigation vers la page sponsor/publicité
   */
  goTo(pub: any): void {
    try {
      const sponsorId = pub?._id || pub?.slug || pub?.link;
      if (!sponsorId) {
        console.warn('Sponsor ID manquant pour la navigation.');
        return;
      }
      this.router.navigate(['sponsor', sponsorId]);
    } catch (err) {
      console.error('Erreur de navigation vers sponsor:', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), true);
    }
  }

  // -------------------------------------------------
  // Chargement & équilibrage des pubs
  // -------------------------------------------------
  /**
   * Récupère les publicités PREMIUM, initialise le suivi, puis active le tracking.
   */
  getAds(): void {
    try {
      this.adService.getAdvertisements('PREMIUM').subscribe({
        next: (ads: any[]) => {
          // Sécurise le tableau
          const safeAds = Array.isArray(ads) ? ads : [];
          console.log('📢 Publicités récupérées :', safeAds);

          // Équilibrage de l’ordre d’affichage
          this.pubs = this.balanceAds(safeAds);

          // Init des flags de chargement à false
          for (const pub of this.pubs) {
            if (pub && pub._id) this.loadedImages[pub._id] = false;
          }

          // Démarre l’observer après que le DOM soit mis à jour
          setTimeout(() => {
            console.log('🚀 Activation du tracking après affichage des pubs.');
            this.trackImpressions();
          }, 500);
        },
        error: (err) => {
          console.error('Erreur lors du chargement des publicités :', err);
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), true);
        },
      });
    } catch (err) {
      console.error('Erreur inattendue dans getAds():', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), true);
    }
  }

  /**
   * Trie les pubs pour équilibrer la diffusion :
   * 1) moins d’affichages valides en premier
   * 2) puis le moins de temps total d’affichage
   * 3) puis meilleur taux de conversion
   */
  balanceAds(ads: any[]): any[] {
    try {
      return [...ads].sort((a, b) => {
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
      return ads; // fallback sans tri en cas d’erreur
    }
  }

  // -------------------------------------------------
  // Tracking : impressions & temps d’affichage
  // -------------------------------------------------
  /**
   * Met en place un IntersectionObserver pour déterminer :
   * - l’impression (si ≥ 70% visible)
   * - le temps d’affichage (démarrer/arrêter le timer)
   */
  trackImpressions(): void {
    try {
      console.log('🔍 Initialisation de l’observateur d’impressions...');

      // Si un observer existe déjà (rechargement), on le replace proprement
      if (this.adsObserver) {
        this.adsObserver.disconnect();
        this.adsObserver = null;
      }

      this.adsObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const pubId = entry.target.getAttribute('data-pub-id') || '';
            const ratio = entry.intersectionRatio;

            // Debug
            // console.log(`👀 ${pubId} visible=${entry.isIntersecting} ratio=${ratio}`);

            if (entry.isIntersecting && pubId && ratio >= 0.7) {
              this.incrementImpression(pubId);
              this.startTrackingDisplayTime(pubId);
            } else if (!entry.isIntersecting && pubId) {
              this.stopTrackingDisplayTime(pubId);
            }
          });
        },
        { threshold: 0.7 }
      );

      // On attend que le conteneur soit présent et que les cartes soient rendues
      setTimeout(() => {
        const host = this.scrollContainerAds?.nativeElement;
        const cards: NodeListOf<Element> | null = host
          ? host.querySelectorAll('.pub-card')
          : null;

        if (!cards || cards.length === 0) {
          console.log('❌ Aucune publicité détectée dans le DOM !');
          return;
        }

        console.log(`✅ ${cards.length} publicités détectées pour le tracking.`);
        cards.forEach((adEl) => this.adsObserver?.observe(adEl));
      }, 1000);
    } catch (err) {
      console.error('Erreur dans trackImpressions():', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), true);
    }
  }

  /**
   * Incrémente l’impression (front) puis notifie en MQTT/backend.
   */
  incrementImpression(pubId: string): void {
    try {
      const pub = this.pubs.find((p) => p?._id == pubId);
      if (!pub) {
        console.warn(`⚠️ Pub introuvable pour impression: ${pubId}`);
        return;
      }

      // Mise à jour côté UI
      pub.impressions = (pub.impressions ?? 0) + 1;
      const clicks = pub.clics ?? 0;
      pub.taux_conversion = pub.impressions > 0 ? (clicks / pub.impressions) * 100 : 0;

      // Notifier en MQTT / backend
      this.trackImpression(pub._id);
    } catch (err) {
      console.error('Erreur dans incrementImpression():', err);
    }
  }

  /**
   * Émet un évènement MQTT "impression".
   */
  trackImpression(pubId: string): void {
    try {
      const payload = {
        pubId,
        timestamp: new Date().toISOString(),
      };
      this.mqttService.publish('pub/impression', payload);
    } catch (err) {
      console.error('MQTT publish impression error:', err);
    }
  }

  /**
   * Démarre un timer (1s) pour cumuler le temps d’affichage d’une pub.
   */
  startTrackingDisplayTime(pubId: string): void {
    try {
      if (!this.displayTimes[pubId]) this.displayTimes[pubId] = 0;

      // Évite les doublons d’intervalle
      if (this.displayIntervals[pubId]) return;

      const id = window.setInterval(() => {
        this.displayTimes[pubId] = (this.displayTimes[pubId] ?? 0) + 1;
      }, 1000);

      this.displayIntervals[pubId] = id;
    } catch (err) {
      console.error('Erreur dans startTrackingDisplayTime():', err);
    }
  }

  /**
   * Arrête le timer, envoie le temps au backend (et MQTT), puis reset.
   */
  stopTrackingDisplayTime(pubId: string): void {
    try {
      const id = this.displayIntervals[pubId];
      if (id) {
        clearInterval(id);
        delete this.displayIntervals[pubId];
      }

      const timeSpent = this.displayTimes[pubId] ?? 0;
      if (timeSpent > 0) {
        this.sendDisplayTimeToBackend(pubId, timeSpent);
      }
      delete this.displayTimes[pubId];
    } catch (err) {
      console.error('Erreur dans stopTrackingDisplayTime():', err);
    }
  }

  /**
   * Envoie le temps d’affichage au backend + MQTT.
   */
  sendDisplayTimeToBackend(pubId: string, timeSpent: number): void {
    try {
      this.adService.updateAdDisplayTime(pubId, timeSpent).subscribe({
        next: () => {
          console.log(`✅ Temps d'affichage (${timeSpent}s) enregistré pour pub ${pubId}`);
        },
        error: (err) => {
          console.error('❌ Erreur lors de l’enregistrement du temps d’affichage :', err);
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), true);
        },
      });

      const payload = { duree_affichage: timeSpent, _id: pubId };
      this.mqttService.publish('pub/temps_impression', payload);
    } catch (err) {
      console.error('Erreur dans sendDisplayTimeToBackend():', err);
    }
  }

  // -------------------------------------------------
  // UI : Scroll horizontal
  // -------------------------------------------------
  /**
   * Scroll vers la gauche
   */
  scrollLeft(): void {
    try {
      const container = this.scrollContainerAds?.nativeElement;
      container?.scrollBy({ left: -300, behavior: 'smooth' });
    } catch (err) {
      console.error('Erreur scrollLeft:', err);
    }
  }

  /**
   * Scroll vers la droite
   */
  scrollRight(): void {
    try {
      const container = this.scrollContainerAds?.nativeElement;
      container?.scrollBy({ left: 300, behavior: 'smooth' });
    } catch (err) {
      console.error('Erreur scrollRight:', err);
    }
  }

  // -------------------------------------------------
  // Images (skeleton)
  // -------------------------------------------------
  /**
   * Marque l’image comme chargée (permet de cacher un skeleton)
   */
  onImageLoad(pubId: string): void {
    this.loadedImages[pubId] = true;
  }

  /**
   * Gestion d’erreur de chargement (on garde le skeleton)
   */
  onImageError(pubId: string): void {
    this.loadedImages[pubId] = false;
  }

  // -------------------------------------------------
  // Toast unifié succès/erreur
  // -------------------------------------------------
  /**
   * Affiche un toast unifié avec ngx-toastr.
   * @param message  (déjà traduit) => placer vos textes dans SUCCESS.* ou ERROR.* côté i18n
   * @param isError  true => erreur | false => succès
   */
  private showCustomToast(message: string, isError: boolean = false): void {
    if (isError) {
      this.toastr.error(message);
    } else {
      this.toastr.success(message);
    }
  }
}
