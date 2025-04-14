import { Component, Inject, Input, OnInit } from '@angular/core';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import frLocale from '@fullcalendar/core/locales/fr'; // Import de la localisation française
import {
    MAT_DIALOG_DATA,
    MatDialog,
    MatDialogRef,
} from '@angular/material/dialog';
import { BookingService } from '../../services/booking.service';

@Component({
    selector: 'app-agenda',
    templateUrl: './agenda.component.html',
    styleUrl: './agenda.component.scss',
})
export class AgendaComponent implements OnInit {
    @Input() me: any = {};
    @Input() shops: any[] = [];
    openNewEventModal = false;
    newEventData: any = {};

    calendarOptions: CalendarOptions = {
        plugins: [dayGridPlugin, timeGridPlugin],
        initialView: 'timeGridWeek', // Can be changed to 'dayGridMonth', 'timeGridDay', etc.
        weekends: true, // Control weekend visibility
        slotMinTime: '04:00:00', // Heure de début
        slotMaxTime: '23:59:59', // Heure de fin
        allDayText: 'Events', // Texte pour les événements de toute la journée
        eventOrder: 'status,-start',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay', // Ajout des boutons pour basculer entre mois et semaine
        },
        locale: frLocale,
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
        private bookingService: BookingService
    ) {}

    ngOnInit(): void {
        localStorage.setItem("menu-param", 'calendar')
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
                        elem.extendedProps.address =
                            elem.address || 'Adresse inconnue';
                        elem.extendedProps.phoneNumber =
                            elem.phoneNumber || 'Numéro inconnu';
                    });
                    this.calendarOptions.events = data;
                }
            },
            error: (error: any) => console.log(error),
        });
    }

    openAddEventModal() {
        const dialogRef = this.dialog.open(ContentCalendarItemDialog, {
            width: '400px',
            data: {
                title: '',
                start: '',
                end: '',
                address: '',
                phoneNumber: '',
                new: true, // Indicates a new event
            },
        });

        dialogRef.afterClosed().subscribe((result: any) => {
            if (result) {
                console.log('New event data:', result);

                // Create the new booking object using data from this.me, this.shops[0], and the modal result
                const newBooking = {
                    title: result.title,
                    establishmentName: this.shops[0].name,
                    productName: 'Some Product', // You may want to get this from the modal as well
                    address: result.address,
                    phoneNumber: result.phoneNumber,
                    clientId: this.me._id, // Assuming this.me represents the user
                    userProId: this.shops[0].idUser, // Assuming the shop owner is the professional
                    serviceId: null, // Assuming the first service is used; adjust as needed
                    shopId: this.shops[0]._id,
                    status: 'pending', // Default to pending
                    price: null, // Example price, adjust as needed
                    commission: null, // Example commission, adjust as needed
                    date: new Date(), // Use the current date
                    start: new Date(result.start),
                    end: new Date(result.end),
                    color: '#dddddd',
                    tva: null, // Example TVA, adjust as needed
                    shopEarnings: null, // Example earnings, adjust as needed
                    reviewAdded: false,
                };

                // Ensure that calendarOptions.events is always an array
                if (!this.calendarOptions.events) {
                    this.calendarOptions.events = [];
                }

                // Call the create method in the BookingService
                this.bookingService.create(newBooking).subscribe({
                    next: (response) => {
                        console.log('Booking created successfully:', response);
                        // Optionally add the new booking to the calendar
                        this.calendarOptions.events = [
                            ...(this.calendarOptions.events as any[]), // Ensure this is cast as an array
                            newBooking,
                        ];
                    },
                    error: (err) =>
                        console.error('Error creating booking:', err),
                });
            }
        });
    }

    handleEventClick(info: any) {
        const formatDate = (date: Date) => {
            const pad = (n: number) => (n < 10 ? '0' + n : n);
            const year = date.getFullYear();
            const month = pad(date.getMonth() + 1); // getMonth() is zero-based
            const day = pad(date.getDate());
            const hours = pad(date.getHours());
            const minutes = pad(date.getMinutes());
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        };

        const dialogRef = this.dialog.open(ContentCalendarItemDialog, {
            width: '400px',
            data: {
                title: info.event.title,
                start: formatDate(new Date(info.event.start)), // Format start date
                end: formatDate(new Date(info.event.end)), // Format end date
                address: info.event.extendedProps.address,
                phoneNumber: info.event.extendedProps.phoneNumber,
                new: false, // Indicates an existing event
            },
        });

        dialogRef.afterClosed().subscribe((result: any) => {
            if (result) {
                info.event.setProp('title', result.title);
                info.event.setDates(result.start, result.end);
            }
        });
    }
}

@Component({
    selector: 'content-calendar-item-dialog',
    templateUrl: './dialog/content-calendar-item-dialog.component.html',
    styleUrl: './dialog/content-calendar-item-dialog.component.scss',
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
