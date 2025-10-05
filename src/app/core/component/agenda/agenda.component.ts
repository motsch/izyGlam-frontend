import { Component, Inject, Input, OnInit, ViewChild } from '@angular/core';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import allLocales from '@fullcalendar/core/locales-all'; // ✅ toutes les locales FC
import { FullCalendarComponent } from '@fullcalendar/angular';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { BookingService } from '../../services/booking.service';
import { SessionService } from '../../services/session.service';

// ✅ AjoutsizyGlam : toasts + i18n
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-agenda',
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.scss'], // ✅ correction: styleUrls (tableau) 
})
export class AgendaComponent implements OnInit {
  @Input() me: any = {};
  @Input() shops: any[] = [];

  openNewEventModal = false;
  newEventData: any = {};
  @ViewChild('calendar', { static: false }) calendarComponent?: FullCalendarComponent;

  // ⚙️ Options FullCalendar (config par défaut + FR)
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin],
    initialView: 'timeGridWeek',
    weekends: true,
    slotMinTime: '04:00:00',
    slotMaxTime: '23:59:59',
    // allDayText: 'Events',
    eventOrder: 'status,-start',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay',
    },
    locales: allLocales, // ✅ toutes les locales
    locale: 'fr',
    // Événements d’exemple (restent si pas de données)
    events: [
      {
        title: "Vacances d'été",
        start: '2024-07-01',
        end: '2024-09-01',
        rendering: 'background',
        backgroundColor: 'green',
        allDay: true,
      },
      {
        title: 'Vacances de Noël',
        start: '2024-12-20',
        end: '2025-01-03',
        rendering: 'background',
        backgroundColor: '#ffeb3b',
        textColor: '#000000',
        borderColor: 'transparent',
      },
      {
        title: 'Coiffure zigo',
        start: '2024-09-27T10:00:00',
        end: '2024-09-27T11:00:00',
        backgroundColor: '#f28b82',
        borderColor: '#f28b82',
        textColor: '#000000',
      },
    ],
    eventClick: this.handleEventClick.bind(this),
  };

  constructor(
    public dialog: MatDialog,
    private bookingService: BookingService,
    private sessionService: SessionService,

    // ✅izyGlam
    private toastr: ToastrService,
    private translate: TranslateService
  ) { }

  // ------------------------------------------------------
  // ⏱️ Chargement : on set le menu + on récupère les bookings pro
  // ------------------------------------------------------
  ngOnInit(): void {
    localStorage.setItem('menu-param', 'calendar');

    // ✅ 1) Récupère la langue (SessionService prioritaire)
    const initialLang = this.sessionService.getLang() || localStorage.getItem('langue') || 'fr';
    // localStorage.getItem('langue') peut contenir des guillemets si JSON.stringify, on gère vite fait :
    const cleanedLang = (initialLang || 'fr').toString().replace(/^"+|"+$/g, '');

    // ✅ 2) Applique aux traductions app (si ce n’est pas déjà fait ailleurs)
    this.translate.use(cleanedLang);

    // ✅ 3) Applique au calendrier
    this.setCalendarLocale(cleanedLang);

    // ✅ 4) Réagit quand la langue change via ngx-translate
    this.translate.onLangChange.subscribe((e) => {
      const newLang = e.lang || 'fr';
      // optionnel : persister côté session/local
      this.sessionService.setLang(newLang);
      this.setCalendarLocale(newLang);
    });

    // ⚠️ Si me/shops ne sont pas encore injectés, on évite l’appel vide
    if (!this?.me?._id) {
      console.warn('AgendaComponent: me._id manquant — abonnement non lancé.');
      return;
    }

    this.bookingService.getBookingByUserPro(this.me._id).subscribe({
      next: (data: any) => {
        if (this.calendarOptions.events) {
          data.forEach((elem: any) => {
            elem.start = new Date(elem.start);
            elem.end = new Date(elem.end);
            elem.textColor = '#000000';
            elem.backgroundColor = elem.color;
            if (!elem.extendedProps) {
              elem.extendedProps = {};
            }
            elem.extendedProps.address = elem.address || 'Adresse inconnue';
            elem.extendedProps.phoneNumber = elem.phoneNumber || 'Numéro inconnu';
          });
          this.calendarOptions.events = data;
        }
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des bookings pro :', error);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      },
    });
  }

  private setCalendarLocale(lang: string) {
    // 1) Mets à jour l’option locale dans l’objet (utile si Angular re-render)
    this.calendarOptions = { ...this.calendarOptions, locale: lang };

    // 2) Mets à jour directement l’instance FullCalendar si déjà montée
    const api = this.calendarComponent?.getApi();
    if (api) {
      api.setOption('locale', lang);
    }
  }
  // ------------------------------------------------------
  // ➕ Ouvrir la modale d’ajout d’événement
  // ------------------------------------------------------
  openAddEventModal() {
    const dialogRef = this.dialog.open(ContentCalendarItemDialog, {
      width: '400px',
      data: {
        title: '',
        start: '',
        end: '',
        address: '',
        phoneNumber: '',
        new: true, // indique un nouvel événement
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        console.log('New event data:', result);

        // ⚠️ On sécurise la présence d’un shop pour peupler les champs
        if (!this.shops || this.shops.length === 0) {
          console.warn("Aucun shop disponible pour créer l'événement.");
        }

        // Création du booking à partir des infos (me, shop[0], result)
        const newBooking = {
          title: result.title,
          establishmentName: this.shops?.[0]?.name,
          productName: 'Some Product', // TODO: adapter si besoin
          address: result.address,
          phoneNumber: result.phoneNumber,
          clientId: this.me._id,
          userProId: this.shops?.[0]?.idUser,
          serviceId: null,
          shopId: this.shops?.[0]?._id,
          status: 'pending',
          price: null,
          commission: null,
          date: new Date(),
          start: new Date(result.start),
          end: new Date(result.end),
          color: '#dddddd',
          tva: null,
          shopEarnings: null,
          reviewAdded: false,
        };

        // Toujours un tableau pour calendarOptions.events
        if (!this.calendarOptions.events) {
          this.calendarOptions.events = [];
        }

        const sessionLangue = this.sessionService.getLang();

        // Appel API de création du booking
        this.bookingService.create(newBooking, sessionLangue!).subscribe({
          next: (response) => {
            console.log('Booking created successfully:', response);

            // ✅ On ajoute aussi l’événement au calendrier
            this.calendarOptions.events = [
              ...(this.calendarOptions.events as any[]),
              newBooking,
            ];

            // ✅ Toast de succès
            this.toastr.success(
              this.translate.instant('SUCCESS.BOOKING_CREATED') || 'Votre réservation a bien été enregistrée.'
            );
          },
          error: (err) => {
            console.error('Erreur lors de la création du booking :', err);
            this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
          },
        });
      }
    });
  }

  // ------------------------------------------------------
  // 🖱️ Clic sur un événement du calendrier (édition rapide)
  // ------------------------------------------------------
  handleEventClick(info: any) {
    const formatDate = (date: Date) => {
      const pad = (n: number) => (n < 10 ? '0' + n : n);
      const year = date.getFullYear();
      const month = pad(date.getMonth() + 1);
      const day = pad(date.getDate());
      const hours = pad(date.getHours());
      const minutes = pad(date.getMinutes());
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    const dialogRef = this.dialog.open(ContentCalendarItemDialog, {
      width: '400px',
      data: {
        title: info.event.title,
        start: formatDate(new Date(info.event.start)),
        end: formatDate(new Date(info.event.end)),
        address: info.event.extendedProps.address,
        phoneNumber: info.event.extendedProps.phoneNumber,
        new: false, // événement existant
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        // MAJ locale de l’événement (ici côté calendrier uniquement)
        info.event.setProp('title', result.title);
        info.event.setDates(result.start, result.end);
        // 👉 Si tu veux persister la modif, ajoute un appel bookingService.update(...)
      }
    });
  }

  // ------------------------------------------------------
  // ✨ Toast d’erreur styliséizyGlam (centralisé)
  // ------------------------------------------------------
  private showCustomToast(message: string) {
    // Standard : erreurs → toastr.error
    this.toastr.error(message);
  }
}

@Component({
  selector: 'content-calendar-item-dialog',
  templateUrl: './dialog/content-calendar-item-dialog.component.html',
  styleUrls: ['./dialog/content-calendar-item-dialog.component.scss'], // ✅ styleUrls
})
export class ContentCalendarItemDialog {
  constructor(
    public dialogRef: MatDialogRef<ContentCalendarItemDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

  openGoogleMaps(address: string) {
    const encodedAddress = encodeURIComponent(address);
    const googleMapsUrl = `https://www.google.com/maps/place/${encodedAddress}`;
    window.open(googleMapsUrl, '_blank');
  }
}
