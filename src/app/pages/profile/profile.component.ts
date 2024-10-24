import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CategoryService } from 'src/app/core/services/category.service';
import { CompanyService } from 'src/app/core/services/company.service';
import { ProductService } from 'src/app/core/services/product.service';
import { ShopService } from 'src/app/core/services/shop.service';
import { UserService } from 'src/app/core/services/user.service';
import { ServiceTemplateService } from 'src/app/core/services/productTemplate.service';
import { environment } from 'src/environments/environment';
import { ShopTemplateService } from 'src/app/core/services/shop-template.service';
import { forkJoin } from 'rxjs';
import { ChatModalComponent } from 'src/app/core/component/chat-modal/chat-modal.component';
@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
    modalOpen = false;
    modalDeleteShopOpen = false;
    selected: any = {};
    dropdownOpen = false;
    dropdownOpenNewShop = false;
    shops: any[] = [];
    me: any = {};
    myCompany: any = {};
    myArticlesData: any[] = [];
    myShopData: any = {};
    employees: any[] = [];
    profileForm: FormGroup | undefined;
    imagePreview: string | undefined;
    activeSection: string = 'account-info'; // Par défaut, la section active est "account-info"
    userChangeSuccess: boolean = false;
    userChangeError: string = '';
    categories: any[] = [];
    selectedCategory: any = null;
    constructor(
        private eRef: ElementRef,
        private userService: UserService,
        private companyService: CompanyService,
        private shopService: ShopService,
        private productService: ProductService,
        private router: Router,
        public dialog: MatDialog,
        private categoryService: CategoryService,
        private shopTemplateService: ShopTemplateService
    ) {}

    ngOnInit() {
        // Charger la section active depuis le localStorage
        let currentMenu = 'account-info';
        if (currentMenu) {
            this.setActiveSection(currentMenu);
        }

        // Récupérer l'utilisateur et ses shops
        this.userService.getMe().subscribe({
            next: (me: any) => {
                this.me = me;
                let companyId = me.companyId;

                // Utiliser forkJoin pour récupérer plusieurs données en parallèle
                forkJoin({
                    shops: this.shopService.getShopsByUserId(me._id),
                    company: this.companyService.getById(companyId),
                    companyUsers: this.userService.getByCompanyId(companyId),
                }).subscribe({
                    next: (results: any) => {
                        this.shops = results.shops;
                        this.myCompany = results.company;
                        this.employees = results.companyUsers;

                        // Sélectionner le premier shop
                        if (this.shops && this.shops.length > 0) {
                            this.selected = this.shops[0];
                            this.myShopData = this.shops[0];

                            // Charger les catégories après avoir filtré les shops
                            const shopFilters = this.shops.map(
                                (shop) => shop.type
                            );
                            this.categoryService.getAll().subscribe({
                                next: (categories: any[]) => {
                                    this.categories = categories.filter(
                                        (category) =>
                                            !shopFilters.includes(
                                                category.filter
                                            )
                                    );
                                    this.selectedCategory = this.categories[0];
                                },
                                error: (error: any) => {
                                    console.log(error);
                                },
                            });

                            // Charger les produits du shop sélectionné
                            this.productService
                                .getProductsByShop(this.shops[0]._id)
                                .subscribe({
                                    next: (products: any[]) => {
                                        this.myArticlesData = products;
                                    },
                                    error: (error: any) => {
                                        console.log(error);
                                    },
                                });

                            // Charger les données du shop après la sélection
                            this.shopService.loadShopData(this.shops[0]._id);
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

    openChat(): void {
        const dialogRef = this.dialog.open(ChatModalComponent, {
            width: '400px',
            height: '600px',
            position: { bottom: '20px', right: '20px' },
            panelClass: 'custom-modalbox',
        });
    }

    onArticleUpdated() {
        this.productService.getProductsByShop(this.myShopData._id).subscribe({
            next: (data: any[]) => {
                console.log('totototo');
                console.log(data);
                this.myArticlesData = data;
                // this.articlesCopyData = [...data];
            },
            error: (error: any) => {
                console.log(error);
            },
        });
    }
    onShopUpdated(shopId: string): void {
        // Recharger les données du shop mis à jour
        this.shopService.loadShopData(shopId);

        console.log('Shop mis à jour :', shopId);
        // Optionnel : mettre à jour `myShopData` si nécessaire
        this.shopService.getById(shopId).subscribe({
            next: (shopData: any) => {
                this.myShopData = shopData;
                console.log('Shop mis à jour et rechargé :', this.myShopData);
            },
            error: (error: any) => {
                console.log('Erreur lors du rechargement du shop :', error);
            },
        });
    }

    onSubmit() {
        if (this.profileForm!.valid) {
            // Process form data (e.g., send to backend)
            console.log(this.profileForm!.value);
        } else {
            // Handle form validation errors
            console.log('Form is invalid');
        }
    }

    onFileChange(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.profileForm!.patchValue({
                profileImage: file,
            });
            this.previewImage(file); // Preview the selected image
        }
    }

    setActiveSection(section: string): void {
        this.activeSection = section;
        localStorage.setItem('activeMenu', section);
    }

    isSectionActive(section: string): boolean {
        return this.activeSection === section;
    }

    previewImage(file: File) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            this.imagePreview = reader.result as string;
        };
    }

    goToCreationShop() {
        this.router.navigate(['/creation-shop']);
    }

    selectShop(type: any) {
        console.log(type);
        this.selected = type;

        this.shopService.getById(type._id).subscribe({
            next: (shop: any) => {
                this.myShopData = shop;
                this.productService.getProductsByShop(shop._id).subscribe({
                    next: (data: any[]) => {
                        console.log('totototo');
                        console.log(data);
                        this.myArticlesData = data;
                        // this.articlesCopyData = [...data];
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
        this.dropdownOpen = false;
    }

    selectShopToCreate(type: any) {
        console.log(type);
        this.selectedCategory = type;
        this.dropdownOpenNewShop = false;
    }

    toggleDropdown() {
        this.dropdownOpen = !this.dropdownOpen;
    }
    toggleDropdown2() {
        this.dropdownOpenNewShop = !this.dropdownOpenNewShop;
    }
    closeModalDeleteShop() {
        this.modalDeleteShopOpen = false;
    }
    deletShop() {
        this.modalDeleteShopOpen = true;
    }

    deleteConfirm() {
        /** D'abord faire un delete sur les products du shop */
        this.productService.deleteAllByShopId(this.myShopData._id).subscribe({
            next: (data: any) => {
                console.log(data);
                
                /** Puis faire un delete sur le shop */
                this.shopService.delete(this.myShopData._id).subscribe({
                    next: (data: any) => {
                        console.log(data);
                        this.shops = this.shops.filter((x: any) => x._id !== this.myShopData._id);
                        this.ngOnInit();
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

    openModal(): void {
        console.log('OPEN MODAL');
        this.modalOpen = true;
    }

    closeModal(): void {
        this.modalOpen = false;
    }

    createShop(): any {
        console.log(JSON.stringify(this.selectedCategory));
        let type = this.selectedCategory.filter;
        this.shopTemplateService.getServiceTemplatesByCategory(type).subscribe({
            next: (data: any[]) => {
                let servicesToCreate = data;
                let newShopToCreate: any = {};
                newShopToCreate.name =
                    this.me.firstname + ' ' + this.me.lastname.charAt(0) + '.';

                let categoryToSelect = this.selectedCategory;
                let description = categoryToSelect.descriptionTrad;
                console.log('description =>' + description);
                newShopToCreate.description = description;
                newShopToCreate.location = {
                    latitude: 48.6298,
                    longitude: 2.4407,
                };
                newShopToCreate.image = 'image';
                newShopToCreate.note = '5';
                newShopToCreate.type = type;
                newShopToCreate.ville = 'Paris';
                newShopToCreate.maxDistance = 15;
                newShopToCreate.idUser = this.me._id;
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
                        for (let elem of servicesToCreate) {
                            elem.shopId = data._id;
                        }
                        this.productService
                            .createMultiple(servicesToCreate)
                            .subscribe({
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
}
