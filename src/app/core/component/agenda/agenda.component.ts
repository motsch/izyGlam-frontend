import { Component } from '@angular/core';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import frLocale from '@fullcalendar/core/locales/fr'; // Import de la localisation française
import esLocale from '@fullcalendar/core/locales/es';
import enLocale from '@fullcalendar/core/locales/en-gb';
import deLocale from '@fullcalendar/core/locales/de';

@Component({
    selector: 'app-agenda',
    templateUrl: './agenda.component.html',
    styleUrl: './agenda.component.scss',
})
export class AgendaComponent {
    calendarOptions: CalendarOptions = {
        plugins: [dayGridPlugin, timeGridPlugin],
        initialView: 'dayGridMonth', // Can be changed to 'timeGridWeek', 'timeGridDay', etc.
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
                title: 'Maquillage Toto',
                start: '2024-09-30',
                backgroundColor: '#f28b82', // Soft pink color
                borderColor: '#f28b82', // Match the event's border
                textColor: '#ffffff',
            },
        ],
    };
}
