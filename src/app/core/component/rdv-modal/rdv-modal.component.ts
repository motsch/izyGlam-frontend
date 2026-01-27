import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { SessionService } from '../../services/session.service';
import { Router } from '@angular/router';
import { CommunicationService } from '../../services/communication.service';
import { BookingService } from '../../services/booking.service';
import { environment } from 'src/environments/environment';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';

type TimeSlot = { dateBrut: string; start: string; end: string };
type DayGroup = { raw: string; label: string; times: TimeSlot[] };

@Component({
  selector: 'app-rdv-modal',
  templateUrl: './rdv-modal.component.html',
  styleUrls: ['./rdv-modal.component.scss'],
})
export class RdvModalComponent implements OnInit, OnDestroy {
  // === Assets / URLs ===
  imgStorageUrl: string = environment.APIimgStorageUrl.replace(/\/$/, '');

  // === UI state ===
  openedIndex: number | null = null;   // index du jour ouvert (accordéon)
  schedules: DayGroup[] = [];          // [{ raw: "2025-10-06", label: "lundi 6 octobre 2025", times: [...] }]

  // === Contexte ===
  shopId: string | null = null;        // id boutique (localStorage)
  service: any = {};                   // service sélectionné (localStorage)

  // === Internals ===
  private subs: Subscription[] = [];

  constructor(
    public dialogRef: MatDialogRef<RdvModalComponent>,
    public sessionService: SessionService,
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

      this.generateDates(); // charge les créneaux
    } catch (err) {
      console.error('[RDV Modal] ngOnInit ERROR:', err);
      this.showCustomToast(
        this.translate.instant('ERROR.GENERIC_ERROR') || '✨ Oups… une erreur s’est glissée. Merci de réessayer ✨',
        'error'
      );
    }
  }

  ngOnDestroy(): void {
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
   * Lit le service, récupère les créneaux auprès du backend, et formate l’affichage.
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
            // data attendu: [{ date: "YYYY-MM-DD", start, end }, ...]
            this.schedules = this.formatAvailableSlots(Array.isArray(data) ? data : []);
            console.log('[RDV Modal] Créneaux formatés :', this.schedules);

            if (!this.schedules.length) {
              this.showCustomToast(
                this.translate.instant('ERROR.NO_SLOTS') || 'Aucun créneau disponible pour ce service.',
                'error'
              );
              this.openedIndex = null;
            } else {
              // Ouvre le premier jour après chargement
              this.openedIndex = 0;
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
   * Regroupe les créneaux par date brute (clé stable) et ajoute un libellé localisé.
   */
  formatAvailableSlots(data: any[]): DayGroup[] {
    const locale = this.sessionService.getLang() || 'fr';

    // Prépare les items
    const prepared = (data || [])
      .map((slot) => {
        const raw: string = slot?.date; // "YYYY-MM-DD"
        const label = this.formatDateLabelIntl(raw, locale);
        if (!raw || !label) return null;

        const time: TimeSlot = {
          dateBrut: raw,
          start: slot?.start,
          end: slot?.end,
        };

        return { key: raw, label, time };
      })
      .filter(Boolean) as { key: string; label: string; time: TimeSlot }[];

    // Groupement par date brute
    const byKey = new Map<string, DayGroup>();
    for (const it of prepared) {
      if (!byKey.has(it.key)) {
        byKey.set(it.key, { raw: it.key, label: it.label, times: [] });
      }
      byKey.get(it.key)!.times.push(it.time);
    }

    // Tri par date brute croissante
    return Array.from(byKey.values()).sort((a, b) => a.raw.localeCompare(b.raw));
  }

  /**
   * Formate "YYYY-MM-DD" en libellé localisé avec Intl : "lundi 2 septembre 2025".
   * - Parsing sûr en UTC pour figer le jour.
   * - Aucune locale Angular à charger (évite NG0701).
   */
  private formatDateLabelIntl(rawYmd: string, locale: string): string | null {
    try {
      if (!rawYmd) return null;

      // Parse "YYYY-MM-DD" à la main (évite glissements de jour)
      const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(rawYmd.trim());
      const date = m
        ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
        : new Date(rawYmd); // fallback si autre format

      if (isNaN(date.getTime())) return null;

      const normalized = this.normalizeLocale(locale);
      const formatter = new Intl.DateTimeFormat(normalized, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC', // fige le jour
      });

      const label = formatter.format(date);
      return label.charAt(0).toLocaleUpperCase(normalized) + label.slice(1);
    } catch (err) {
      console.error('[RDV Modal] formatDateLabelIntl ERROR:', err, rawYmd, locale);
      return null;
    }
  }

  /** Normalise quelques locales génériques vers des variantes courantes */
  private normalizeLocale(locale: string): string {
    const lc = (locale || '').toLowerCase();
    const map: Record<string, string> = {
      // Europe
      'pt': 'pt-PT', 'es': 'es-ES', 'en': 'en-GB', 'fr': 'fr-FR', 'de': 'de-DE',
      'nl': 'nl-NL', 'it': 'it-IT', 'sv': 'sv-SE', 'da': 'da-DK', 'fi': 'fi-FI',
      'pl': 'pl-PL', 'ro': 'ro-RO', 'ru': 'ru-RU', 'uk': 'uk-UA', 'sq': 'sq-AL',
      'be': 'be-BY', 'et': 'et-EE', 'eu': 'eu-ES', 'gl': 'gl-ES', 'ca': 'ca-ES',

      // Asie / Moyen-Orient / autres
      'zh': 'zh-CN', 'ja': 'ja-JP', 'ko': 'ko-KR', 'th': 'th-TH', 'vi': 'vi-VN',
      'id': 'id-ID', 'ms': 'ms-MY', 'hi': 'hi-IN', 'bn': 'bn-BD', 'fa': 'fa-IR',
      'tr': 'tr-TR', 'ar': 'ar-EG', 'ku': 'ku-TR', 'so': 'so-SO', 'tl': 'tl-PH',
      'pt-br': 'pt-BR',
    };
    return map[lc] || lc || 'en';
  }

  // ============================================================
  //                             UI
  // ============================================================

  toggleDate(index: number) {
    try {
      if (this.openedIndex === index && this.schedules.length > 1) return;
      this.openedIndex = index;
    } catch (err) {
      console.error('[RDV Modal] toggleDate ERROR:', err, index);
    }
  }

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
  slotClick(slot: TimeSlot, day: DayGroup) {
    try {
      console.log('[RDV Modal] Créneau sélectionné :', slot, ' / Day :', day);

      const objetToSave: any = {
        slot,                 // {dateBrut, start, end}
        shopId: this.shopId,
        date: day.label,      // pour affichage humain
        dateRaw: day.raw,     // clé technique si besoin backend
      };

      if (!this.sessionService.isLoggedIn()) {
        this.dialog.closeAll();
        this.showCustomToast(
          this.translate.instant('ERROR.LOGIN_REQUIRED') || 'Veuillez vous connecter pour continuer.',
          'error'
        );
        this.router.navigate(['sign-in']);
        return;
      }

      localStorage.setItem('selectItemFromShop', JSON.stringify(objetToSave));
      this.dialog.closeAll();

      this.showCustomToast(
        this.translate.instant('SUCCESS.SLOT_SELECTED') || 'Créneau sélectionné ✔️',
        'success'
      );

      this.router.navigate(['paiement']);
    } catch (err) {
      console.error('[RDV Modal] slotClick ERROR:', err, slot, day);
      this.showCustomToast(
        this.translate.instant('ERROR.GENERIC_ERROR') || 'Impossible de sélectionner ce créneau.',
        'error'
      );
    }
  }

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
