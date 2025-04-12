import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShopService } from '../../services/shop.service';
import { Router } from '@angular/router';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';
import { ShopTemplateService } from '../../services/shop-template.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-create-shop-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-shop-modal.component.html',
  styleUrl: './create-shop-modal.component.scss',
})
export class CreateShopModalComponent {
    me: any = {};
    newShopUser: any = {};
    error: string | null = null;
    isUserConnected: boolean = false;
    alreadyProfessionnal: boolean = false;
    categories: any[] = [];

    constructor(
        private userService: UserService,
        private shopService: ShopService,
        private productService: ProductService,
        private router: Router,
        private shopTemplateService: ShopTemplateService,
        private categoryService: CategoryService
    ) {}

    ngOnInit() {
        this.categoryService.getAll().subscribe({
            next: (data: any) => {
                this.categories = data;
            },
            error: (error: any) => {
                console.log(error);
            },
        });
        this.newShopUser.companyType = 'coiffure';
        this.newShopUser.countryIndication = 'FR';
        this.userService.getMe().subscribe({
            next: (data: any) => {
                this.me = { ...data };
                if (
                    this.me.role === 'professionnel' ||
                    this.me.role === 'entreprise'
                ) {
                    this.alreadyProfessionnal = true;
                }
                this.isUserConnected = true;
            },
            error: (error: any) => {
                console.log(error);
                console.log('Error getting user');
            },
        });
    }
    onSubmit() {
        // let test = this.createShop('coiffure', 'id_fake');
        // console.log(test);

        // Si toutes les vérifications passent, on continue
        if (this.isUserConnected) {
            this.me.shopCompany = this.newShopUser;
            this.me.role = 'professionnel';
            this.userService.update(this.me).subscribe({
                next: async (data: any) => {
                    console.log(data);
                    let shopToCreate: any = {};
                    shopToCreate.name =
                        this.me.firstname +
                        ' ' +
                        this.me.lastname.charAt(0) +
                        '.';
                    await this.createShop(
                        this.newShopUser.companyType,
                        this.me._id
                    );
                    this.router.navigate(['/profile']);
                },
                error: (error: any) => {
                    console.log(error);
                },
            });
        }
    }

    createShop(type: string, idUser: string): any {
        this.shopTemplateService.getServiceTemplatesByCategory(type).subscribe({
            next: (data: any[]) => {
                let servicesToCreate: any[] = data;
                let newShopToCreate: any = {};

                if (this.isUserConnected) {
                    newShopToCreate.name =
                        this.me.firstname +
                        ' ' +
                        this.me.lastname.charAt(0) +
                        '.';
                } else {
                    newShopToCreate.name =
                        this.newShopUser.firstname +
                        ' ' +
                        this.newShopUser.lastname.charAt(0) +
                        '.';
                }
                let categoryToSelect = this.categories.find(
                    (x: any) => x.filter === type
                )
                let description = categoryToSelect.descriptionTrad;
                newShopToCreate.description = description;
                newShopToCreate.image = 'image';
                newShopToCreate.note = '5';
                newShopToCreate.type = type;
                newShopToCreate.ville = 'Paris';
                newShopToCreate.maxDistance = 15;
                newShopToCreate.idUser = idUser;
                newShopToCreate.promo = {};
                newShopToCreate.promo.active = false;
                newShopToCreate.promo.type = '1';
                newShopToCreate.hours = {};
                newShopToCreate.trad = categoryToSelect.trad;
                newShopToCreate.hours.morning = {};
                newShopToCreate.hours.morning.start = '09:00';
                newShopToCreate.hours.morning.end = '12:00';
                newShopToCreate.hours.afternoon = {};
                newShopToCreate.hours.afternoon.start = '13:00';
                newShopToCreate.hours.afternoon.end = '18:00';
                this.shopService.create(newShopToCreate).subscribe({
                    next: (data: any) => {
                        console.log(data);
                        for(let elem of servicesToCreate) {
                            elem.shopId = data._id;
                        }
                        this.productService.createMultiple(servicesToCreate).subscribe({
                            next: (data: any) => {
                                console.log(data);
                                return data;
                            },
                            error: (error: any) => {
                                console.log(error);
                                return error;
                            },
                        });
                        // return data;
                    },
                    error: (error: any) => {
                        console.log('Error : ' + JSON.stringify(error));
                        console.log(error);
                        return error;
                    },
                });
            },
            error: (error: any) => {
                console.log(error);
                return error;
            },
        });
    }

    formChecking() {}
}
