import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ScheduleService } from '../../services/schedule.service';
import { DatePipe } from '@angular/common';
import { SessionService } from '../../services/session.service';
import { Router } from '@angular/router';
import { CommunicationService } from '../../services/communication.service';
import { BookingService } from '../../services/booking.service';
import { environment } from 'src/environments/environment';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-rdv-modal',
  templateUrl: './rdv-modal.component.html',
  styleUrls: ['./rdv-modal.component.scss'],
})
export class RdvModalComponent implements OnInit, OnDestroy {
  // === Assets / URLs ===
  imgStorageUrl: string = environment.APIimgStorageUrl.replace(/\/$/, '');

  // === UI state ===
  openedIndex: number | null = null;      // index du jour actuellement "ouvert" (accordéon)
  schedules: any[] = [];                  // créneaux formatés { date: 'lundi 2 septembre...', times: [{ start, end, dateBrut }] }

  // === Contexte ===
  shopId: string | null = null;           // id de la boutique sélectionnée (localStorage)
  service: any = {};                      // service sélectionné (localStorage)

  // === Internals ===
  private subs: Subscription[] = [];      // gestion des abonnements pour cleanup

  constructor(
    public dialogRef: MatDialogRef<RdvModalComponent>,
    private scheduleService: ScheduleService,
    private datePipe: DatePipe,
    private sessionService: SessionService,
    private router: Router,
    public dialog: MatDialog,
    private communicationService: CommunicationService,
    private bookingService: BookingService,
    private translate: TranslateService,
    private toastr: ToastrService
  ) {}

  // ============================================================
  //                           LIFECYCLE
  // ============================================================

  ngOnInit() {
    try {
      // 1) Récupère le shop sélectionné
      const storedShop = localStorage.getItem('shopSelected');
      if (!storedShop) {
        console.warn('[RDV Modal] Aucun shopSelected en storage.');
        this.showCustomToast(
          this.translate.instant('ERROR.NO_SHOP_SELECTED') || 'Aucune boutique sélectionnée.',
          'error'
        );
        return;
      }
      this.shopId = storedShop;

      // 2) Charge les créneaux pour le service actuellement sélectionné
      this.generateDates();

      // 3) Ouvre par défaut le premier jour (si disponible)
      this.toggleDate(0);
    } catch (err) {
      console.error('[RDV Modal] ngOnInit ERROR:', err);
      this.showCustomToast(
        this.translate.instant('ERROR.GENERIC_ERROR') || '✨ Oups… une erreur s’est glissée. Merci de réessayer ✨',
        'error'
      );
    }
  }

  ngOnDestroy(): void {
    // Nettoyage des abonnements RxJS
    try {
      this.subs.forEach(s => s?.unsubscribe());
    } catch (err) {
      console.error('[RDV Modal] ngOnDestroy unsubscribe ERROR:', err);
    }
  }

  // ============================================================
  //                       DATA LOADING / FORMAT
  // ============================================================

  /**
   * Lit le service en storage, récupère les créneaux auprès du backend, et formate l’affichage.
   */
  generateDates() {
    try {
      if (!this.shopId) return;

      const serviceString = localStorage.getItem('productToBuy');
      if (!serviceString) {
        console.warn('[RDV Modal] Aucun produit sélectionné dans le localStorage.');
        this.showCustomToast(
          this.translate.instant('ERROR.NO_SERVICE_SELECTED') || 'Aucun service sélectionné.',
          'error'
        );
        return;
      }

      // Lecture défensive du JSON
      try {
        this.service = JSON.parse(serviceString);
      } catch (parseErr) {
        console.error('[RDV Modal] Erreur parse productToBuy:', parseErr, serviceString);
        this.showCustomToast(
          this.translate.instant('ERROR.GENERIC_ERROR') || 'Données de service corrompues.',
          'error'
        );
        return;
      }

      const serviceId = this.service?._id;
      if (!serviceId) {
        console.warn('[RDV Modal] Service sans _id:', this.service);
        this.showCustomToast(
          this.translate.instant('ERROR.NO_SERVICE_SELECTED') || 'Aucun service sélectionné.',
          'error'
        );
        return;
      }

      // Appel backend pour récupérer les créneaux
      const sub = this.bookingService.getAvailableTimeSlots(this.shopId, serviceId).subscribe({
        next: (data: any[]) => {
          try {
            // data attendu: [{ date, start, end }, ...]
            this.schedules = this.formatAvailableSlots(Array.isArray(data) ? data : []);
            console.log('[RDV Modal] Créneaux formatés :', this.schedules);

            if (!this.schedules.length) {
              this.showCustomToast(
                this.translate.instant('ERROR.NO_SLOTS') || 'Aucun créneau disponible pour ce service.',
                'error'
              );
            }
          } catch (fmtErr) {
            console.error('[RDV Modal] Format slots ERROR:', fmtErr, data);
            this.showCustomToast(
              this.translate.instant('ERROR.GENERIC_ERROR') || 'Erreur lors du formatage des créneaux.',
              'error'
            );
          }
        },
        error: (error: any) => {
          console.error('[RDV Modal] Erreur récupération créneaux:', error);
          this.showCustomToast(
            error?.error?.message ||
              this.translate.instant('ERROR.GENERIC_ERROR') ||
              'Impossible de récupérer les créneaux.',
            'error'
          );
        },
      });
      this.subs.push(sub);
    } catch (err) {
      console.error('[RDV Modal] generateDates ERROR:', err);
      this.showCustomToast(
        this.translate.instant('ERROR.GENERIC_ERROR') || 'Erreur inattendue lors du chargement.',
        'error'
      );
    }
  }

  /**
   * Regroupe les créneaux par date (affichage humain).
   */
  formatAvailableSlots(data: any[]): any[] {
    // On transforme chaque slot en { date: 'lundi 2 septembre 2025', times: [{start, end, dateBrut}] }
    const formattedSchedules = (data || []).map(slot => ({
      date: this.formatDate(slot?.date),
      times: [{
        dateBrut: slot?.date,
        start: slot?.start,
        end: slot?.end
      }]
    })).filter(s => !!s.date); // filtre dates invalides

    // Groupement par date affichée
    const groupedSchedules = this.groupBy(formattedSchedules, 'date');

    return Object.keys(groupedSchedules).map(date => ({
      date,
      times: groupedSchedules[date].map((slot: any) => slot.times[0])
    }));
  }

  /**
   * Grouper un tableau d’objets par clé (sécurisé).
   */
  groupBy(array: any[], key: string) {
    try {
      return (array || []).reduce((result: any, currentValue: any) => {
        const k = currentValue?.[key];
        if (!k) return result;
        (result[k] = result[k] || []).push(currentValue);
        return result;
      }, {});
    } catch (err) {
      console.error('[RDV Modal] groupBy ERROR:', err, array, key);
      return {};
    }
  }

  /**
   * Formate une date ISO/string en libellé FR lisible: "lundi 2 septembre 2025"
   */
  formatDate(dateString: string): string | null {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      return this.datePipe.transform(date, 'EEEE d MMMM y', 'fr-FR');
    } catch (err) {
      console.error('[RDV Modal] formatDate ERROR:', err, dateString);
      return null;
    }
  }

  // ============================================================
  //                             UI
  // ============================================================

  /**
   * Ouvre la section jour à l’index donné (accordéon).
   */
  toggleDate(index: number) {
    try {
      // Empêche de replier si >1 dates et on clique sur la même
      if (this.openedIndex === index && this.schedules.length > 1) return;
      this.openedIndex = index;
    } catch (err) {
      console.error('[RDV Modal] toggleDate ERROR:', err, index);
    }
  }

  /**
   * Ferme la modale sans action.
   */
  onNoClick(): void {
    try {
      this.dialogRef.close();
    } catch (err) {
      console.error('[RDV Modal] onNoClick ERROR:', err);
    }
  }

  /**
   * Sélection d’un créneau → si non connecté redirige vers login, sinon sauvegarde et va vers billing.
   */
  slotClick(slot: any, date: any) {
    try {
      console.log('[RDV Modal] Créneau sélectionné :', slot, ' / Date :', date);

      // Construction de l’objet à persister
      const objetToSave: any = {
        slot: slot,
        shopId: this.shopId,
        date: date?.date
      };

      // Utilisateur non connecté → on ferme la modale et on redirige
      if (!this.sessionService.isLoggedIn()) {
        this.dialog.closeAll();
        this.showCustomToast(
          this.translate.instant('ERROR.LOGIN_REQUIRED') || 'Veuillez vous connecter pour continuer.',
          'error'
        );
        this.router.navigate(['sign-in']);
        return;
      }

      // Utilisateur connecté → on stocke et on redirige vers le tunnel de paiement
      localStorage.setItem('selectItemFromShop', JSON.stringify(objetToSave));
      this.dialog.closeAll();

      this.showCustomToast(
        this.translate.instant('SUCCESS.SLOT_SELECTED') || 'Créneau sélectionné ✔️',
        'success'
      );

      this.router.navigate(['billing']);
    } catch (err) {
      console.error('[RDV Modal] slotClick ERROR:', err, slot, date);
      this.showCustomToast(
        this.translate.instant('ERROR.GENERIC_ERROR') || 'Impossible de sélectionner ce créneau.',
        'error'
      );
    }
  }

  /**
   * Fallback d’image (logos, etc.) → remplace par le logo générique si erreur de chargement.
   */
  onImageError(event: Event) {
    try {
      const imgElement = event.target as HTMLImageElement;
      imgElement.src = `${this.imgStorageUrl}/uploads/images/logo.png`;
    } catch (err) {
      console.error('[RDV Modal] onImageError ERROR:', err);
    }
  }

  // ============================================================
  //                          TOASTS
  // ============================================================

  /**
   * Toast centralisé succès/erreur (utilise ngx-toastr + ngx-translate).
   */
  private showCustomToast(messageOrKey: string, type: 'success' | 'error' = 'success') {
    try {
      const translated = this.translate.instant(messageOrKey);
      const msg = translated && translated !== messageOrKey ? translated : messageOrKey;

      if (type === 'success') this.toastr.success(msg);
      else this.toastr.error(msg);
    } catch (e) {
      console.warn('[RDV Modal] showCustomToast WARN (fallback):', e);
      if (type === 'success') this.toastr.success(messageOrKey);
      else this.toastr.error(messageOrKey);
    }
  }
}
