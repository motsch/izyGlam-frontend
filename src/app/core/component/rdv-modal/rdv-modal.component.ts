import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ScheduleService } from '../../services/schedule.service';
import { DatePipe } from '@angular/common';
import { SessionService } from '../../services/session.service';
import { Router } from '@angular/router';
import { CommunicationService } from '../../services/communication.service';
import { BookingService } from '../../services/booking.service';

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
        private communicationService: CommunicationService,
        private bookingService: BookingService
    ) {}ngOnInit() {
        if (localStorage.getItem('shopSelected')) {
            this.shopId = localStorage.getItem('shopSelected');
            this.generateDates();
            this.toggleDate(0);
        }
    }
    
    generateDates() {
        if (this.shopId) {
            let service = localStorage.getItem('productToBuy');
            let serviceId = JSON.parse(service!)._id;
            if (serviceId) {
                this.bookingService
                    .getAvailableTimeSlots(this.shopId, serviceId)
                    .subscribe({
                        next: (data: any[]) => {
                            // Process the received data (list of available time slots)
                            this.schedules = this.formatAvailableSlots(data);
                            console.log(this.schedules);
                        },
                        error: (error: any) => {
                            console.log(error);
                        },
                    });
            }
        }
    }
    
    // Format the available slots returned by the API to fit your schedules structure
    formatAvailableSlots(data: any[]): any[] {
        const formattedSchedules = data.map(slot => {
            return {
                date: this.formatDate(slot.date),  // Format the date for display
                times: [
                    {
                        dateBrut: slot.date,
                        start: slot.start,
                        end: slot.end
                    }
                ]
            };
        });
    
        // Group slots by date if necessary
        const groupedSchedules = this.groupBy(formattedSchedules, 'date');
        
        return Object.keys(groupedSchedules).map(date => ({
            date: date,
            times: groupedSchedules[date].map((slot:any) => slot.times[0]) // If there are multiple times per day
        }));
    }
    
    // Helper function to group by date
    groupBy(array: any[], key: string) {
        return array.reduce((result, currentValue) => {
            (result[currentValue[key]] = result[currentValue[key]] || []).push(currentValue);
            return result;
        }, {});
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

    slotClick(slot: any, date: any) {
        console.log(slot);
        console.log(date);
        let objetToSave: any = {};
        // objetToSave.slot = {};
        objetToSave.slot = slot;
        objetToSave.shopId = this.shopId;
        objetToSave.date = date.date;
        if (!this.sessionService.isLoggedIn()) {
            this.dialog.closeAll();
            this.router.navigate(['sign-in']);
        } else {
            console.log('logged');
            localStorage.setItem(
                'selectItemFromShop',
                JSON.stringify(objetToSave)
            );
            // this.communicationService.setItemToBuy = objetToSave;
            this.dialog.closeAll();
            this.router.navigate(['billing']);
        }
    }
}
