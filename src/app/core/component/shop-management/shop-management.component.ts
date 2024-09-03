import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { ShopService } from '../../services/shop.service';
import { ProductService } from '../../services/product.service';

@Component({
    selector: 'app-shop-management',
    templateUrl: './shop-management.component.html',
    styleUrls: ['./shop-management.component.scss'],
})
export class ShopManagementComponent implements OnInit {
    services: any[] = [];
    editingServiceIndex: number | null = null;
    myShopData: any = {};
    shopCopyData: any | null = {
        name: '',
        description: '',
        image: '',
        averagePrice: '',
        ville: '',
        location: {
            latitude: null,
            longitude: null,
        },
    };

    myarticlesData: any[] = [];
    articlesCopyData: any[] = [];
    constructor(
        private fb: FormBuilder,
        private userService: UserService,
        private shopService: ShopService,
        private productService: ProductService
    ) {
    }

    ngOnInit(): void {
        this.userService.getMe().subscribe({
            next: (me: any) => {
                console.log(me);
                this.shopService.getById(me.shopIds[0]).subscribe({
                    next: (shop: any) => {
                        console.log(shop);
                        this.shopCopyData = { ...shop };
                        this.myShopData = shop;
                        this.productService
                            .getProductsByShop(shop._id)
                            .subscribe({
                                next: (data: any[]) => {
                                    console.log(data);
                                    this.myarticlesData = data;
                                    this.articlesCopyData = [...data];
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
            },
            error: (error: any) => {
                console.log(error);
            },
        });
    }

    saveShop(): void {
        this.myShopData = this.shopCopyData;
        console.log('Enregistrement de la boutique:', this.myShopData);
            // Ajouter la logique pour enregistrer la boutique via une API ou autre méthode
    }
}
