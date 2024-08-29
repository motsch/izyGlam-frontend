import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ScheduleService } from '../../services/schedule.service';
import { DatePipe } from '@angular/common';
import { SessionService } from '../../services/session.service';
import { Router } from '@angular/router';
import { CommunicationService } from '../../services/communication.service';

@Component({
    selector: 'app-rdv-modal',
    templateUrl: './rdv-modal.component.html',
    styleUrls: ['./rdv-modal.component.scss'],
})
export class RdvModalComponent implements OnInit {
    openedIndex: number | null = null;
    shopId: string | null = null;
    schedules: any[] = [];

    constructor(
        public dialogRef: MatDialogRef<RdvModalComponent>,
        private scheduleService: ScheduleService,
        private datePipe: DatePipe,
        private sessionService: SessionService,
        private router: Router,
        public dialog: MatDialog,
        private communicationService: CommunicationService
    ) {}

    ngOnInit() {
        if (localStorage.getItem('shopSelected')) {
            this.shopId = localStorage.getItem('shopSelected');
            this.generateDates();
            this.toggleDate(0);
        }
    }

    generateDates() {
        if (this.shopId) {
            this.scheduleService
                .getByShopId(this.shopId)
                .subscribe((data: any[]) => {
                    console.log('Data : ' + JSON.stringify(data));
                    for(let elem of data) {
                      elem.dateToShow = this.formatDate(elem.date)
                    }
                    this.schedules = data;
                });
        }
    }
    formatDate(dateString: string): string | null {
      const date = new Date(dateString);
      return this.datePipe.transform(date, 'EEEE d MMMM y', 'fr-FR');
    }

    initializeOpenDate() {
        const now = new Date();
        const today = now.getDate();

        this.openedIndex = this.schedules.findIndex(
            (d) => d.date.getDate() === today
        );
    }

    toggleDate(index: number) {
        if (this.openedIndex === index && this.schedules.length > 1) {
            return;
        }
        this.openedIndex = index;
    }

    onNoClick(): void {
        this.dialogRef.close(); // Ferme la modal
    }

    slotClick(slot:any, dateId:string, type:string) {
      console.log(slot)
      console.log(dateId)
      let objetToSave:any = {};
      objetToSave.slot = {};
      objetToSave.slot = slot;
      objetToSave.dateId = dateId;
      objetToSave.type = type;
      objetToSave.shopId = this.shopId;
      if(!this.sessionService.isLoggedIn()){
        this.dialog.closeAll();
        this.router.navigate(['sign-in']);
      } else {
        console.log("logged")
        localStorage.setItem('selectItemFromShop', JSON.stringify(objetToSave));
        // this.communicationService.setItemToBuy = objetToSave;
        this.dialog.closeAll();
        this.router.navigate(['billing']);
      }
    }
}
