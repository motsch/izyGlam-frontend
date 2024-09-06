import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { ShopService } from '../../services/shop.service';
import { ProductService } from '../../services/product.service';

@Component({
    selector: 'app-shop-management',
    templateUrl: './shop-management.component.html',
    styleUrls: ['./shop-management.component.scss'],
})
export class ShopManagementComponent implements OnInit, OnChanges {
    @Input() myShopData: any = {};
    @Input() me: any = {};
    
    shopCopyData: any = {
        name: '',
        description: '',
        image: '',
        averagePrice: '',
        ville: '',
        location: {
            latitude: 0,
            longitude: 0,
        },
        hours: {
            morning: {
                start: 0,
                end: 0,
            },
            afternoon: {
                start: 0,
                end: 0,
            },
        },
    };

    constructor(
        private fb: FormBuilder,
        private userService: UserService,
        private shopService: ShopService,
        private productService: ProductService
    ) {}

    ngOnInit(): void {
        console.log('myShopData :', this.myShopData);
        // Tu peux initialiser tes données ici si nécessaire
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['myShopData'] && changes['myShopData'].currentValue) {
            this.shopCopyData = { ...this.myShopData }; // Met à jour la boutique affichée
            console.log('myShopData a été mis à jour :', this.shopCopyData);
        }
    }

    saveShop(): void {
        this.myShopData = this.shopCopyData;
        console.log('Enregistrement de la boutique:', this.myShopData);
        this.shopService.update(this.myShopData).subscribe({
            next: (data: any) => {
                console.log(data);
                this.shopCopyData = { ...data };
                this.myShopData = { ...data };
            },
            error: (error: any) => {
                console.log(error);
            },
        });
    }
}
