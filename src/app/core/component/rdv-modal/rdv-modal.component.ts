import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-rdv-modal',
  templateUrl: './rdv-modal.component.html',
  styleUrls: ['./rdv-modal.component.scss']
})
export class RdvModalComponent implements OnInit {
  dates: { label: string; date: Date }[] = [];
  timeSlots = ['10:00', '10:20', '10:40', '12:00', '12:20', '12:40'];
  openedIndex: number | null = null;

  constructor(public dialogRef: MatDialogRef<RdvModalComponent>) {}

  ngOnInit() {
    this.generateDates();
    this.initializeOpenDate();
  }

  generateDates() {
    const now = new Date();
    const startHour = now.getHours();
    
    let startDate = startHour >= 23 ? new Date(now.setDate(now.getDate() + 1)) : now;

    for (let i = 0; i < 10; i++) {
      let date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const options = { weekday: 'long', day: 'numeric', month: 'long' } as const;
      const label = date.toLocaleDateString('fr-FR', options);

      this.dates.push({ label: label.charAt(0).toUpperCase() + label.slice(1), date });
    }
  }

  initializeOpenDate() {
    const now = new Date();
    const today = now.getDate();

    this.openedIndex = this.dates.findIndex(d => d.date.getDate() === today);
  }

  toggleDate(index: number) {
    if (this.openedIndex === index && this.dates.length > 1) {
      return;
    }
    this.openedIndex = index;
  }

  onNoClick(): void {
    this.dialogRef.close(); // Ferme la modal
  }
}
