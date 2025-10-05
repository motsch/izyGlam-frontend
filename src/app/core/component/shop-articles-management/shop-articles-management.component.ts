import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ChangeDetectorRef,
} from '@angular/core';
import { finalize } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

import { ShopService } from '../../services/shop.service';
import { ProductService } from '../../services/product.service';
import { ColorService } from '../../services/color.service';
import { ShopTemplateService } from '../../services/shop-template.service';

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
  @Input() me: any = {};                     // Utilisateur courant (si utile pour permissions, etc.)
  @Output() articleUpdated = new EventEmitter<string>(); // Notifie le parent pour recharger

  // ===========================
  // État local
  // ===========================
  services: any[] = [];                      // Non utilisé ici mais conservé si template s’en sert
  selectedService: any = {};                 // Élément sélectionné (ligne)
  modalOpen = false;                         // Toggle modal détail
  editingServiceIndex: number | null = null; // Index du service en cours d’édition dans la table
  articlesCopyData: any[] = [];              // Copie immuable pour patch visuel
  modalService: any = {};                    // Snapshot de l’élément affiché en modal (édition/création)
  colors: any[] = [];                        // Palette de couleurs (backend)
  selectedColor = '';                        // Couleur sélectionnée
  imgStorageUrl: string = environment.APIimgStorageUrl.replace(/\/$/, '');
  imageUsed: string | null = null;           // Image finale utilisée (génération IA ou upload)
  selectedFile: File | null = null;          // Fichier local sélectionné
  imagePreview: string | null = null;        // Aperçu base64 lors d’un upload
  templateByType: any[] = [];                // Templates de services selon la catégorie du shop
  creationType: string | null = null;        // Type du template choisi
  isGeneratingDescription = false;           // Spinner génération description
  isGeneratingImage = false;                 // Spinner génération image

  constructor(
    private productService: ProductService,
    private colorService: ColorService,
    private shopTemplateService: ShopTemplateService,
    private toastr: ToastrService,
    private translate: TranslateService,
    private shopService: ShopService,
    private cd: ChangeDetectorRef
  ) {}

  // ===========================================================
  // Lifecycle
  // ===========================================================

  ngOnInit(): void {
    try {
      localStorage.setItem('menu-param', 'management');
      // Récupération palette couleurs
      this.colorService.getAll().subscribe({
        next: (data: any) => {
          this.colors = (data || []).map((c: any) => ({ ...c, selected: false }));
        },
        error: (error: any) => {
          console.error('[ArticlesMgmt] getAll colors ERROR:', error);
          this.toast(this.t('SHOP_ARTICLES_MANAGEMENT.ERROR_COLORS'), 'error');
        },
      });
    } catch (err) {
      console.error('[ArticlesMgmt] ngOnInit FATAL:', err);
      this.toast(this.t('ERROR.GENERIC_ERROR'), 'error');
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    try {
      // Synchronise la table quand le parent change la source
      if (changes['myArticlesData']?.currentValue) {
        this.articlesCopyData = [...this.myArticlesData];
        console.log('[ArticlesMgmt] myArticlesData updated:', this.myArticlesData);
      }
      // Informe le parent si la boutique change (cas où le parent veut re-fetch côté haut)
      if (changes['myShopData']?.currentValue) {
        this.articleUpdated.emit();
      }
    } catch (err) {
      console.error('[ArticlesMgmt] ngOnChanges FATAL:', err);
      this.toast(this.t('ERROR.GENERIC_ERROR'), 'error');
    }
  }

  // ===========================================================
  // Helpers d’UI / Toasts / i18n
  // ===========================================================

  /** Raccourci i18n avec fallback texte brut si clé absente */
  private t(keyOrText: string): string {
    try {
      const tr = this.translate.instant(keyOrText);
      return tr && tr !== keyOrText ? tr : keyOrText;
    } catch {
      return keyOrText;
    }
  }

  /** Toast centralisé (success|error) */
  private toast(msg: string, type: 'success' | 'error' = 'success') {
    try {
      if (type === 'success') this.toastr.success(msg);
      else this.toastr.error(msg);
    } catch (err) {
      console.warn('[ArticlesMgmt] toast WARN (fallback):', err);
    }
  }

  /** Patch immuable d’une ligne (index = this.editingServiceIndex) */
  private patchEditedRow(patch: Partial<any>) {
    if (this.editingServiceIndex !== null && this.editingServiceIndex > -1) {
      this.articlesCopyData = this.articlesCopyData.map((s, i) =>
        i === this.editingServiceIndex ? { ...s, ...patch } : s
      );
    }
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

  uploadImage(): void {
    try {
      if (!this.selectedFile || !this.selectedService?._id) {
        console.warn('[ArticlesMgmt] uploadImage: missing file or serviceId');
        return;
      }
      this.productService.uploadGalleryImages(this.selectedService._id, this.selectedFile).subscribe({
        next: () => {
          this.toast(this.t('SHOP_ARTICLES_MANAGEMENT.IMAGE_OK'), 'success');
        },
        error: (error) => {
          console.error("[ArticlesMgmt] uploadGalleryImages ERROR:", error);
          this.toast(this.t('SHOP_ARTICLES_MANAGEMENT.ERROR_IMAGE_LOAD'), 'error');
        },
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
  // Générations IA : Description / Image
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

  /** Génère une description via backend (IA) et met à jour modal + table */
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
            console.log('[ArticlesMgmt] gen description response:', prod);
            const newDescription = prod?.description || '';
            this.modalService.description = newDescription;     // modal
            this.patchEditedRow({ description: newDescription }); // table
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

  /** Génère une image via backend (IA) et met à jour modal + aperçu + table */
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

            // MAJ modal + aperçu local
            this.modalService.image = newImagePath;
            this.imageUsed = newImagePath;
            this.imagePreview = null;
            this.selectedFile = null;

            // MAJ table (ligne en cours d’édition)
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
  // Modale (ouverture/fermeture)
  // ===========================================================

  /** Ouvre la modale : en création (service undefined) ou en édition (service fourni) */
  openModal(service?: any): void {
    try {
      console.log('[ArticlesMgmt] openModal shopData:', this.myShopData);

      // Cas CREATION (pas de service fourni)
      if (!service) {
        this.imageUsed = null;
        this.shopTemplateService
          .getServiceTemplatesByCategory(this.myShopData.type)
          .subscribe({
            next: (data: any[]) => {
              this.templateByType = data || [];

              // Filtrage par type du shop
              const filtered = this.templateByType.filter((x: any) => x.type === this.myShopData.type);

              // Pick aléatoire si dispo, sinon null
              this.modalService = filtered.length > 0
                ? filtered[Math.floor(Math.random() * filtered.length)]
                : null;

              if (this.modalService) {
                // Nettoyage des champs « template »
                this.modalService._id = undefined;
                this.modalService.shopId = this.myArticlesData?.[0]?.shopId || this.myShopData?._id;
                this.creationType = this.modalService.type;
                this.editingServiceIndex = null;

                // Image/preview/reset
                this.imageUsed = this.modalService.image;
                this.imagePreview = null;
                this.selectedService = this.modalService;
                this.selectedFile = null;
              }
            },
            error: (error: any) => {
              console.error('[ArticlesMgmt] getServiceTemplatesByCategory ERROR:', error);
              this.toast(this.t('SHOP_ARTICLES_MANAGEMENT.ERROR_TEMPLATE_LOAD') || this.t('ERROR.GENERIC_ERROR'), 'error');
            },
          });
      }

      // Ouverture effective de la modal (pour les deux cas)
      this.imagePreview = null;
      this.selectedService = service;
      this.modalOpen = true;

      if (service) {
        // Cas EDITION
        this.imageUsed = service.image;

        // Couleurs: reflète la sélection existante
        for (const c of this.colors) c.selected = c.hex === service.color;

        // Copie indépendante pour édition dans la modal
        this.modalService = { ...service };

        // Mémorise l’index pour patcher l’UI de la ligne au fil de l’édition
        this.editingServiceIndex = this.articlesCopyData.indexOf(service);
      } else if (!this.modalService) {
        // Si aucun template trouvé, modal serait vide → feedback
        this.modalService = {};
        this.editingServiceIndex = null;
        this.toast(this.t('SHOP_ARTICLES_MANAGEMENT.NO_TEMPLATE'), 'error');
      }
    } catch (err) {
      console.error('[ArticlesMgmt] openModal FATAL:', err);
      this.toast(this.t('ERROR.GENERIC_ERROR'), 'error');
    }
  }

  closeModal(): void {
    try {
      this.modalOpen = false;
    } catch (err) {
      console.error('[ArticlesMgmt] closeModal ERROR:', err);
    }
  }

  // ===========================================================
  // Sauvegarde (édition / création)
  // ===========================================================

  saveService(): void {
    try {
      // MODE ÉDITION
      if (this.editingServiceIndex !== null) {
        // Upload image si nécessaire, puis update du service
        if (this.selectedFile) {
          // 1) Upload image
          this.productService.uploadGalleryImages(this.selectedService._id, this.selectedFile).subscribe({
            next: (response) => {
              // Nettoyage éventuel du chemin si ton backend le requiert
              // const cleanedImageUrl = response.image?.replace('/uploads/images/', '');
              this.modalService.image = response?.image || this.modalService.image;

              // 2) Update service avec la nouvelle image
              this.updateService(this.modalService._id, this.modalService, true);
            },
            error: (error) => {
              console.error("[ArticlesMgmt] uploadGalleryImages (edit) ERROR:", error);
              this.toast(this.t('SHOP_ARTICLES_MANAGEMENT.ERROR_IMAGE_LOAD'), 'error');
            },
          });
        } else {
          // Édition sans changement d’image
          this.updateService(this.modalService._id, this.modalService);
        }
        return;
      }

      // MODE CRÉATION
      this.modalService.shopId = this.myShopData?._id || this.modalService?.shopId;

      // 1) Crée l’objet (sans image au besoin)
      this.productService.create(this.modalService).subscribe({
        next: (created: any) => {
          this.selectedService = created;
          this.modalService = created;

          // 2) S’il y a un fichier, upload + update (pour lier l’image)
          if (this.selectedFile) {
            this.productService.uploadGalleryImages(this.selectedService._id, this.selectedFile).subscribe({
              next: (uploadRes) => {
                this.modalService.image = uploadRes?.image || this.modalService.image;

                this.productService.update(this.modalService._id, this.modalService).subscribe({
                  next: () => {
                    this.articleUpdated.emit();
                    this.toast(this.t('SHOP_ARTICLES_MANAGEMENT.PRESTA_SUCCESS'), 'success');
                    this.closeModal();
                  },
                  error: (error: any) => {
                    console.error('[ArticlesMgmt] update after upload (create) ERROR:', error);
                    this.toast(this.t('SHOP_ARTICLES_MANAGEMENT.PRESTA_ERROR'), 'error');
                  },
                });
              },
              error: (error) => {
                console.error("[ArticlesMgmt] uploadGalleryImages (create) ERROR:", error);
                this.toast(this.t('SHOP_ARTICLES_MANAGEMENT.PHOTO_ERROR'), 'error');
              },
            });
          } else {
            // Création simple (pas de fichier)
            this.toast(this.t('SHOP_ARTICLES_MANAGEMENT.PRESTA_SUCCESS'), 'success');
            this.closeModal();
            this.articleUpdated.emit();
          }
        },
        error: (error: any) => {
          console.error('[ArticlesMgmt] create service ERROR:', error);
          this.toast(this.t('SHOP_ARTICLES_MANAGEMENT.PRESTA_ERROR'), 'error');
          // Optionnel: on laisse l’élément dans la table pour que l’utilisateur ne perde pas tout
          this.articlesCopyData.push(this.modalService);
        },
      });
    } catch (err) {
      console.error('[ArticlesMgmt] saveService FATAL:', err);
      this.toast(this.t('ERROR.GENERIC_ERROR'), 'error');
    }
  }

  /** Update générique + toasts + fermeture modal + notify parent */
  private updateService(serviceId: string, payload: any, fromUpload: boolean = false) {
    if (!serviceId) {
      console.warn('[ArticlesMgmt] updateService: missing serviceId');
      this.toast(this.t('SHOP_ARTICLES_MANAGEMENT.PRESTA_ERROR'), 'error');
      return;
    }
    this.productService.update(serviceId, payload).subscribe({
      next: () => {
        this.articleUpdated.emit();
        this.toast(
          this.t(fromUpload ? 'SHOP_ARTICLES_MANAGEMENT.UPDATE_SUCCESS' : 'SHOP_ARTICLES_MANAGEMENT.PRESTA_UPDATED'),
          'success'
        );
        this.closeModal();
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
      if (!toDelete?._id) {
        console.warn('[ArticlesMgmt] deleteService: no _id on item');
        return;
      }

      // Optimiste : on retire immédiatement de la table
      if (index !== -1) {
        this.articlesCopyData.splice(index, 1);
      }

      this.productService.delete(toDelete._id).subscribe({
        next: () => {
          this.articleUpdated.emit();
          this.toast(this.t('SHOP_ARTICLES_MANAGEMENT.PRESTA_DELETED'), 'success');
        },
        error: (error) => {
          console.error('[ArticlesMgmt] delete service ERROR:', error);
          this.toast(this.t('SHOP_ARTICLES_MANAGEMENT.PRESTA_DELETE_ERROR'), 'error');
        },
      });
    } catch (err) {
      console.error('[ArticlesMgmt] deleteService FATAL:', err);
      this.toast(this.t('ERROR.GENERIC_ERROR'), 'error');
    }
  }

  // ===========================================================
  // Divers
  // ===========================================================

  truncateDescription() {
    try {
      if (this.modalService?.description?.length > 50) {
        this.modalService.description = this.modalService.description.substring(0, 50) + '...';
      }
    } catch (err) {
      console.warn('[ArticlesMgmt] truncateDescription WARN:', err);
    }
  }
}
