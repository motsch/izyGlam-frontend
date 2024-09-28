import { Component, Inject } from '@angular/core';
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

@Component({
    selector: 'app-agenda',
    templateUrl: './agenda.component.html',
    styleUrl: './agenda.component.scss',
})
export class AgendaComponent {
    calendarOptions: CalendarOptions = {
        plugins: [dayGridPlugin, timeGridPlugin],
        initialView: 'timeGridWeek', // Can be changed to 'dayGridMonth', 'timeGridDay', etc.
        weekends: true, // Control weekend visibility
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek', // Ajout des boutons pour basculer entre mois et semaine
        },
        locale: frLocale,
        events: [
            {
                title: 'Coifure Durant',
                start: '2024-09-28',
                backgroundColor: '#f28b82', // Soft pink color
                borderColor: '#f28b82', // Match the event's border
                textColor: '#ffffff',
            }, // Replace with dynamic data

            {
                title: 'Coiffure zigo',
                start: '2024-09-27T10:00:00', // Heure de début: 10h00
                end: '2024-09-27T11:00:00', // Heure de fin: 11h00
                backgroundColor: '#f28b82', // Couleur de fond
                borderColor: '#f28b82', // Couleur de la bordure
                textColor: '#ffffff', // Couleur du texte
            },

            {
                title: 'Coiffure Polo',
                start: '2024-09-27T12:00:00', // Heure de début: 10h00
                end: '2024-09-27T14:00:00', // Heure de fin: 11h00
                backgroundColor: '#f28b82', // Couleur de fond
                borderColor: '#f28b82', // Couleur de la bordure
                textColor: '#ffffff', // Couleur du texte
            },

            {
                title: 'Maquillage Toto',
                start: '2024-09-30',
                backgroundColor: '#f28b82', // Soft pink color
                borderColor: '#f28b82', // Match the event's border
                textColor: '#ffffff',
            },
        ],
        eventClick: this.handleEventClick.bind(this), // Lier la fonction de gestion de clic
    };

    // Injecter le service de dialogue
    constructor(public dialog: MatDialog) {}

    // Fonction appelée lors du clic sur un événement
    handleEventClick(info: any) {
        // Ouvrir la modal avec les données de l'événement
        const dialogRef = this.dialog.open(ContentCalendarItemDialog, {
            width: '400px',
            data: {
                title: info.event.title,
                start: info.event.startStr,
                end: info.event.endStr,
            },
        });

        // Récupérer les données modifiées lors de la fermeture de la modal
        dialogRef.afterClosed().subscribe((result: any) => {
            if (result) {
                // Mettre à jour l'événement avec les nouvelles données
                info.event.setProp('title', result.title);
                info.event.setDates(result.start, result.end);
            }
        });
    }
}
@Component({
  selector: 'content-calendar-item-dialog',
  templateUrl: './dialog/content-calendar-item-dialog.component.html', // Utilise le fichier HTML externe
  styleUrl: './dialog/content-calendar-item-dialog.component.scss' // Tu peux aussi ajouter des styles spécifiques ici
})
export class ContentCalendarItemDialog {
    constructor(
        public dialogRef: MatDialogRef<ContentCalendarItemDialog>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {}

    onNoClick(): void {
        this.dialogRef.close();
    }
}
