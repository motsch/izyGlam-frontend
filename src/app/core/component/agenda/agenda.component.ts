import { Component, Inject, Input, input, OnInit } from '@angular/core';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import frLocale from '@fullcalendar/core/locales/fr'; // Import de la localisation française
import esLocale from '@fullcalendar/core/locales/es';
import enLocale from '@fullcalendar/core/locales/en-gb';
import deLocale from '@fullcalendar/core/locales/de';
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
    openNewEventModal = false;
    newEventData: any = {};
    calendarOptions: CalendarOptions = {
        plugins: [dayGridPlugin, timeGridPlugin],
        initialView: 'timeGridWeek', // Can be changed to 'dayGridMonth', 'timeGridDay', etc.
        weekends: true, // Control weekend visibility
        // allDaySlot: false, // Désactive la ligne "Toute la journée"
        slotMinTime: '04:00:00', // Heure de début
        slotMaxTime: '23:59:59', // Heure de fin
        allDayText: 'Events', // Texte pour les événements de toute la journée
        eventOrder: 'status,-start',
        // eventMinHeight: 40,
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
                allDay: true, // S'assure que c'est un événement sur toute la journée
            },
            {
                title: 'Vacances de Noël',
                start: '2024-12-20',
                end: '2025-01-03',
                rendering: 'background',
                backgroundColor: '#ffeb3b', // Couleur de fond pour les vacances de Noël
                textColor: '#000000',
                borderColor: 'transparent',
            },
            {
                title: 'Coiffure zigo',
                start: '2024-09-27T10:00:00', // Heure de début: 10h00
                end: '2024-09-27T11:00:00', // Heure de fin: 11h00
                backgroundColor: '#f28b82', // Couleur de fond
                borderColor: '#f28b82', // Couleur de la bordure
                textColor: '#000000', // Couleur du texte
                classNames: ['event-cancelled'],
                status: '',
            },
            {
                title: 'Coiffure zigo 3',
                start: '2024-09-27T10:00:00', // Heure de début: 10h00
                end: '2024-09-27T11:00:00', // Heure de fin: 11h00
                backgroundColor: '#f28b82', // Couleur de fond
                borderColor: '#f28b82', // Couleur de la bordure
                textColor: '#000000', // Couleur du texte
                classNames: ['event-cancelled'],
                status: '',
            },
            {
                title: 'Coiffure zigo 2',
                start: '2024-09-27T10:00:00', // Heure de début: 10h00
                end: '2024-09-27T11:00:00', // Heure de fin: 11h00
                backgroundColor: '#f28b82', // Couleur de fond
                borderColor: '#f28b82', // Couleur de la bordure
                textColor: '#ffffff', // Couleur du texte
                status: 'active',
            },

            {
                title: 'Coiffure Polo',
                start: '2024-09-27T12:00:00', // Heure de début: 10h00
                end: '2024-09-27T14:00:00', // Heure de fin: 11h00
                backgroundColor: '#f28b82', // Couleur de fond
                borderColor: '#f28b82', // Couleur de la bordure
                textColor: '#ffffff', // Couleur du texte
            },
        ],
        eventClick: this.handleEventClick.bind(this), // Lier la fonction de gestion de clic
    };

    // Injecter le service de dialogue
    constructor(
        public dialog: MatDialog,
        private bookingService: BookingService
    ) {}

    ngOnInit(): void {
        this.bookingService.getBookingByUserPro(this.me._id).subscribe({
            next: async (data: any) => {
                console.log('FRANCIS ===> ');
                console.log(data);

                if (this.calendarOptions && this.calendarOptions.events) {
                    for (let elem of data) {
                        elem.start = new Date(elem.start); // Pas besoin d'utiliser await ici
                        elem.end = new Date(elem.end); // Idem, les dates ne nécessitent pas async/await
                        elem.textColor = '#000000';
                        elem.backgroundColor = elem.color;
                        // Vérifie si `extendedProps` existe déjà, sinon le crée
                        if (!elem.extendedProps) {
                            elem.extendedProps = {}; // Initialise extendedProps si nécessaire
                        }

                        // Ajoute les informations supplémentaires dans `extendedProps`
                        elem.extendedProps.address =
                            elem.address || 'Adresse inconnue';
                        elem.extendedProps.phoneNumber =
                            elem.phoneNumber || 'Numéro inconnu';

                        console.log('elem ===> ' + JSON.stringify(elem));
                    }
                    data.push(
                        {
                            title: "Vacances d'été",
                            start: '2024-07-01',
                            end: '2024-09-01',
                            rendering: 'background',
                            backgroundColor: 'green',
                            allDay: true, // S'assure que c'est un événement sur toute la journée
                        },
                        {
                            title: 'Vacances de Noël',
                            start: '2024-12-20',
                            end: '2025-01-03',
                            rendering: 'background',
                            backgroundColor: '#ffeb3b', // Couleur de fond pour les vacances de Noël
                            textColor: '#000000',
                            borderColor: 'transparent',
                        }
                    );
                    this.calendarOptions.events = data;
                } else {
                    console.error(
                        'calendarOptions or calendarOptions.events is undefined'
                    );
                }
            },
            error: (error: any) => {
                console.log(error);
            },
        });
    }

    openAddEventModal() {
        // Ouvrir la modal avec les données de l'événement
        const dialogRef = this.dialog.open(ContentCalendarItemDialog, {
            width: '400px',
            data: {
                title: 'M. Jean Dupont',
                start: '',
                end: '',
                address: '',
                phoneNumber: '',
                new: true,
            },
        });

        // Récupérer les données modifiées lors de la fermeture de la modal
        dialogRef.afterClosed().subscribe((result: any) => {
            if (result) {
                // Mettre à jour l'événement avec les nouvelles données
                console.log('result');
                console.log(result);
                //info.event.setProp('title', result.title);
                // info.event.setDates(result.startStr, result.endStr);
            }
        });
    }

    onNoClick() {
        this.dialog.closeAll();
    }
    // Fonction appelée lors du clic sur un événement
    handleEventClick(info: any) {
        console.log('info');
        console.log(info);
        // Ouvrir la modal avec les données de l'événement
        const dialogRef = this.dialog.open(ContentCalendarItemDialog, {
            width: '400px',
            data: {
                title: info.event.title,
                start: info.event.startStr,
                end: info.event.endStr,
                address: info.event.extendedProps.address,
                phoneNumber: info.event.extendedProps.phoneNumber,
                new: false,
            },
        });

        // Récupérer les données modifiées lors de la fermeture de la modal
        dialogRef.afterClosed().subscribe((result: any) => {
            if (result) {
                // Mettre à jour l'événement avec les nouvelles données
                info.event.setProp('title', result.title);
                info.event.setDates(result.startStr, result.endStr);
            }
        });
    }
}
@Component({
    selector: 'content-calendar-item-dialog',
    templateUrl: './dialog/content-calendar-item-dialog.component.html', // Utilise le fichier HTML externe
    styleUrl: './dialog/content-calendar-item-dialog.component.scss', // Tu peux aussi ajouter des styles spécifiques ici
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
        // Encoder l'adresse pour être compatible avec Google Maps
        const encodedAddress = encodeURIComponent(address);

        // Construire l'URL Google Maps
        const googleMapsUrl = `https://www.google.com/maps/place/${encodedAddress}`;

        // Ouvrir Google Maps dans un nouvel onglet
        window.open(googleMapsUrl, '_blank');
    }
}
