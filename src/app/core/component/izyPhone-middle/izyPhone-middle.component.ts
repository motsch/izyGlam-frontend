import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ShopService } from '../../services/shop.service';
import { ShopTemplateService } from '../../services/shop-template.service';
import { max } from 'lodash';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';

// ✅izyGlam: traductions & toasts
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-izyphone-middle',
  templateUrl: './izyPhone-middle.component.html',
  styleUrls: ['./izyPhone-middle.component.scss'],
})
export class IzyPhoneMiddleComponent implements OnInit {
  // 👤 Utilisateur courant
  me: any = {};

  // 📝 Données formulaire création pro/entreprise
  newShopUser: any = {};

  // ❌ Message d’erreur (si besoin d’affichage dans le template)
  error: string | null = null;

  // 🔐 État de connexion et de rôle
  isUserConnected: boolean = false;
  alreadyProfessionnal: boolean = false;

  // 🏷️ Catégories disponibles (pour sélectionner le type de shop)
  categories: any[] = [];

  constructor(
    private userService: UserService,
    private shopService: ShopService,
    private productService: ProductService,
    private router: Router,
    private shopTemplateService: ShopTemplateService,
    private categoryService: CategoryService,

    // ✅izyGlam
    private translate: TranslateService,
    private toastr: ToastrService
  ) { }

  // ------------------------------------------------------------
  // ⏱️ Cycle de vie
  // ------------------------------------------------------------
  ngOnInit() {
    try {
      // Charger toutes les catégories pour peupler la liste
      this.categoryService.getAll().subscribe({
        next: (data: any) => {
          this.categories = data;
        },
        error: (error: any) => {
          console.error('Erreur lors du chargement des catégories :', error);
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        },
      });

      // Valeurs par défaut du formulaire
      this.newShopUser.companyType = 'coiffure';
      this.newShopUser.countryIndication = 'FR';

      // Récupérer l’utilisateur connecté
      this.userService.getMe().subscribe({
        next: (data: any) => {
          this.me = { ...data };
          // Déjà pro/entreprise ?
          if (this.me.role === 'professionnel' || this.me.role === 'entreprise') {
            this.alreadyProfessionnal = true;
          }
          this.isUserConnected = true;
        },
        error: (error: any) => {
          console.error('Erreur lors de la récupération de l’utilisateur :', error);
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        },
      });
    } catch (err) {
      console.error('Erreur ngOnInit CreateCompanyComponent :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // ------------------------------------------------------------
  // ✅ Soumission de la création (passe l’utilisateur en pro + crée un shop)
  // ------------------------------------------------------------
  onSubmit() {
    try {
      // Garde : utilisateur non connecté
      if (!this.isUserConnected || !this.me?._id) {
        console.warn('Utilisateur non connecté ou ID manquant');
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        return;
      }

      // Attacher les infos d’entreprise au user et le passer en pro
      this.me.shopCompany = this.newShopUser;
      this.me.role = 'professionnel';

      this.userService.update(this.me).subscribe({
        next: async (data: any) => {
          // 🟢 User updaté → on enchaîne sur la création du shop
          try {
            await this.createShop(this.newShopUser.companyType, this.me._id);
            // ✅ Succès
            this.showSuccessToast(
              this.translate.instant('SUCCESS.COMPANY_CREATED') || 'Compte professionnel créé.'
            );
            this.router.navigate(['/profile']);
          } catch (createErr) {
            console.error('Erreur lors de la création du shop (catch) :', createErr);
            this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
          }
        },
        error: (error: any) => {
          console.error('Erreur lors de la mise à jour du rôle utilisateur :', error);
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        },
      });
    } catch (err) {
      console.error('Erreur onSubmit :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // ------------------------------------------------------------
  // 🏪 Création du shop + services à partir d’un template de catégorie
  // ------------------------------------------------------------
  createShop(type: string, idUser: string): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        // 1) Récupérer les services templates pour la catégorie
        this.shopTemplateService.getServiceTemplatesByCategory(type).subscribe({
          next: (data: any[]) => {
            const servicesToCreate: any[] = Array.isArray(data) ? data : [];
            const newShopToCreate: any = {};

            // 2) Construire l’objet shop à créer
            if (this.isUserConnected) {
              newShopToCreate.name = `${this.me.firstname} ${this.me.lastname?.charAt(0) || ''}.`;
            } else {
              newShopToCreate.name = `${this.newShopUser.firstname} ${this.newShopUser.lastname?.charAt(0) || ''}.`;
            }

            const categoryToSelect = this.categories.find((x: any) => x.filter === type);
            const description = categoryToSelect?.descriptionTrad || '';

            newShopToCreate.description = description;
            newShopToCreate.image = 'image';
            newShopToCreate.note = '5';
            newShopToCreate.type = type;
            newShopToCreate.ville = 'Paris';
            newShopToCreate.maxDistance = 15;
            newShopToCreate.idUser = idUser;
            newShopToCreate.promo = { active: false, type: '1' };
            newShopToCreate.hours = {
              morning: { start: '09:00', end: '12:00' },
              afternoon: { start: '13:00', end: '18:00' },
            };
            newShopToCreate.trad = categoryToSelect?.trad || {};

            // 3) Créer le shop
            this.shopService.create(newShopToCreate).subscribe({
              next: (shopCreated: any) => {
                // 4) Attacher l’ID du shop aux services template et créer en masse
                for (const elem of servicesToCreate) {
                  elem.shopId = shopCreated._id;
                }

                this.productService.createMultiple(servicesToCreate).subscribe({
                  next: (createdServices: any) => {
                    // Tout est OK
                    resolve({ shop: shopCreated, services: createdServices });
                  },
                  error: (error: any) => {
                    console.error('Erreur lors de la création des services :', error);
                    this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
                    // On résout quand même le shop créé (au cas où) mais on signale l’erreur
                    reject(error);
                  },
                });
              },
              error: (error: any) => {
                console.error('Erreur lors de la création du shop :', error);
                this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
                reject(error);
              },
            });
          },
          error: (error: any) => {
            console.error('Erreur lors du chargement des templates de service :', error);
            this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
            reject(error);
          },
        });
      } catch (err) {
        console.error('Erreur createShop (try/catch) :', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        reject(err);
      }
    });
  }

  // ------------------------------------------------------------
  // ✅ Validations de formulaire (placeholder conservé)
  // ------------------------------------------------------------
  formChecking() { }

  // ------------------------------------------------------------
  // ✨ ToastsizyGlam
  // ------------------------------------------------------------
  private showCustomToast(message: string) {
    this.toastr.error(message); // erreurs → .error()
  }

  private showSuccessToast(message: string) {
    this.toastr.success(message); // succès → .success()
  }
}
