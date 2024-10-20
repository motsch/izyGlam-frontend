import { Component, OnInit } from '@angular/core';
import { BookingService } from 'src/app/core/services/booking.service';
import { ShopService } from 'src/app/core/services/shop.service';
import { UserService } from 'src/app/core/services/user.service';

@Component({
    selector: 'app-orders',
    templateUrl: './orders.component.html',
    styleUrls: ['./orders.component.scss'],
})
export class OrdersComponent implements OnInit {
    me: any = {};
    orders = [
        {
            establishmentName: 'Carrefour',
            totalItems: 1,
            totalPrice: '22,68 €',
            orderDate: '10 mars',
            orderTime: '20:13',
            items: [
                {
                    name: 'Kristal - Pavés de saumon atlantique',
                    quantity: 1,
                    size: '(2 pièces)',
                },
            ],
        },
        {
            establishmentName: 'Franprix',
            totalItems: 1,
            price: '45,00 €',
            orderDate: '10 mars',
            orderTime: '19:05',
            items: [
                {
                    name: 'Pavé de saumon Maelström Sacrebleu!',
                    quantity: 1,
                    size: '2x140g',
                },
            ],
        },
        // Ajoutez ici d'autres commandes suivant le même format...
    ];

    constructor(
        private bookingService: BookingService,
        private userService: UserService,
        private shopService: ShopService
    ) {}

    ngOnInit(): void {
        this.userService.getMe().subscribe({
            next: (data: any) => {
                this.me = data;
                this.bookingService.getBookingByClient(data._id).subscribe({
                    next: async (bookings: any[]) => {
                        console.log('bookings: ' + JSON.stringify(bookings));
                        for (let elem of bookings) {
                            elem.items = [];
                            elem.items[0] = {};
                            elem.items[0].quantity = 1;
                            elem.items[0].name = elem.productName;
                            elem.totalItems = 1;// new Date(elem.start).toLocaleDateString();
                            elem.orderDate = new Date(elem.start).toLocaleDateString();
                            elem.orderTime = new Date(elem.start).toLocaleTimeString();
                            this.orders.push(elem);
                        }

                        console.log(this.orders);
                    },
                    error: (error: any) => {
                        console.log(error);
                    },
                });
            },

            error: (error: any) => {
                console.log(error);
            },
        });
    }
}
