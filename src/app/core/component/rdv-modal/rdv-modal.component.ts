import { Component } from '@angular/core';

import {
  CalendarEvent,
  CalendarView
} from 'angular-calendar';
import { startOfDay, endOfDay, subDays, addDays, endOfMonth, isSameDay, isSameMonth, addHours } from 'date-fns';

@Component({
  selector: 'app-rdv-modal',
  templateUrl: './rdv-modal.component.html',
  styleUrls: ['./rdv-modal.component.scss']
})
export class RdvModalComponent {
  view: CalendarView = CalendarView.Week;

  viewDate: Date = new Date();

  events: CalendarEvent[] = [
    {
      start: subDays(startOfDay(new Date()), 1),
      end: addHours(new Date(), 1),
      title: 'A 3 day event',
      color: { primary: '#e3bc08', secondary: '#FDF1BA' },
      allDay: true,
      resizable: {
        beforeStart: true,
        afterEnd: true,
      },
      draggable: true,
    },
    {
      start: startOfDay(new Date()),
      title: 'An event with no end date',
      color: { primary: '#e3bc08', secondary: '#FDF1BA' },
    },
    {
      start: addHours(startOfDay(new Date()), 2),
      end: addHours(new Date(), 2),
      title: 'A draggable and resizable event',
      color: { primary: '#e3bc08', secondary: '#FDF1BA' },
      resizable: {
        beforeStart: true,
        afterEnd: true,
      },
      draggable: true,
    },
  ];

  setView(view: CalendarView) {
    this.view = view;
  }
}
