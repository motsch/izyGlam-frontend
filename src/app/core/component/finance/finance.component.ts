import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BookingService } from '../../services/booking.service';

@Component({
    selector: 'app-finance',
    templateUrl: './finance.component.html',
    styleUrls: ['./finance.component.scss'],
})
export class FinanceComponent implements OnInit {
    @Input() myShopData: any = {};
    shopCopyData: any = {};
    @Input() me: any = {};
    transactions: any[] = [];
    totalGenerated: number = 0; // Exemple de chiffre d'affaires total généré
    commission: number = 0; // Exemple de commission prélevée
    netToPay: number = 0; // Montant restant après déduction de la commission
    withdrawalForm: FormGroup;

    constructor(private fb: FormBuilder, private bookingService: BookingService) {
        this.withdrawalForm = this.fb.group({
            amount: ['', [Validators.required, Validators.min(1)]],
            accountDetails: ['', Validators.required],
        });
    }

    ngOnInit(): void {
        console.log('myShopData :', this.myShopData);
        // Tu peux initialiser tes données ici si nécessaire
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['myShopData'] && changes['myShopData'].currentValue) {
            this.shopCopyData = { ...this.myShopData }; // Met à jour la boutique affichée
            console.log('myShopData a été mis à jour :', this.shopCopyData);
            this.bookingService.getBookingsByShop(this.shopCopyData._id).subscribe({
                next: (data: any) => {
                    console.log("Bookings by shop :" + JSON.stringify(data));
                    this.commission = 0;
                    this.totalGenerated = 0;
                    this.netToPay = 0;
                    for(let elem of data) {
                        elem.date = new Date(elem.date);
                        this.totalGenerated += parseFloat(elem.price);
                        this.commission += parseFloat(elem.commission);
                    }
                    this.netToPay = this.totalGenerated - this.commission;
                    this.transactions = data;
                },
                error: (error: any) => {
                    console.log(error);
                    this.commission = 0;
                    this.totalGenerated = 0;
                    this.netToPay = 0;
                },
            });
        }
    }

    requestWithdrawal(): void {
        if (this.withdrawalForm.valid) {
            const request = this.withdrawalForm.value;
            console.log('Demande de virement soumise:', request);
            // Logique pour traiter la demande de virement, comme un appel API
            // Ajout de la demande à l'historique (exemple)
            this.transactions.unshift({
                date: new Date(),
                amount: request.amount,
                status: 'En attente',
            });
            this.netToPay -= request.amount;
            this.withdrawalForm.reset();
        }
    }
}
