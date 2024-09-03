import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CompanyService } from 'src/app/core/services/company.service';
import { ProductService } from 'src/app/core/services/product.service';
import { ShopService } from 'src/app/core/services/shop.service';
import { UserService } from 'src/app/core/services/user.service';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
    
    selected: any = {};
    dropdownOpen = false;
    shops: any[] = [];
    me: any = {};
    myCompany: any = {};
    myArticlesData: any[] = [];
    employees: any[] = [];
    profileForm: FormGroup | undefined;
    imagePreview: string | undefined;
    activeSection: string = 'account-info'; // Par défaut, la section active est "account-info"
    userChangeSuccess: boolean = false;
    userChangeError: string = '';
    constructor(
        private formBuilder: FormBuilder,
        private userService: UserService,
        private companyService: CompanyService,
        private shopService: ShopService,
        private productService: ProductService
    ) {}

    ngOnInit() {
        // this.selected = this.shops[0];
        let currentMenu = localStorage.getItem('activeMenu');
        if (currentMenu) {
            this.setActiveSection(currentMenu);
        }

        this.userService.getMe().subscribe({
            next: (me: any) => {
                this.me = me;
                console.log(me);
                let companyId = me.companyId;
                this.shopService.getShopsByUserId(me._id).subscribe({
                    next:(data:any) => {
                        console.log(data)
                        this.shops = data;
                        this.selected = data[0]
                    },
                    error:(error:any) => {
                        console.log(error)
                    }
                })
                this.companyService.getById(companyId).subscribe({
                    next: (company: any) => {
                        console.log(company.defaultPassword);
                        this.myCompany = company;
                        // this.myCompanyCopy = { ...company };
                        this.userService.getByCompanyId(companyId).subscribe({
                            next: (companyUsers: any[]) => {
                                console.log(companyUsers);
                                this.employees = companyUsers;
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
                this.shopService.getById(this.me.shopIds[0]).subscribe({
                    next: (shop: any) => {
                        this.productService
                            .getProductsByShop(shop._id)
                            .subscribe({
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
            },
            error: (error: any) => {
                console.log(error);
            },
        });
    }

    isUserChanged() {}
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

    selectShop(type:any) {
        console.log(type);
        this.selected = type;
        
        this.shopService.getById(type._id).subscribe({
            next: (shop: any) => {
                this.productService
                    .getProductsByShop(shop._id)
                    .subscribe({
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

    toggleDropdown() {
        this.dropdownOpen = !this.dropdownOpen;
    }
}
