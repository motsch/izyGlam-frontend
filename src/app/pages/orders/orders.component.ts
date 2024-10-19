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
            totalPrice: '45,00 €',
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
                    next: async (data: any) => {
                        console.log(data);
                        for (let elem of data) {
                          this.orders.push(...data);
                        }
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
