import { Component, Inject, Input, OnInit, ViewChild } from '@angular/core';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import allLocales from '@fullcalendar/core/locales-all';
import { FullCalendarComponent } from '@fullcalendar/angular';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';

import { BookingService } from '../../services/booking.service';
import { SessionService } from '../../services/session.service';

// ✅ Ajouts izyGlam : toasts + i18n
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { VacationService } from '../../services/shop-vacations.service';


@Component({
  selector: 'app-agenda',
  templateUrl: './agenda.component.html',
  styleUrls: ['./agenda.component.scss'],
})
export class AgendaComponent implements OnInit {
  @Input() me: any = {};
  @Input() shops: any[] = [];

  openNewEventModal = false;
  newEventData: any = {};

  @ViewChild('calendar', { static: false })
  calendarComponent?: FullCalendarComponent;

  // ✅ Optionnel : état de chargement
  loadingCalendar = false;

  // ⚙️ Options FullCalendar
  calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin, timeGridPlugin],
    initialView: 'timeGridWeek',
    weekends: true,
    slotMinTime: '04:00:00',
    slotMaxTime: '23:59:59',
    eventOrder: 'status,-start',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay',
    },
    locales: allLocales,
    locale: 'fr',
    events: [], // ✅ on laisse vide et on remplit au chargement
    eventClick: this.handleEventClick.bind(this),
  };

  constructor(
    public dialog: MatDialog,
    private bookingService: BookingService,
    private sessionService: SessionService,

    // ✅ NEW
    private vacationService: VacationService,

    // ✅ izyGlam
    private toastr: ToastrService,
    private translate: TranslateService
  ) {}

  // ------------------------------------------------------
  // ⏱️ Chargement : langue + bookings + vacations
  // ------------------------------------------------------
  ngOnInit(): void {
    localStorage.setItem('menu-param', 'calendar');

    // ✅ 1) langue
    const initialLang =
      this.sessionService.getLang() ||
      localStorage.getItem('langue') ||
      'fr';

    const cleanedLang = (initialLang || 'fr')
      .toString()
      .replace(/^"+|"+$/g, '');

    this.translate.use(cleanedLang);
    this.setCalendarLocale(cleanedLang);

    this.translate.onLangChange.subscribe((e) => {
      const newLang = e.lang || 'fr';
      this.sessionService.setLang(newLang);
      this.setCalendarLocale(newLang);
    });

    // ⚠️ guards
    if (!this?.me?._id) {
      console.warn('AgendaComponent: me._id manquant — abonnement non lancé.');
      return;
    }

    // ✅ on charge tout
    this.loadCalendarData();
  }

  // ------------------------------------------------------
  // 🌍 Locale FullCalendar
  // ------------------------------------------------------
  private setCalendarLocale(lang: string) {
    this.calendarOptions = { ...this.calendarOptions, locale: lang };

    const api = this.calendarComponent?.getApi();
    if (api) {
      api.setOption('locale', lang);
    }
  }

  // ------------------------------------------------------
  // 📦 Load bookings + vacations puis merge dans events
  // ------------------------------------------------------
  private loadCalendarData() {
    const shopId = this.shops?.[0]?._id;

    // Si pas de shop, on charge quand même bookings (au pire)
    this.loadingCalendar = true;

    // 1) bookings
    this.bookingService.getBookingByUserPro(this.me._id).subscribe({
      next: (bookings: any[]) => {
        const bookingEvents = (bookings || []).map((elem: any) => {
          const start = new Date(elem.start);
          const end = new Date(elem.end);

          const extendedProps = {
            ...(elem.extendedProps || {}),
            address: elem.address || 'Adresse inconnue',
            phoneNumber: elem.phoneNumber || 'Numéro inconnu',
            type: 'booking',
          };

          return {
            ...elem,
            start,
            end,
            textColor: '#000000',
            backgroundColor: elem.color,
            borderColor: elem.color,
            extendedProps,
          };
        });

        // 2) vacations si shopId
        if (!shopId) {
          this.calendarOptions = { ...this.calendarOptions, events: bookingEvents };
          this.loadingCalendar = false;
          return;
        }

        this.vacationService.getVacations(shopId).subscribe({
          next: (vacations: any[]) => {
            const vacationEvents = (vacations || []).map((v: any) =>
              this.mapVacationToCalendarEvent(v)
            );

            // ✅ merge : vacations d'abord (background) puis bookings
            this.calendarOptions = {
              ...this.calendarOptions,
              events: [...vacationEvents, ...bookingEvents],
            };

            this.loadingCalendar = false;
          },
          error: (err: any) => {
            console.error('Erreur lors du chargement des vacations :', err);

            // même si vacations fail, on affiche bookings
            this.calendarOptions = { ...this.calendarOptions, events: bookingEvents };
            this.loadingCalendar = false;
          },
        });
      },
      error: (error: any) => {
        console.error('Erreur lors du chargement des bookings pro :', error);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        this.loadingCalendar = false;
      },
    });
  }

  // ------------------------------------------------------
  // 🧱 Mapper une vacation -> background event FullCalendar
  // ------------------------------------------------------
  private mapVacationToCalendarEvent(v: any) {
    return {
      id: v._id,
      title: v.title || this.translate.instant('CALENDAR.VACATION') || 'Vacances',
      start: new Date(v.start),
      end: new Date(v.end),
      allDay: !!v.allDay,

      // ✅ FullCalendar moderne
      display: 'background',

      // ✅ noir très foncé
      backgroundColor: v.color || '#0b0b0b',

      // évite des comportements bizarres
      overlap: false,
      editable: false,

      extendedProps: {
        type: 'vacation',
      },
    };
  }

  // ------------------------------------------------------
  // ➕ Ouvrir la modale d’ajout d’événement (booking)
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
        new: true,
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        // ⚠️ shops guard
        if (!this.shops || this.shops.length === 0) {
          console.warn("Aucun shop disponible pour créer l'événement.");
        }

        const newBooking = {
          title: result.title,
          establishmentName: this.shops?.[0]?.name,
          productName: 'Some Product',
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

        if (!this.calendarOptions.events) {
          this.calendarOptions.events = [];
        }

        const sessionLangue = this.sessionService.getLang();

        this.bookingService.create(newBooking, sessionLangue!).subscribe({
          next: (response) => {
            console.log('Booking created successfully:', response);

            // ✅ ajoute au calendrier (sans recharger tout)
            this.calendarOptions = {
              ...this.calendarOptions,
              events: [
                ...(this.calendarOptions.events as any[]),
                {
                  ...newBooking,
                  textColor: '#000000',
                  backgroundColor: newBooking.color,
                  borderColor: newBooking.color,
                  extendedProps: {
                    address: newBooking.address || 'Adresse inconnue',
                    phoneNumber: newBooking.phoneNumber || 'Numéro inconnu',
                    type: 'booking',
                  },
                },
              ],
            };

            this.toastr.success(
              this.translate.instant('SUCCESS.BOOKING_CREATED') ||
                'Votre réservation a bien été enregistrée.'
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
  // 🖱️ Clic sur un événement
  // ------------------------------------------------------
  handleEventClick(info: any) {
    // ✅ ignore les clicks sur "vacations"
    if (info?.event?.extendedProps?.type === 'vacation') {
      return;
    }

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
        new: false,
      },
    });

    dialogRef.afterClosed().subscribe((result: any) => {
      if (result) {
        info.event.setProp('title', result.title);
        info.event.setDates(result.start, result.end);
        // 👉 Si tu veux persister, ajoute bookingService.update(...)
      }
    });
  }

  // ------------------------------------------------------
  // ✨ Toast d’erreur
  // ------------------------------------------------------
  private showCustomToast(message: string) {
    this.toastr.error(message);
  }
}

@Component({
  selector: 'content-calendar-item-dialog',
  templateUrl: './dialog/content-calendar-item-dialog.component.html',
  styleUrls: ['./dialog/content-calendar-item-dialog.component.scss'],
})
export class ContentCalendarItemDialog {
  constructor(
    public dialogRef: MatDialogRef<ContentCalendarItemDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  openGoogleMaps(address: string) {
    const encodedAddress = encodeURIComponent(address);
    const googleMapsUrl = `https://www.google.com/maps/place/${encodedAddress}`;
    window.open(googleMapsUrl, '_blank');
  }
}
