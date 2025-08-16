import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BookingService } from '../../services/booking.service';
import { UserService } from '../../services/user.service';

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
    withdrawalForm: FormGroup;
    bankModalVisible = false;
    totalRevenue = 0;
    totalCommission = 0;
    evolution = 0;
    totalEarnings = 0;
    totalBookings = 0;
    cancelledBookings = 0;
    avgPrice = 0;
    reviewRatio = 0;
    topProducts:any[] = [];
    avgDuration = 0;
    bank = {
        iban: '',
        bic: '',
        bank_name: '',
        holder_name: '',
        country: ''
    };
    
    constructor(private fb: FormBuilder, private bookingService: BookingService, private userService: UserService) {
        this.withdrawalForm = this.fb.group({
            amount: ['', [Validators.required, Validators.min(1)]],
            accountDetails: ['', Validators.required],
        });
    }

    ngOnInit(): void {
        localStorage.setItem("menu-param", 'management');
        console.log('myShopData :', this.myShopData);
        // Tu peux initialiser tes données ici si nécessaire
        this.bank = this.me.bank;

        this.bookingService.getDashboardStats(this.myShopData._id).subscribe((data) => {
            console.log('Dashboard stats:', data);
            this.totalRevenue = data.totalRevenue;
            this.totalCommission = data.totalCommission;
            this.evolution = data.evolution;
            this.totalEarnings = data.totalEarnings;
            this.totalBookings = data.totalBookings;
            this.cancelledBookings = data.cancelledBookings;
            this.avgPrice = data.avgPrice;
            this.reviewRatio = data.reviewRatio;
            this.topProducts = data.topProducts;
            this.avgDuration = data.avgDuration;
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['myShopData'] && changes['myShopData'].currentValue) {
            this.shopCopyData = { ...this.myShopData }; // Met à jour la boutique affichée
            

        this.bookingService.getDashboardStats(this.myShopData._id).subscribe((data) => {
            console.log('Dashboard stats:', data);
            this.totalRevenue = data.totalRevenue;
            this.totalCommission = data.totalCommission;
            this.evolution = data.evolution;
            this.totalEarnings = data.totalEarnings;
            this.totalBookings = data.totalBookings;
            this.cancelledBookings = data.cancelledBookings;
            this.avgPrice = data.avgPrice;
            this.reviewRatio = data.reviewRatio;
            this.topProducts = data.topProducts;
            this.avgDuration = data.avgDuration;
        });
        }
    }
    openBankModal() {
        this.bankModalVisible = true;
    }

    closeBankModal() {
        this.bankModalVisible = false;
    }

    saveBankInfo() {
        // 🔒 Appel backend à ajouter ici
        console.log('Bank info:', this.bank);
        this.me.bank = this.bank;
        // Exemple de requête HTTP (remplace par ton UserService ou HttpClient)
        this.userService.update(this.me).subscribe({
            next: () => {
                // toast de succès
                this.closeBankModal();
            },
            error: (err: any) => {
                // gestion d'erreur
                console.error(err);
            }
        });
    }
}
