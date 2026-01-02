import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { CategoryService } from 'src/app/core/services/category.service';
import { CompanyService } from 'src/app/core/services/company.service';
import { ProductService } from 'src/app/core/services/product.service';
import { ShopService } from 'src/app/core/services/shop.service';
import { UserService } from 'src/app/core/services/user.service';
import { ShopTemplateService } from 'src/app/core/services/shop-template.service';
import { forkJoin } from 'rxjs';
import { ChatModalComponent } from 'src/app/core/component/chat-modal/chat-modal.component';
import { CreateShopComponent } from 'src/app/core/component/create-shop/create-shop.component';
import { AdminService } from 'src/app/core/services/admin.service';

// ✅ AjoutsizyGlam pour toasts + i18n
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { SeoService } from 'src/app/core/services/seo.service';

@Component({
    selector: 'app-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
    // -------------------------------
    // 🔹 État UI
    // -------------------------------
    modalOpen = false;
    modalDeleteShopOpen = false;
    dropdownOpen = false;
    dropdownOpenNewShop = false;
    activeSection: string = 'account-info'; // Section active par défaut

    // -------------------------------
    // 🔹 Données
    // -------------------------------
    selected: any = {};
    shops: any[] = [];
    me: any = null;
    myCompany: any = {};
    myArticlesData: any[] = [];
    myShopData: any = null;
    employees: any[] = [];
    categories: any[] = [];
    selectedCategory: any = null;

    // -------------------------------
    // 🔹 Formulaire profil
    // -------------------------------
    profileForm: FormGroup | undefined;
    imagePreview: string | undefined;

    // -------------------------------
    // 🔹 Flags & paramètres
    // -------------------------------
    userChangeSuccess: boolean = false;
    userChangeError: string = '';
    multiShopsActivated = false;

    constructor(
        private eRef: ElementRef,
        private userService: UserService,
        private companyService: CompanyService,
        private shopService: ShopService,
        private productService: ProductService,
        private router: Router,
        public dialog: MatDialog,
        private categoryService: CategoryService,
        private shopTemplateService: ShopTemplateService,
        private adminService: AdminService,

        // ✅ AjoutsizyGlam
        private toastr: ToastrService,
        private translate: TranslateService,
        private seoService: SeoService
    ) { }

    // -------------------------------------------------
    // ⏱️ ngOnInit : paramètres, section active, données
    // -------------------------------------------------
    ngOnInit() {
        
        this.seoService.updateMeta('profile');
        // 1) Charge les paramètres d’admin (ex: multi-shops)
        this.adminService.getAdminSettings().subscribe({
            next: (data: any) => {
                this.multiShopsActivated = data.multiShopsActivated;
            },
            error: (err) => {
                console.error('Erreur lors du chargement des paramètres admin :', err);
                this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
            },
        });

        // 2) Restaure la section active depuis le localStorage
        const section = localStorage.getItem('menu-param');
        if (section && section !== undefined && section !== '') {
            this.activeSection = section;
        } else {
            const activeSection = 'account-info';
            localStorage.setItem('menu-param', activeSection);
        }

        // 3) Démarre le chargement des données (user + shops)
        this.initData();
    }

    // -------------------------------------------------
    // 🔁 Charge l’utilisateur puis ses shops (selon le rôle)
    // -------------------------------------------------
    initData() {
        this.userService.getMe().subscribe({
            next: (me: any) => {
                this.me = me;

                const companyId = me.companyId;
                console.log('ROLE : ' + me.role);

                if (me.role === 'boss') {
                    // 👑 Patron : récupère ses shops + ses employés
                    forkJoin({
                        shops: this.shopService.getShopsByBoss(),
                        employees: this.userService.getMyEmployees(),
                    }).subscribe({
                        next: (results: any) => {
                            this.shops = results.shops;
                            this.employees = results.employees;
                            this.handleShopsLoad();
                        },
                        error: (err) => {
                            console.error('Erreur lors du chargement shops/employés (boss) :', err);
                            this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
                        },
                    });
                } else {
                    // 👨‍🔧 Employé : récupère ses shops
                    forkJoin({
                        shops: this.shopService.getShopsByUserId(me._id),
                    }).subscribe({
                        next: (results: any) => {
                            this.shops = results.shops;
                            console.log('SHOP !!!!  : ' + JSON.stringify(this.shops));
                            // this.myCompany = results.company;
                            // this.employees = results.companyUsers;
                            this.handleShopsLoad();
                        },
                        error: (err) => {
                            console.error('Erreur lors du chargement shops utilisateur :', err);
                            this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
                        },
                    });
                }
            },
            error: (err) => {
                console.error('Erreur lors du chargement utilisateur :', err);
                this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
            },
        });
    }

    // -------------------------------------------------
    // 🧭 Après chargement des shops : init catégories + produits
    // -------------------------------------------------
    handleShopsLoad() {
        if (this.shops && this.shops.length > 0) {
            this.selected = this.shops[0];
            this.myShopData = this.shops[0];

            // Récupère les catégories non encore utilisées par les shops
            const shopFilters = this.shops.map((shop) => shop.type);
            this.categoryService.getAll().subscribe({
                next: (categories: any[]) => {
                    this.categories = categories.filter(
                        (category) => !shopFilters.includes(category.filter)
                    );
                    this.selectedCategory = this.categories[0];
                },
                error: (err) => {
                    console.error('Erreur lors du chargement des catégories :', err);
                    this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
                }
            });

            // Récupère les produits du premier shop
            this.productService
                .getProductsByShop(this.shops[0]._id)
                .subscribe({
                    next: (products: any[]) => {
                        this.myArticlesData = products;
                    },
                    error: (err) => {
                        console.error('Erreur lors du chargement des produits du shop :', err);
                        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
                    }
                });

            // Charge les données détaillées du shop pour d’autres zones (service interne)
            // this.shopService.loadShopData(this.shops[0]._id);
        }
    }

    // -------------------------------------------------
    // 💬 Ouvrir la fenêtre de chat (support/assistance)
    // -------------------------------------------------
    openChat(): void {
        this.dialog.open(ChatModalComponent, {
            width: '400px',
            height: '600px',
            position: { bottom: '20px', right: '20px' },
            panelClass: 'custom-modalbox',
        });
    }

    // -------------------------------------------------
    // ➕ Ouvrir la modal de création de shop
    // -------------------------------------------------
    openCreateShopModal() {
        const dialogRef = this.dialog.open(CreateShopComponent, {
            width: '600px',
        });

        dialogRef.afterClosed().subscribe({
            next: (result) => {
                if (result) {
                    console.log('Résultat retourné :', result);
                    // Recharge les shops si nécessaire
                    this.initData();
                }
            },
            error: (err) => {
                console.error('Erreur lors de la fermeture de la modal CreateShop :', err);
                this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
            }
        });
    }

    // -------------------------------------------------
    // 🔁 Rafraîchit la liste des articles après MAJ
    // -------------------------------------------------
    onArticleUpdated() {
        this.productService.getProductsByShop(this.myShopData._id).subscribe({
            next: (data: any[]) => {
                console.log('Articles mis à jour :', data);
                this.myArticlesData = data;
            },
            error: (err: any) => {
                console.error('Erreur lors du rechargement des articles :', err);
                this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
            },
        });
    }

    // -------------------------------------------------
    // 🏪 Après mise à jour d’un shop : recharge ses données locales
    // -------------------------------------------------
    onShopUpdated(shopId: string): void {
        // Recharge le cache interne du service
        this.shopService.loadShopData(shopId);

        console.log('Shop mis à jour :', shopId);

        // Recharge les infos détaillées du shop
        this.shopService.getById(shopId).subscribe({
            next: (shopData: any) => {
                this.myShopData = shopData;
                this.onArticleUpdated();
                console.log('Shop rechargé :', this.myShopData);
            },
            error: (err: any) => {
                console.error('Erreur lors du rechargement du shop :', err);
                this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
            },
        });
    }

    // -------------------------------------------------
    // ✅ Soumission du formulaire de profil (placeholder)
    // -------------------------------------------------
    onSubmit() {
        if (this.profileForm!.valid) {
            console.log('Profil soumis :', this.profileForm!.value);
        } else {
            console.warn('Form is invalid');
            this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        }
    }

    // -------------------------------------------------
    // 🖼️ Gestion upload image de profil (prévisualisation)
    // -------------------------------------------------
    onFileChange(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.profileForm!.patchValue({ profileImage: file });
            this.previewImage(file); // Preview
        }
    }

    // -------------------------------------------------
    // 🧭 Navigation dans les sections du profil
    // -------------------------------------------------
    setActiveSection(section: string): void {
        this.activeSection = section;
        localStorage.setItem('menu-param', section);
    }
    isSectionActive(section: string): boolean {
        return this.activeSection === section;
    }

    // -------------------------------------------------
    // 👁️ Prévisualisation d’image
    // -------------------------------------------------
    previewImage(file: File) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            this.imagePreview = reader.result as string;
        };
    }

    // -------------------------------------------------
    // 🚀 Raccourci création de shop
    // -------------------------------------------------
    goToCreationShop() {
        this.router.navigate(['/creation-shop']);
    }

    // -------------------------------------------------
    // 🔀 Changer de shop (sélection)
    // -------------------------------------------------
    selectShop(shop: any) {
        this.myArticlesData = [];
        console.log('Shop sélectionné :', shop);
        this.selected = shop;

        if (this.dropdownOpen) {
            this.toggleDropdown();
        }

        // Recharge le shop sélectionné
        this.shopService.getById(shop._id).subscribe({
            next: (shopData: any) => {
                this.myShopData = shopData;
                console.log('Données shop : ', JSON.stringify(this.myShopData));

                // Recharge ses produits
                this.productService.getProductsByShop(shop._id).subscribe({
                    next: (data: any[]) => {
                        console.log('Produits du shop :', data);
                        this.myArticlesData = data;
                    },
                    error: (err: any) => {
                        console.error('Erreur lors du chargement des produits du shop :', err);
                        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
                    },
                });
            },
            error: (err: any) => {
                console.error('Erreur lors du chargement du shop sélectionné :', err);
                this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
            },
        });

        this.dropdownOpen = false;
    }

    // -------------------------------------------------
    // 🗂️ Choisir un type de shop à créer (catégorie)
    // -------------------------------------------------
    selectShopToCreate(type: any) {
        console.log('Type de shop choisi :', type);
        this.selectedCategory = type;
        this.dropdownOpenNewShop = false;
    }

    // -------------------------------------------------
    // ⬇️/⬆️ Gestion des dropdowns
    // -------------------------------------------------
    toggleDropdown() {
        this.dropdownOpen = !this.dropdownOpen;
    }
    toggleDropdown2() {
        this.dropdownOpenNewShop = !this.dropdownOpenNewShop;
    }

    // -------------------------------------------------
    // ❌ Fermeture de la modale de suppression
    // -------------------------------------------------
    closeModalDeleteShop() {
        this.modalDeleteShopOpen = false;
    }
    // -------------------------------------------------
    // 🗑️ Ouvrir la modale de suppression
    // -------------------------------------------------
    deletShop() {
        this.modalDeleteShopOpen = true;
    }

    // -------------------------------------------------
    // 🖱️ Ferme le dropdown au clic extérieur
    // -------------------------------------------------
    @HostListener('document:click', ['$event'])
    onClickOutside(event: MouseEvent) {
        const dropdownElement = document.querySelector('.rosy-select');
        if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
            if (this.dropdownOpen) {
                this.toggleDropdown(); // Ferme le dropdown si clic en dehors
            }
        }
    }

    // -------------------------------------------------
    // 🔥 Supprime tous les produits d’un shop puis le shop
    // -------------------------------------------------
    deleteConfirm() {
        // 1) Supprime tous les produits du shop
        this.productService.deleteAllByShopId(this.myShopData._id).subscribe({
            next: (data: any) => {
                console.log('Produits supprimés :', data);

                // 2) Supprime ensuite le shop
                this.shopService.delete(this.myShopData._id).subscribe({
                    next: (res: any) => {
                        console.log('Shop supprimé :', res);
                        this.shops = this.shops.filter((x: any) => x._id !== this.myShopData._id);
                        this.ngOnInit(); // Recharge la page pour refléter l’état
                    },
                    error: (err: any) => {
                        console.error('Erreur lors de la suppression du shop :', err);
                        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
                    },
                });
            },
            error: (err: any) => {
                console.error('Erreur lors de la suppression des produits du shop :', err);
                this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
            },
        });
    }

    // -------------------------------------------------
    // ❌ Ferme la modale générique
    // -------------------------------------------------
    closeModal(): void {
        this.modalOpen = false;
    }

    // -------------------------------------------------
    // 🏗️ Création d’un shop + services depuis un template
    // -------------------------------------------------
    createShop(): any {
        console.log('Catégorie sélectionnée :', JSON.stringify(this.selectedCategory));

        const type = this.selectedCategory.filter;

        // 1) Récupère les services "template" de la catégorie choisie
        this.shopTemplateService.getServiceTemplatesByCategory(type).subscribe({
            next: (data: any[]) => {
                const servicesToCreate = data;

                // 2) Compose l’objet "shop" à créer
                const newShopToCreate: any = {};
                newShopToCreate.name = this.me.firstname + ' ' + this.me.lastname.charAt(0) + '.';

                const categoryToSelect = this.selectedCategory;
                const description = categoryToSelect.descriptionTrad;
                console.log('description => ' + description);
                newShopToCreate.description = description;

                newShopToCreate.location = { latitude: 48.6298, longitude: 2.4407 };
                newShopToCreate.image = 'image';
                newShopToCreate.note = '5';
                newShopToCreate.type = type;
                newShopToCreate.ville = 'Paris';
                newShopToCreate.maxDistance = 15;
                newShopToCreate.idUser = this.me._id;
                newShopToCreate.promo = { active: false, type: '1' };
                newShopToCreate.trad = categoryToSelect.trad;
                newShopToCreate.hours = {
                    morning: { start: '09:00', end: '12:00' },
                    afternoon: { start: '13:00', end: '18:00' }
                };

                // 3) Crée le shop, puis les produits liés
                this.shopService.create(newShopToCreate).subscribe({
                    next: (created: any) => {
                        console.log('Shop créé :', created);

                        // Affecte le shopId à chaque service avant création multiple
                        for (const elem of servicesToCreate) {
                            elem.shopId = created._id;
                        }

                        this.productService.createMultiple(servicesToCreate).subscribe({
                            next: (res: any) => {
                                console.log('Services créés :', res);
                                return res;
                            },
                            error: (err: any) => {
                                console.error('Erreur lors de la création multiple de services :', err);
                                this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
                                return err;
                            },
                        });
                    },
                    error: (err: any) => {
                        console.error('Erreur lors de la création du shop :', err);
                        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
                        return err;
                    },
                });
            },
            error: (err: any) => {
                console.error('Erreur lors du chargement des templates de services :', err);
                this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
                return err;
            },
        });
    }

    // -------------------------------------------------
    // ✨ Toast d’erreur styliséizyGlam (centralisé)
    // -------------------------------------------------
    private showCustomToast(message: string) {
        // Exemple de message dans fr.json :
        // "ERROR": { "GENERIC_ERROR": "✨ Oups… une erreur s’est glissée. Merci de réessayer ✨" }
        this.toastr.error(message);
    }
}
