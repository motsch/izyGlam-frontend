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

@Component({
    selector: 'app-payement',
    templateUrl: './payement.component.html',
    styleUrls: ['./payement.component.scss'],
})
export class PayementComponent implements OnInit {
    step = 1;
    shop: any;
    startSlot: any | null;
    itemToBuy: any | null;
    bill: any | null = {};
    date: string | null = '';
    imgStorageUrl: string = environment.imgStorageUrl;
    me: any = {};
    price: string | null = null;
    itemToBuy2: any | null;
    constructor(
        private router: Router,
        private datePipe: DatePipe,
        private communicationService: CommunicationService,
        private shopService: ShopService,
        private scheduleService: ScheduleService,
        private userService: UserService,
        public dialog: MatDialog
    ) {}

    ngOnInit(): void {
        this.itemToBuy = localStorage.getItem('selectItemFromShop');
        this.itemToBuy = JSON.parse(this.itemToBuy);
        this.itemToBuy2 = localStorage.getItem('productToBuy');
        console.log(this.itemToBuy2);
        this.itemToBuy2 = JSON.parse(this.itemToBuy2);
        if (this.itemToBuy2 && this.itemToBuy2.price) {
            this.price = this.itemToBuy2.price;
            console.log('this.price : ' + this.price);
        }
        console.log(this.itemToBuy);
        this.startSlot = this.itemToBuy.slot.startTime;
        // this.shop._id = this.itemToBuy.shopId;
        this.shopService
            .getById(this.itemToBuy.shopId)
            .subscribe((data: any) => {
                console.log(data);
                this.shop = data;
                this.scheduleService
                    .getById(this.itemToBuy.dateId)
                    .subscribe((data2: any) => {
                        console.log(data2);
                        this.date = this.formatDate(data2.date);
                        this.userService.getMe().subscribe((data3: any) => {
                            console.log(data3);
                            this.me = data3;
                            this.me.initials =
                                data3.firstname.charAt(0) +
                                data3.lastname.charAt(0);
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
            });
        // console.log((this.itemToBuy2));
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
}
