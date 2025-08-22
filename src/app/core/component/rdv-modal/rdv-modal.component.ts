import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ScheduleService } from '../../services/schedule.service';
import { DatePipe } from '@angular/common';
import { SessionService } from '../../services/session.service';
import { Router } from '@angular/router';
import { CommunicationService } from '../../services/communication.service';
import { BookingService } from '../../services/booking.service';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-rdv-modal',
    templateUrl: './rdv-modal.component.html',
    styleUrls: ['./rdv-modal.component.scss'],
})
export class RdvModalComponent implements OnInit {
    imgStorageUrl: string = environment.APIimgStorageUrl.replace(/\/$/, '');
    openedIndex: number | null = null;
    shopId: string | null = null;
    schedules: any[] = [];
    service: any = {};

    constructor(
        public dialogRef: MatDialogRef<RdvModalComponent>,
        private scheduleService: ScheduleService,
        private datePipe: DatePipe,
        private sessionService: SessionService,
        private router: Router,
        public dialog: MatDialog,
        private communicationService: CommunicationService,
        private bookingService: BookingService
    ) { }

    ngOnInit() {
        if (localStorage.getItem('shopSelected')) {
            this.shopId = localStorage.getItem('shopSelected');
            this.generateDates();
            this.toggleDate(0);
        }
    }

    generateDates() {
        if (this.shopId) {
            const serviceString = localStorage.getItem('productToBuy');
            if (serviceString) {
                this.service = JSON.parse(serviceString);
                console.log('Service récupéré :', this.service);
                const serviceId = this.service._id;
                if (serviceId) {
                    this.bookingService
                        .getAvailableTimeSlots(this.shopId, serviceId)
                        .subscribe({
                            next: (data: any[]) => {
                                this.schedules = this.formatAvailableSlots(data);
                                console.log('Créneaux formatés :', this.schedules);
                            },
                            error: (error: any) => {
                                console.error('Erreur récupération créneaux:', error);
                            },
                        });
                }
            } else {
                console.warn('Aucun produit sélectionné dans le localStorage');
            }
        }
    }

    formatAvailableSlots(data: any[]): any[] {
        const formattedSchedules = data.map(slot => ({
            date: this.formatDate(slot.date),
            times: [{
                dateBrut: slot.date,
                start: slot.start,
                end: slot.end
            }]
        }));

        const groupedSchedules = this.groupBy(formattedSchedules, 'date');

        return Object.keys(groupedSchedules).map(date => ({
            date: date,
            times: groupedSchedules[date].map((slot: any) => slot.times[0])
        }));
    }

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
            (d) => new Date(d.date).getDate() === today
        );
    }

    toggleDate(index: number) {
        if (this.openedIndex === index && this.schedules.length > 1) {
            return;
        }
        this.openedIndex = index;
    }

    onNoClick(): void {
        this.dialogRef.close();
    }

    slotClick(slot: any, date: any) {
        console.log('Créneau sélectionné :', slot);
        console.log('Date sélectionnée :', date);

        const objetToSave: any = {
            slot: slot,
            shopId: this.shopId,
            date: date.date
        };

        if (!this.sessionService.isLoggedIn()) {
            this.dialog.closeAll();
            this.router.navigate(['sign-in']);
        } else {
            console.log('Utilisateur connecté');
            localStorage.setItem('selectItemFromShop', JSON.stringify(objetToSave));
            this.dialog.closeAll();
            this.router.navigate(['billing']);
        }
    }
    onImageError(event: Event) {
        const imgElement = event.target as HTMLImageElement;
        imgElement.src = this.imgStorageUrl + '/uploads/images/logo.png';
    }
}
