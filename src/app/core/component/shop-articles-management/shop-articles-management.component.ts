import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

import { ShopService } from '../../services/shop.service';
import { ProductService } from '../../services/product.service';
import { ColorService } from '../../services/color.service';
import { ShopTemplateService } from '../../services/shop-template.service';
import { BookingCategoryService } from '../../services/booking-category.service';

import { of } from 'rxjs';

@Component({
  selector: 'app-shop-articles-management',
  templateUrl: './shop-articles-management.component.html',
  styleUrls: ['./shop-articles-management.component.scss'],
})
export class ShopArticlesManagementComponent implements OnInit, OnChanges {
  // ===========================
  // Inputs / Outputs
  // ===========================
  @Input() myArticlesData: any[] = [];       // Liste des services (produits) du shop
  @Input() myShopData: any = {};             // Métadonnées de la boutique courante
  @Input() me: any = {};                     // Utilisateur courant (si utile)
  @Output() articleUpdated = new EventEmitter<string>(); // Notifie le parent (si tu veux)

  @ViewChild('csvInput') csvInput!: ElementRef<HTMLInputElement>;
  readonly MIN_PRICE = 10;

  // ===========================
  // État local
  // ===========================
  services: any[] = [];
  selectedService: any = {};
  modalOpen = false;
  editingServiceIndex: number | null = null;
  articlesCopyData: any[] = [];
  modalService: any = {};
  colors: any[] = [];
  selectedColor = '';
  imgStorageUrl: string = environment.APIimgStorageUrl.replace(/\/$/, '');
  imageUsed: string | null = null;
  selectedFile: File | null = null;
  imagePreview: string | null = null;
  templateByType: any[] = [];
  creationType: string | null = null;
  isGeneratingDescription = false;
  isGeneratingImage = false;

  // CSV
  selectedCsvFile: File | null = null;

  // Catégories
  serviceCategories: any[] = [];
  isLoadingCategories = false;
  categoryNameById: Record<string, string> = {};
  categoryColorById: Record<string, string> = {};

  constructor(
    private productService: ProductService,
    private colorService: ColorService,
    private shopTemplateService: ShopTemplateService,
    private toastr: ToastrService,
    private translate: TranslateService,
    private shopService: ShopService,
    private bookingCategoryService: BookingCategoryService,
    private cd: ChangeDetectorRef
  ) { }

  // ===========================================================
  // Lifecycle
  // ===========================================================

  ngOnInit(): void {
    try {
      localStorage.setItem('menu-param', 'management');

      // Palette couleurs
      this.colorService.getAll().subscribe({
        next: (data: any) => {
          this.colors = (data || []).map((c: any) => ({ ...c, selected: false }));
        },
        error: (error: any) => {
          console.error('[ArticlesMgmt] getAll colors ERROR:', error);
          this.toast(this.t('SHOP_ARTICLES_MANAGEMENT.ERROR_COLORS'), 'error');
        },
      });

      // Si jamais myShopData est déjà dispo au init
      const shopId = this.myShopData?._id;
      if (shopId) {
        this.loadServicesAndCategories(shopId);
      }
    } catch (err) {
      console.error('[ArticlesMgmt] ngOnInit FATAL:', err);
      this.toast(this.t('ERROR.GENERIC_ERROR'), 'error');
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    try {
      // Si le parent change myArticlesData (on garde la synchro)
      if (changes['myArticlesData']?.currentValue) {
        this.articlesCopyData = [...this.myArticlesData];
      }

      // Si la boutique change : on recharge services + catégories
      if (changes['myShopData']?.currentValue) {
        const shopId = this.myShopData?._id;
        if (shopId) {
          this.loadServicesAndCategories(shopId);
        }
        // ⚠️ IMPORTANT : NE PAS emit ici (sinon boucle/doubles fetch)
        // this.articleUpdated.emit();
      }
    } catch (err) {
      console.error('[ArticlesMgmt] ngOnChanges FATAL:', err);
      this.toast(this.t('ERROR.GENERIC_ERROR'), 'error');
    }
  }

  // ===========================================================
  // Helpers i18n / Toasts
  // ===========================================================

  private t(keyOrText: string): string {
    try {
      const tr = this.translate.instant(keyOrText);
      return tr && tr !== keyOrText ? tr : keyOrText;
    } catch {
      return keyOrText;
    }
  }

  private toast(msg: string, type: 'success' | 'error' = 'success') {
    try {
      if (type === 'success') this.toastr.success(msg);
      else this.toastr.error(msg);
    } catch (err) {
      console.warn('[ArticlesMgmt] toast WARN (fallback):', err);
    }
  }

  private patchEditedRow(patch: Partial<any>) {
    if (this.editingServiceIndex !== null && this.editingServiceIndex > -1) {
      this.articlesCopyData = this.articlesCopyData.map((s, i) =>
        i === this.editingServiceIndex ? { ...s, ...patch } : s
      );
    }
  }

  // ===========================================================
  // Chargements (services + catégories)
  // ===========================================================

  private loadServicesAndCategories(shopId: string) {
    this.isLoadingCategories = true;

    // 1) Services du shop
    this.productService.getProductsByShop(shopId).subscribe({
      next: (prods) => {
        this.myArticlesData = prods || [];
        this.articlesCopyData = [...this.myArticlesData];
      },
      error: (err) => {
        console.error('[ArticlesMgmt] getProductsByShop ERROR:', err);
        this.toast('Erreur chargement services ❌', 'error');
      }
    });

    // 2) Catégories du shop
    this.bookingCategoryService.getBookingCategoryByShopId(shopId).pipe(
      finalize(() => {
        this.isLoadingCategories = false;
        this.cd.detectChanges();
      })
    ).subscribe({
      next: (cats) => {
        this.serviceCategories = (cats || []).sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));

        // ✅ map id -> name (supporte _id ou id)
        this.categoryNameById = this.serviceCategories.reduce((acc: Record<string, string>, c: any) => {
          const id = String(c?._id ?? c?.id ?? '');
          if (id) acc[id] = c?.name || '';
          return acc;
        }, {});

        // ✅ map id -> color (optionnel, si dispo)
        this.categoryColorById = this.serviceCategories.reduce((acc: Record<string, string>, c: any) => {
          const id = String(c?._id ?? c?.id ?? '');
          if (id) acc[id] = c?.color || '';
          return acc;
        }, {});
      },
      error: (err) => {
        console.error('[ArticlesMgmt] getBookingCategoryByShopId ERROR:', err);
        this.toast('Erreur chargement catégories ❌', 'error');
      }
    });
  }

  // Helper affichage
  getCategoryName(categoryId?: string): string {
    if (!categoryId) return '—';
    return this.categoryNameById[String(categoryId)] || '—';
  }

  getCategoryColor(categoryId?: string): string {
    if (!categoryId) return '';
    return this.categoryColorById[String(categoryId)] || '';
  }

  // ===========================================================
  // CSV import / export
  // ===========================================================

  openCsvPicker() {
    this.csvInput.nativeElement.click();
  }

  onCsvSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.toast('Merci de sélectionner un fichier .csv', 'error');
      input.value = '';
      return;
    }

    if (!this.myShopData._id) {
      this.toast('ShopId manquant', 'error');
      input.value = '';
      return;
    }

    // Upload direct après sélection + refresh complet (services + catégories)
    this.productService.uploadServicesCsv(this.myShopData._id, file).subscribe({
      next: () => {
        this.toast('Services importés ✅', 'success');
        input.value = '';

        // ✅ refresh complet
        this.refreshAfterMutation();
      },
      error: (err) => {
        console.error('[ArticlesMgmt] uploadServicesCsv ERROR:', err);
        const backendMsg = err?.error?.message;
        this.toast(backendMsg || 'Erreur import CSV ❌', 'error');
        input.value = '';
      }
    });
  }

  downloadServices() {
    if (!this.myShopData._id) return;

    this.productService.downloadServicesCsvByShop(this.myShopData._id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        const today = new Date().toISOString().slice(0, 10);
        a.download = `services_${this.myShopData._id}_${today}.csv`;

        document.body.appendChild(a);
        a.click();

        a.remove();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Erreur download CSV', err);
        this.toast('Erreur téléchargement CSV ❌', 'error');
      },
    });
  }

  // ===========================================================
  // Upload image (file input)
  // ===========================================================

  onFileSelected(event: any): void {
    try {
      const file: File = event?.target?.files?.[0];
      if (!file) return;

      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => (this.imagePreview = reader.result as string);
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('[ArticlesMgmt] onFileSelected ERROR:', err);
      this.toast(this.t('SHOP_ARTICLES_MANAGEMENT.ERROR_IMAGE_LOAD'), 'error');
    }
  }

  // Upload image immédiat (si tu l’utilises ailleurs)
  uploadImage(): void {
    try {
      if (!this.selectedFile || !this.selectedService?._id) {
        console.warn('[ArticlesMgmt] uploadImage: missing file or serviceId');
        return;
      }

      this.productService
        .uploadGalleryImages(this.selectedService._id, this.selectedFile)
        .pipe(
          catchError((error) => {
            console.error('[ArticlesMgmt] uploadImage ERROR:', error);
            this.toast(this.t('SHOP_ARTICLES_MANAGEMENT.ERROR_IMAGE_LOAD'), 'error');
            return of(null);
          })
        )
        .subscribe((res: any | null) => {
          if (!res) return;
          this.toast(this.t('SHOP_ARTICLES_MANAGEMENT.IMAGE_OK'), 'success');

          // ✅ refresh complet (important pour re-sync table)
          this.refreshAfterMutation();
        });
    } catch (err) {
      console.error('[ArticlesMgmt] uploadImage FATAL:', err);
      this.toast(this.t('ERROR.GENERIC_ERROR'), 'error');
    }
  }

  // ===========================================================
  // Couleurs
  // ===========================================================

  selectColor(colorHex: string) {
    try {
      this.colors.forEach((c: any) => (c.selected = c.hex === colorHex));
      this.selectedColor = colorHex;
      if (this.modalService) {
        this.modalService.color = colorHex;
        this.patchEditedRow({ color: colorHex });
      }
    } catch (err) {
      console.error('[ArticlesMgmt] selectColor ERROR:', err);
      this.toast(this.t('ERROR.GENERIC_ERROR'), 'error');
    }
  }

  // ===========================================================
  // IA : Description / Image
  // ===========================================================

  onGenerateDescription() {
    if (this.isGeneratingDescription) return;
    this.isGeneratingDescription = true;
    this.generateIzyGlamProductDescription(this.modalService);
  }

  onGenerateImage() {
    if (this.isGeneratingImage) return;
    this.isGeneratingImage = true;
    this.generateIzyGlamImage(this.modalService);
  }

  generateIzyGlamProductDescription(product: any) {
    try {
      this.shopService
        .generateIzyGlamProductDescription(product)
        .pipe(
          finalize(() => {
            this.isGeneratingDescription = false;
            this.cd.detectChanges();
          })
        )
        .subscribe({
          next: (prod: any) => {
            const newDescription = prod?.description || '';
            this.modalService.description = newDescription;
            this.patchEditedRow({ description: newDescription });
            this.toast(this.t('SHOP_MANAGEMENT.DESCRIPTION_OK') || 'Description générée ✅', 'success');
          },
          error: (err: any) => {
            console.error('[ArticlesMgmt] generate description ERROR:', err);
            this.toast(this.t('SHOP_ARTICLES_MANAGEMENT.ERROR_GENERATE_DESC') || 'Erreur de génération ❌', 'error');
          },
        });
    } catch (err) {
      console.error('[ArticlesMgmt] generateIzyGlamProductDescription FATAL:', err);
      this.toast(this.t('ERROR.GENERIC_ERROR'), 'error');
      this.isGeneratingDescription = false;
    }
  }

  generateIzyGlamImage(product: any) {
    try {
      this.shopService
        .generateIzyGlamImage(product)
        .pipe(
          finalize(() => {
            this.isGeneratingImage = false;
            this.cd.detectChanges();
          })
        )
        .subscribe({
          next: (data: any) => {
            const newImagePath = data?.image ?? data?.imageUrl ?? data?.result?.image ?? null;
            if (!newImagePath) {
              this.toast(this.t('SHOP_ARTICLES_MANAGEMENT.ERROR_IMAGE_LOAD') || 'Image non reçue ❌', 'error');
              return;
            }

            this.modalService.image = newImagePath;
            this.imageUsed = newImagePath;
            this.imagePreview = null;
            this.selectedFile = null;

            this.patchEditedRow({ image: newImagePath });

            this.toast(this.t('SHOP_ARTICLES_MANAGEMENT.IMAGE_OK') || 'Image générée ✅', 'success');
          },
          error: (err: any) => {
            console.error('[ArticlesMgmt] generate image ERROR:', err);
            this.toast(this.t('SHOP_ARTICLES_MANAGEMENT.ERROR_IMAGE_LOAD') || 'Erreur de génération ❌', 'error');
          },
        });
    } catch (err) {
      console.error('[ArticlesMgmt] generateIzyGlamImage FATAL:', err);
      this.toast(this.t('ERROR.GENERIC_ERROR'), 'error');
      this.isGeneratingImage = false;
    }
  }

  // ===========================================================
  // Modale
  // ===========================================================

  openModal(service?: any): void {
    try {
      // CREATION
      if (!service) {
        this.imageUsed = null;

        this.shopTemplateService.getServiceTemplatesByCategory(this.myShopData.type).subscribe({
          next: (data: any[]) => {
            this.templateByType = data || [];
            const filtered = this.templateByType.filter((x: any) => x.type === this.myShopData.type);

            this.modalService = filtered.length > 0
              ? filtered[Math.floor(Math.random() * filtered.length)]
              : {};

            // Nettoyage template
            this.modalService._id = undefined;
            this.modalService.shopId = this.myShopData?._id;
            this.creationType = this.modalService.type;
            this.editingServiceIndex = null;

            // Reset image
            this.imageUsed = this.modalService.image || null;
            this.imagePreview = null;
            this.selectedService = this.modalService;
            this.selectedFile = null;

            // ✅ catégorie : forcer choix
            this.modalService.categoryId = '';

            // couleurs reset
            this.colors.forEach((c: any) => (c.selected = false));
          },
          error: (error: any) => {
            console.error('[ArticlesMgmt] getServiceTemplatesByCategory ERROR:', error);
            this.toast(this.t('SHOP_ARTICLES_MANAGEMENT.ERROR_TEMPLATE_LOAD') || this.t('ERROR.GENERIC_ERROR'), 'error');
          },
        });

        this.modalOpen = true;
        return;
      }

      // EDITION
      this.imagePreview = null;
      this.selectedService = service;
      this.modalOpen = true;

      this.imageUsed = service.image || null;

      for (const c of this.colors) c.selected = c.hex === service.color;

      this.modalService = { ...service };
      if (!this.modalService.categoryId) this.modalService.categoryId = '';

      this.editingServiceIndex = this.articlesCopyData.indexOf(service);
    } catch (err) {
      console.error('[ArticlesMgmt] openModal FATAL:', err);
      this.toast(this.t('ERROR.GENERIC_ERROR'), 'error');
    }
  }

  closeModal(): void {
    this.modalOpen = false;
  }

  // ===========================================================
  // Sauvegarde
  // ===========================================================

  saveService(): void {
    try {

      if (Number(this.modalService.price) < this.MIN_PRICE) {
        this.modalService.price = this.MIN_PRICE;
      }

      // ✅ Validation catégorie obligatoire
      if (!this.modalService?.categoryId) {
        this.toast('Merci de sélectionner une catégorie.', 'error');
        return;
      }

      // EDITION
      if (this.editingServiceIndex !== null) {
        if (this.selectedFile) {
          // Upload image puis update
          this.productService.uploadGalleryImages(this.selectedService._id, this.selectedFile).subscribe({
            next: (response) => {
              this.modalService.image = response?.image || this.modalService.image;
              this.updateService(this.modalService._id, this.modalService, true);
            },
            error: (error) => {
              console.error('[ArticlesMgmt] uploadGalleryImages (edit) ERROR:', error);
              this.toast(this.t('SHOP_ARTICLES_MANAGEMENT.ERROR_IMAGE_LOAD'), 'error');
            },
          });
        } else {
          this.updateService(this.modalService._id, this.modalService);
        }
        return;
      }

      // CREATION
      this.modalService.shopId = this.myShopData?._id || this.modalService?.shopId;

      this.productService.create(this.modalService).subscribe({
        next: (created: any) => {
          this.selectedService = created;
          this.modalService = created;

          if (this.selectedFile) {
            this.productService.uploadGalleryImages(this.selectedService._id, this.selectedFile).subscribe({
              next: (uploadRes) => {
                this.modalService.image = uploadRes?.image || this.modalService.image;

                this.productService.update(this.modalService._id, this.modalService).subscribe({
                  next: () => {
                    this.toast(this.t('SHOP_ARTICLES_MANAGEMENT.PRESTA_SUCCESS'), 'success');
                    this.closeModal();

                    // ✅ refresh complet
                    this.refreshAfterMutation();
                  },
                  error: (error: any) => {
                    console.error('[ArticlesMgmt] update after upload (create) ERROR:', error);
                    this.toast(this.t('SHOP_ARTICLES_MANAGEMENT.PRESTA_ERROR'), 'error');
                  },
                });
              },
              error: (error) => {
                console.error('[ArticlesMgmt] uploadGalleryImages (create) ERROR:', error);
                this.toast(this.t('SHOP_ARTICLES_MANAGEMENT.PHOTO_ERROR'), 'error');
              },
            });
          } else {
            this.toast(this.t('SHOP_ARTICLES_MANAGEMENT.PRESTA_SUCCESS'), 'success');
            this.closeModal();

            // ✅ refresh complet
            this.refreshAfterMutation();
          }
        },
        error: (error: any) => {
          console.error('[ArticlesMgmt] create service ERROR:', error);
          this.toast(this.t('SHOP_ARTICLES_MANAGEMENT.PRESTA_ERROR'), 'error');
        },
      });
    } catch (err) {
      console.error('[ArticlesMgmt] saveService FATAL:', err);
      this.toast(this.t('ERROR.GENERIC_ERROR'), 'error');
    }
  }

  isFormValid(): boolean {
    return (
      !!this.modalService?.categoryId &&
      !!this.modalService?.name &&
      !!this.modalService?.description &&
      !!this.modalService?.duration &&
      this.modalService?.price !== null &&
      this.modalService?.price !== undefined &&
      Number(this.modalService.price) >= this.MIN_PRICE
    );
  }


  private updateService(serviceId: string, payload: any, fromUpload: boolean = false) {
    if (!serviceId) {
      this.toast(this.t('SHOP_ARTICLES_MANAGEMENT.PRESTA_ERROR'), 'error');
      return;
    }

    this.productService.update(serviceId, payload).subscribe({
      next: () => {
        this.toast(
          this.t(fromUpload ? 'SHOP_ARTICLES_MANAGEMENT.UPDATE_SUCCESS' : 'SHOP_ARTICLES_MANAGEMENT.PRESTA_UPDATED'),
          'success'
        );
        this.closeModal();

        // ✅ refresh complet
        this.refreshAfterMutation();
      },
      error: (error: any) => {
        console.error('[ArticlesMgmt] update service ERROR:', error);
        this.toast(this.t('SHOP_ARTICLES_MANAGEMENT.PRESTA_ERROR'), 'error');
      },
    });
  }

  // ===========================================================
  // Suppression
  // ===========================================================

  deleteService(index: number): void {
    try {
      const toDelete = this.articlesCopyData[index];
      if (!toDelete?._id) return;

      // Optimiste
      this.articlesCopyData.splice(index, 1);

      this.productService.delete(toDelete._id).subscribe({
        next: () => {
          this.toast(this.t('SHOP_ARTICLES_MANAGEMENT.PRESTA_DELETED'), 'success');

          // ✅ refresh complet
          this.refreshAfterMutation();
        },
        error: (error) => {
          console.error('[ArticlesMgmt] delete service ERROR:', error);
          this.toast(this.t('SHOP_ARTICLES_MANAGEMENT.PRESTA_DELETE_ERROR'), 'error');

          // si erreur, on recharge pour remettre la table correcte
          this.refreshAfterMutation();
        },
      });
    } catch (err) {
      console.error('[ArticlesMgmt] deleteService FATAL:', err);
      this.toast(this.t('ERROR.GENERIC_ERROR'), 'error');
    }
  }

  // ===========================================================
  // Refresh centralisé après mutation
  // ===========================================================

  private refreshAfterMutation() {
    const shopId = this.myShopData?._id;
    if (shopId) {
      this.loadServicesAndCategories(shopId);
    }

    // si ton parent doit aussi refresh autre chose, tu peux garder ça
    this.articleUpdated.emit();
  }

  // ===========================================================
  // Divers
  // ===========================================================

  truncateDescription() {
    try {
      if (this.modalService?.description?.length > 50) {
        this.modalService.description = this.modalService.description.substring(0, 50) + '...';
      }
    } catch { }
  }

  enforceMinimumPrice(): void {
    if (this.modalService?.price === null || this.modalService?.price === undefined) {
      return;
    }

    const numericPrice = Number(this.modalService.price);

    if (isNaN(numericPrice) || numericPrice < this.MIN_PRICE) {
      this.modalService.price = this.MIN_PRICE;
    }
  }

}
