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
    shopForm: FormGroup;
    serviceForm: FormGroup;
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
        this.shopForm = this.fb.group({
            name: ['', Validators.required],
            description: ['', Validators.required],
            image: ['', Validators.required],
            averagePrice: ['', Validators.required],
            ville: ['', Validators.required],
            latitude: [0, Validators.required],
            longitude: [0, Validators.required],
            morningStart: ['', Validators.required],
            morningEnd: ['', Validators.required],
            afternoonStart: ['', Validators.required],
            afternoonEnd: ['', Validators.required],
        });

        this.serviceForm = this.fb.group({
            name: ['', Validators.required],
            description: ['', Validators.required],
            price: [0, Validators.required],
            duration: [0, Validators.required],
        });
    }

    ngOnInit(): void {
        this.userService.getMe().subscribe({
            next: (me: any) => {
                console.log(me);
                this.shopService.getById(me.shopId).subscribe({
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
        if (this.shopForm.valid) {
            const shopData = this.shopForm.value;
            console.log('Enregistrement de la boutique:', shopData);
            // Ajouter la logique pour enregistrer la boutique via une API ou autre méthode
        }
    }

    saveService(): void {
        if (this.serviceForm.valid) {
            const serviceData = this.serviceForm.value;
            if (this.editingServiceIndex !== null) {
                // Modifier le service existant
                this.services[this.editingServiceIndex] = serviceData;
                this.editingServiceIndex = null;
            } else {
                // Ajouter un nouveau service
                this.services.push(serviceData);
            }
            this.serviceForm.reset();
        }
    }

    editService(service: any): void {
        this.editingServiceIndex = this.services.indexOf(service);
        this.serviceForm.patchValue(service);
    }

    deleteService(serviceId: string): void {
        this.services = this.services.filter(
            (service) => service._id !== serviceId
        );
    }
}
