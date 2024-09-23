import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ShopService } from '../../services/shop.service';
import { ShopTemplateService } from '../../services/shop-template.service';
import { max } from 'lodash';
import { CategoryService } from '../../services/category.service';

@Component({
    selector: 'app-create-shop',
    templateUrl: './create-shop.component.html',
    styleUrls: ['./create-shop.component.scss'],
})
export class CreateShopComponent implements OnInit {
    me: any = {};
    newShopUser: any = {};
    error: string | null = null;
    isUserConnected: boolean = false;
    alreadyProfessionnal: boolean = false;
    categories: any[] = [];

    constructor(
        private userService: UserService,
        private shopService: ShopService,
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
        let test = this.createShop('coiffure', 'id_fake');
        console.log(test);

        // Si toutes les vérifications passent, on continue
        if (this.isUserConnected) {
            this.me.shopCompany = this.newShopUser;
            this.me.role = 'professionnel';
            this.userService.update(this.me).subscribe({
                next: (data: any) => {
                    console.log(data);
                    let shopToCreate: any = {};
                    shopToCreate.name =
                        this.me.firstname +
                        ' ' +
                        this.me.lastname.charAt(0) +
                        '.';
                    this.shopService.create(this.newShopUser).subscribe({
                        next: async (data: any) => {
                            console.log(data);
                            let shopCreationResult: any = await this.createShop(
                                this.newShopUser.companyType,
                                this.me._id
                            );
                            console.log(
                                'shopCreationResult : ' +
                                    JSON.stringify(shopCreationResult)
                            );
                            if (shopCreationResult.error) {
                                console.log(
                                    'Error : ' +
                                        JSON.stringify(shopCreationResult.error)
                                );
                                return;
                            }
                            this.router.navigate(['/profile']);
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
        } else {
            // Vérification des champs obligatoires
            if (
                !this.newShopUser.name ||
                !this.newShopUser.street ||
                !this.newShopUser.city ||
                !this.newShopUser.code_postal ||
                !this.newShopUser.country ||
                !this.newShopUser.firstname ||
                !this.newShopUser.lastname ||
                !this.newShopUser.email ||
                !this.newShopUser.password ||
                !this.newShopUser.confirmedPassword
            ) {
                console.log('Veuillez remplir tous les champs obligatoires.');
                return;
            }
            // Vérification des mots de passe
            if (
                this.newShopUser.password !== this.newShopUser.confirmedPassword
            ) {
                console.log('Les mots de passe ne correspondent pas.');
                return;
            }

            // Vérification de l'email avec une expression régulière simple
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(this.newShopUser.email)) {
                console.log("L'adresse email n'est pas valide.");
                return;
            }

            // Vérification du numéro de téléphone (vérifiez la longueur et si c'est un numéro valide)
            const phoneRegex = /^[0-9]{10}$/; // Exemple pour un numéro français à 10 chiffres
            if (!phoneRegex.test(this.newShopUser.phone)) {
                console.log("Le numéro de téléphone n'est pas valide.");
                return;
            }
            let user: any = {};
            user.lastname = this.newShopUser.lastname;
            user.firstname = this.newShopUser.firstname;
            user.email = this.newShopUser.email;
            user.password = this.newShopUser.password;
            user.phone = this.newShopUser.phone;
            user.companyId = 'FAKE'; // this.newShopUser.name;
            user.shopIds = [];
            user.credit = 0;
            user.proches = [];
            user.address = [
                {
                    street: this.newShopUser.street,
                    city: this.newShopUser.city,
                    code_postal: this.newShopUser.code_postal,
                    country: this.newShopUser.country,
                    main: true,
                },
            ];
            user.role = 'professionnel';
            user.shopCompany = this.newShopUser;
            user.companyType = this.newShopUser.companyType;
            user.countryIndication = this.newShopUser.countryIndication;
            this.userService.create(user).subscribe({
                next: (data: any) => {
                    console.log(data);
                    // this.router.navigate(['/sign-in']);
                    this.newShopUser.idUser = data._id;
                    this.shopService.create(this.newShopUser).subscribe({
                        next: async (data: any) => {
                            console.log(data);
                            let shopCreationResult: any = await this.createShop(
                                this.newShopUser.companyType,
                                data._id
                            );
                            console.log(
                                'shopCreationResult : ' +
                                    JSON.stringify(shopCreationResult)
                            );
                            if (shopCreationResult.error) {
                                console.log(
                                    'Error : ' +
                                        JSON.stringify(shopCreationResult.error)
                                );
                            }
                            this.router.navigate(['/sign-in']);
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

    createShop(type: string, idUser: string) {
        this.shopTemplateService.getServiceTemplatesByCategory(type).subscribe({
            next: (data: any) => {
                console.log(data);
                let newShopToCreate: any = {};

                if (this.alreadyProfessionnal) {
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
                let description = this.categories.find(
                    (x: any) => x.name === type
                ).descriptionTrad;
                newShopToCreate.description = description;
                newShopToCreate.image = 'image';
                newShopToCreate.note = '5';
                newShopToCreate.type = type;
                newShopToCreate.ville = 'Paris';
                newShopToCreate.maxDistance = 15;
                newShopToCreate.idUser = idUser;
                newShopToCreate.services = data;
                newShopToCreate.promo = {};
                newShopToCreate.promo.active = false;
                newShopToCreate.promo.type = '1';
                newShopToCreate.hours = {};
                newShopToCreate.hours.morning = {};
                newShopToCreate.hours.morning.start = '09:00';
                newShopToCreate.hours.morning.end = '12:00';
                newShopToCreate.hours.afternoon = {};
                newShopToCreate.hours.afternoon.start = '13:00';
                newShopToCreate.hours.afternoon.end = '18:00';
                this.shopService.create(newShopToCreate).subscribe({
                    next: (data: any) => {
                        console.log(data);
                        return data;
                    },
                    error: (error: any) => {
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
