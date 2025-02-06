import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CommunicationService } from 'src/app/core/services/communication.service';
import { ScheduleService } from 'src/app/core/services/schedule.service';
import { ShopService } from 'src/app/core/services/shop.service';
import { UserService } from 'src/app/core/services/user.service';
import { AddressModalComponent } from 'src/app/core/component/address-modal/address-modal.component';
import { ProchesModalComponent } from 'src/app/core/component/proches-modal/proches-modal.component';
import { environment } from 'src/environments/environment';
import { AdminService } from 'src/app/core/services/admin.service';
import { BookingService } from 'src/app/core/services/booking.service';

@Component({
    selector: 'app-payement',
    templateUrl: './payement.component.html',
    styleUrls: ['./payement.component.scss'],
})
export class PayementComponent implements OnInit {
    step = 1;
    shop: any;
    startSlot: any | null;
    endSlot: any | null;
    dateSlot: any | null;
    itemToBuy: any | null;
    bill: any | null = {};
    orderDate: string | null = '';
    date: string | null = '';
    imgStorageUrl: string = environment.imgStorageUrl;
    me: any = {};
    price: string = '';
    itemToBuy2: any | null;
    adminSettings: any = {};
    meSex: string = 'Mme.';
    prestationDateForBill: string | undefined;
    constructor(
        private router: Router,
        private datePipe: DatePipe,
        private communicationService: CommunicationService,
        private shopService: ShopService,
        private scheduleService: ScheduleService,
        private userService: UserService,
        public dialog: MatDialog,
        private adminService: AdminService,
        private bookingService: BookingService
    ) { }

    ngOnInit(): void {
        this.adminService.getAdminSettings().subscribe({
            next: (data: any) => {
                console.log(data);
                this.adminSettings = data;
                console.log(this.adminSettings);
            },
            error: (error: any) => {
                console.log(error);
            },
        });
        this.itemToBuy = localStorage.getItem('selectItemFromShop');
        this.itemToBuy = JSON.parse(this.itemToBuy);
        console.log("itemToBuy");
        console.log(this.itemToBuy);
        this.startSlot = this.itemToBuy.slot.start;
        this.endSlot = this.itemToBuy.slot.end;
        this.dateSlot = this.itemToBuy.date;
        this.itemToBuy2 = localStorage.getItem('productToBuy');
        console.log(this.itemToBuy2);
        this.itemToBuy2 = JSON.parse(this.itemToBuy2);
        if (this.itemToBuy2 && this.itemToBuy2.price) {
            this.price = this.itemToBuy2.price;
            console.log('this.price : ' + this.price);
        }
        console.log(this.itemToBuy);
        // this.shop._id = this.itemToBuy.shopId;
        this.shopService
            .getById(this.itemToBuy.shopId)
            .subscribe((data: any) => {
                console.log(data);
                this.shop = data;
                this.userService.getMe().subscribe((data3: any) => {
                    console.log(data3);
                    if (data3.sex === 'male') {
                        this.meSex = 'M.';
                    }
                    this.me = data3;
                    this.me.initials =
                        data3.firstname.charAt(0) + data3.lastname.charAt(0);
                    if (!this.bill) {
                        this.bill = {};
                    }
                    this.bill.client = this.me._id;
                    let addressTemp = this.me.address.find((x: any) => {
                        return x.main === true;
                    });

                    this.bill.address = addressTemp
                        ? addressTemp._id
                        : this.me.address[0]._id;
                });
            });
        // console.log((this.itemToBuy2));
        let dateBrut: any = localStorage.getItem("selectItemFromShop");
        if (dateBrut) {
            dateBrut = JSON.parse(dateBrut);
        }
        this.prestationDateForBill = dateBrut.slot.dateBrut;
    }
    openProchesModal() {
        this.dialog.open(ProchesModalComponent, {
            width: '400px',
            data: {
                user: this.me,
            },
        });
    }

    openAddressModal() {
        this.dialog.open(AddressModalComponent, {
            width: '400px',
            data: {
                user: this.me,
            },
        });
    }

    formatDate(dateString: string): string | null {
        const date = new Date(dateString);
        return this.datePipe.transform(date, 'EEEE d MMMM y', 'fr-FR');
    }
    addStep() {
        this.step += 1;
        console.log(this.step);
    }

    removeStep() {
        this.step -= 1;
        console.log(this.step);
    }

    validate() {
        console.log('Validate !');
        console.log(this.bill);
        this.bill.clientId = this.bill.client;
        if (this.bill.client === this.me._id) {
            this.bill.title =
                this.meSex + ' ' + this.me.firstname + ' ' + this.me.lastname;
            this.bill.phoneNumber = this.me.phone;
        } else {
            this.me.proches.find((x: any) => {
                if (x._id === this.bill.client) {
                    this.bill.title =
                        this.meSex + ' ' + x.firstname + ' ' + x.lastname;
                    this.bill.clientId = this.me._id;
                    this.bill.phoneNumber = x.phone;
                }
            });
        }

        this.me.address.find((x: any) => {
            if (x._id === this.bill.address) {
                this.bill.address =
                    x.street +
                    ', ' +
                    x.code_postal +
                    ', ' +
                    x.city +
                    ', ' +
                    x.country;
            }
        });
        // this.bill.userProId = this.
        this.bill.start = this.convertToISO(this.startSlot);// : Date; // Date et heure de début du créneau réservé
        // this.bill.end = this.date + this.startSlot + this.itemToBuy2.duration; // : Date; // Date et heure de fin du créneau réservé
        console.log(this.date);
        console.log(this.startSlot);
        this.bill.end = this.convertToISO(this.endSlot);
        this.bill.date = this.dateSlot;

        this.bill.shopEarnings = this.price;
        this.bill.price =
            parseInt(this.price) +
            parseInt(this.price) * this.adminSettings.commissionRate +
            this.adminSettings.serviceFee;
        this.bill.orderDate = new Date();
        this.bill.status = 'pending';
        this.bill.color = this.itemToBuy2.color;
        this.bill.shopId = this.shop._id;
        this.bill.establishmentName = this.shop.name;
        this.bill.serviceId = this.itemToBuy2._id;
        this.bill.productName = this.itemToBuy2.name;
        this.bill.userProId = this.shop.idUser;
        this.bill.commission =
            parseInt(this.price) * this.adminSettings.commissionRate;
        this.bill.tva = this.bill.price * this.adminSettings.taxRate;
        this.bill.price = this.bill.price + this.bill.tva;
        console.log(JSON.stringify(this.itemToBuy)); // = localStorage.getItem('selectItemFromShop');
        // this.itemToBuy = JSON.parse(this.itemToBuy);
        console.log(JSON.stringify(this.itemToBuy2)); // = localStorage.getItem('productToBuy');
        // console.log(this.itemToBuy2);
        console.log(JSON.stringify(this.bill));

        this.bookingService.create(this.bill).subscribe({
            next: (data: any) => {
                console.log(data);
                this.router.navigate(['main']);
            },
            error: (error: any) => {
                console.log(error);
            },
        });
        /*
        userProId: string; // Référence à l'utilisateur qui fait la réservation
        serviceId: string; // Référence au service réservé
        shopId: string; // Référence à la boutique où le service est réservé
        status: "pending" | "confirmed" | "cancelled"; // Statut de la réservation
        price: string;
        commission: string;
        */
    }

    goBackToMain() {
        let shopId;
        if (localStorage.getItem('shopSelected')) {
            shopId = localStorage.getItem('shopSelected');
        }
        if (shopId) {
            this.router.navigate(['shop', shopId]);
        } else {
            this.router.navigate(['main']);
        }
    }

    // date en france
    convertToISO(timeStr: string): string {
        // Combine date and time into a single string
        // Étape 1 : Combiner la date et l'heure
        const combined = this.prestationDateForBill + ' ' + timeStr;

        // Create a Date object from the combined string (local time)
        const date = new Date(combined);

        // Format to 'YYYY-MM-DDTHH:mm:ss' without the timezone conversion
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth() is zero-indexed
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = '00'; // You can adjust this to get actual seconds if needed

        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    }

    // Fonction pour ajouter des minutes à une date
    addMinutes(date: Date, minutes: number): Date {
        return new Date(date.getTime() + minutes * 60000); // 60000 ms = 1 minute
    }
}
