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
import { ShopService } from '../../services/shop.service';
import { ProductService } from '../../services/product.service';
import { ColorService } from '../../services/color.service';
import { environment } from 'src/environments/environment';
import { ShopTemplateService } from '../../services/shop-template.service';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'app-shop-articles-management',
    templateUrl: './shop-articles-management.component.html',
    styleUrls: ['./shop-articles-management.component.scss'],
})
export class ShopArticlesManagementComponent implements OnInit, OnChanges {
    @Input() myArticlesData: any[] = [];
    @Input() myShopData: any = {};
    @Input() me: any = {};
    @Output() articleUpdated: EventEmitter<string> = new EventEmitter<string>();

    services: any[] = [];
    selectedService: any = {};
    modalOpen = false;
    editingServiceIndex: number | null = null;
    articlesCopyData: any[] = [];
    modalService: any = {};
    colors: any[] = [];
    selectedColor: string = '';
    imgStorageUrl: string = environment.APIimgStorageUrl.replace(/\/$/, '');
    imageUsed: string | null = null;
    selectedFile: File | null = null;
    imagePreview: string | null = null;
    templateByType: any[] = [];
    creationType: string | null = null;

    isGeneratingDescription = false;
    isGeneratingImage = false;

    constructor(
        private productService: ProductService,
        private colorService: ColorService,
        private shopTemplateService: ShopTemplateService,
        private toastr: ToastrService,
        private translate: TranslateService,
        private shopService: ShopService,
        private cd: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        localStorage.setItem('menu-param', 'management');
        this.colorService.getAll().subscribe({
            next: (data: any) => {
                this.colors = data || [];
                for (let elem of this.colors) {
                    elem.selected = false;
                }
            },
            error: (error: any) => {
                console.log(error);
            },
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['myArticlesData'] && changes['myArticlesData'].currentValue) {
            this.articlesCopyData = [...this.myArticlesData];
            console.log('myArticlesData has been updated:', this.myArticlesData);
        } else if (changes['myShopData'] && changes['myShopData'].currentValue) {
            this.articleUpdated.emit();
        }
    }

    onFileSelected(event: any): void {
        const file: File = event.target.files?.[0];
        if (file) {
            this.selectedFile = file;
            const reader = new FileReader();
            reader.onload = () => {
                this.imagePreview = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
    }

    showCustomToast(message: string) {
        this.toastr.success(message);
    }

    // ---------- Patch utilitaire : propage un patch à la ligne du tableau en cours d’édition ----------
    private patchEditedRow(patch: Partial<any>) {
        if (this.editingServiceIndex !== null && this.editingServiceIndex > -1) {
            // immutabilité pour déclencher proprement le CD
            this.articlesCopyData = this.articlesCopyData.map((s, i) =>
                i === this.editingServiceIndex ? { ...s, ...patch } : s
            );
        }
    }

    // ---------- Wrappers appelés par le template ----------
    onGenerateDescription() {
        if (this.isGeneratingDescription) return; // anti double-clic
        this.isGeneratingDescription = true;
        this.generateIzyGlamProductDescription(this.modalService);
    }

    onGenerateImage() {
        if (this.isGeneratingImage) return;
        this.isGeneratingImage = true;
        this.generateIzyGlamImage(this.modalService);
    }

    uploadImage(): void {
        if (this.selectedFile) {
            this.productService
                .uploadGalleryImages(this.selectedService._id, this.selectedFile)
                .subscribe(
                    (response) => {
                        this.showCustomToast(
                            this.translate.instant('SHOP_ARTICLES_MANAGEMENT.IMAGE_OK')
                        );
                    },
                    (error) => {
                        console.error("Erreur lors de l'upload de l'image : ", error);
                        this.showCustomToast(
                            this.translate.instant(
                                'SHOP_ARTICLES_MANAGEMENT.ERROR_IMAGE_LOAD'
                            )
                        );
                    }
                );
        }
    }

    selectColor(color: string) {
        this.colors.forEach((elem: any) => {
            elem.selected = elem.hex === color;
        });
        this.selectedColor = color;
        if (this.modalService) {
            this.modalService.color = color;
            // reflet immédiat dans la ligne en édition
            this.patchEditedRow({ color });
        }
    }

    // ---------- Génération : Description (maj MODAL + TABLEAU) ----------
    generateIzyGlamProductDescription(product: any) {
        const type = product?.type;
        // const userDescription = this.myShopData?.description || null;

        // shop-articles-management.component.ts
        this.shopService.generateIzyGlamProductDescription(product)
            .pipe(
                finalize(() => {
                    this.isGeneratingDescription = false;
                    this.cd.detectChanges();
                })
            )
            .subscribe({
                next: (prod: any) => {
                    console.log('Réponse backend :', prod); // <-- ici tu verras bien l'objet
                    const newDescription = prod?.description || '';

                    // 1) MAJ immédiate de la modal
                    this.modalService.description = newDescription;

                    // 2) MAJ de la ligne du tableau si on est en édition
                    this.patchEditedRow({ description: newDescription });

                    this.showCustomToast(
                        this.translate.instant('SHOP_MANAGEMENT.DESCRIPTION_OK') ||
                        'Description générée ✅'
                    );
                },
                error: (err: any) => {
                    console.error('Erreur lors de la génération de la description :', err);
                    this.showCustomToast(
                        this.translate.instant('SHOP_ARTICLES_MANAGEMENT.ERROR_GENERATE_DESC') ||
                        'Erreur de génération ❌'
                    );
                },
            });
    }

    // ---------- Génération : Image (maj MODAL + APERÇU + TABLEAU) ----------
    generateIzyGlamImage(product: any) {
        const type = product?.type;
        const userDescription = this.myShopData?.description || null;

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
                    const newImagePath =
                        data?.image ?? data?.imageUrl ?? data?.result?.image ?? null;

                    if (!newImagePath) {
                        this.showCustomToast(
                            this.translate.instant(
                                'SHOP_ARTICLES_MANAGEMENT.ERROR_IMAGE_LOAD'
                            ) || 'Image non reçue ❌'
                        );
                        return;
                    }

                    // 1) MAJ MODAL (données + aperçu)
                    this.modalService.image = newImagePath;
                    this.imageUsed = newImagePath; // <img [src]="imgStorageUrl + imageUsed">
                    this.imagePreview = null;
                    this.selectedFile = null;

                    // 2) MAJ TABLEAU (ligne en cours d’édition)
                    this.patchEditedRow({ image: newImagePath });

                    this.showCustomToast(
                        this.translate.instant('SHOP_ARTICLES_MANAGEMENT.IMAGE_OK') ||
                        'Image générée ✅'
                    );

                    // Si tu veux informer le parent pour re-fetch global : décommente
                    // this.articleUpdated.emit();
                },
                error: (err: any) => {
                    console.error('Erreur lors de la génération de l’image :', err);
                    this.showCustomToast(
                        this.translate.instant(
                            'SHOP_ARTICLES_MANAGEMENT.ERROR_IMAGE_LOAD'
                        ) || 'Erreur de génération ❌'
                    );
                },
            });
    }

    truncateDescription() {
        if (this.modalService?.description?.length > 50) {
            this.modalService.description =
                this.modalService.description.substring(0, 50) + '...';
        }
    }

    openModal(service?: any): void {
        console.log('this.myShopData : ' + JSON.stringify(this.myShopData));
        if (!service) {
            this.imageUsed = null;
            this.shopTemplateService
                .getServiceTemplatesByCategory(this.myShopData.type)
                .subscribe({
                    next: (data: any[]) => {
                        this.templateByType = data || [];

                        const filteredTemplates = this.templateByType.filter(
                            (x: any) => x.type === this.myShopData.type
                        );

                        if (filteredTemplates.length > 0) {
                            const randomIndex = Math.floor(
                                Math.random() * filteredTemplates.length
                            );
                            this.modalService = filteredTemplates[randomIndex];
                        } else {
                            this.modalService = null;
                        }

                        if (this.modalService) {
                            this.modalService._id = undefined;
                            this.modalService.shopId = this.myArticlesData?.[0]?.shopId;
                            this.creationType = this.modalService.type;
                            this.editingServiceIndex = null;
                            service = this.modalService;
                            this.imageUsed = service.image;
                            this.imagePreview = null;
                            this.selectedService = service;
                            this.selectedFile = null;
                        }
                    },
                    error: (error: any) => {
                        console.log(error);
                    },
                });
        }

        this.imagePreview = null;
        this.selectedService = service;
        this.modalOpen = true;

        if (service) {
            this.imageUsed = service.image;

            // couleurs
            for (let elem of this.colors) {
                elem.selected = elem.hex === service.color;
            }

            // copie pour la modal et index pour patcher le tableau
            this.modalService = { ...service };
            this.editingServiceIndex = this.articlesCopyData.indexOf(service);
        } else {
            this.modalService = {};
            this.editingServiceIndex = null;
        }
    }

    closeModal(): void {
        this.modalOpen = false;
    }

    saveService(): void {
        if (this.editingServiceIndex !== null) {
            // MODE ÉDITION
            if (this.selectedFile) {
                this.productService
                    .uploadGalleryImages(this.selectedService._id, this.selectedFile)
                    .subscribe(
                        (response) => {
                            const cleanedImageUrl = response.image?.replace(
                                '/uploads/images/',
                                ''
                            );
                            this.modalService.image = response.image;

                            const serviceId = this.modalService._id;
                            this.productService.update(serviceId, this.modalService).subscribe({
                                next: (data: any) => {
                                    this.articleUpdated.emit();
                                    this.closeModal();
                                    this.showCustomToast(
                                        this.translate.instant(
                                            'SHOP_ARTICLES_MANAGEMENT.UPDATE_SUCCESS'
                                        )
                                    );
                                },
                                error: (error: any) => {
                                    console.log('Error updating service:', error);
                                    this.showCustomToast(
                                        this.translate.instant(
                                            'SHOP_ARTICLES_MANAGEMENT.ERROR_PRESTA'
                                        )
                                    );
                                },
                            });
                        },
                        (error) => {
                            console.error("Erreur lors de l'upload de l'image : ", error);
                        }
                    );
            } else {
                const serviceId = this.modalService._id;
                this.productService.update(serviceId, this.modalService).subscribe({
                    next: (data: any) => {
                        this.articleUpdated.emit();
                        this.showCustomToast(
                            this.translate.instant(
                                'SHOP_ARTICLES_MANAGEMENT.PRESTA_UPDATED'
                            )
                        );
                        this.closeModal();
                    },
                    error: (error: any) => {
                        console.log('Error updating service:', error);
                        this.showCustomToast(
                            this.translate.instant('SHOP_ARTICLES_MANAGEMENT.PRESTA_ERROR')
                        );
                    },
                });
            }
        } else {
            // MODE CRÉATION
            if (this.selectedFile) {
                this.modalService.shopId = this.myShopData._id;
                this.productService.create(this.modalService).subscribe({
                    next: (data: any) => {
                        this.selectedService = data;
                        this.modalService = data;

                        if (!this.selectedFile) {
                            this.closeModal();
                            this.articleUpdated.emit();
                            return;
                        }

                        this.productService
                            .uploadGalleryImages(this.selectedService._id, this.selectedFile)
                            .subscribe(
                                (response) => {
                                    const cleanedImageUrl = response.image?.replace(
                                        '/uploads/images/',
                                        ''
                                    );
                                    this.modalService.image = response.image;

                                    this.productService
                                        .update(this.modalService._id, this.modalService)
                                        .subscribe({
                                            next: (data: any) => {
                                                this.articleUpdated.emit();
                                                this.showCustomToast(
                                                    this.translate.instant(
                                                        'SHOP_ARTICLES_MANAGEMENT.PRESTA_SUCCESS'
                                                    )
                                                );
                                                this.closeModal();
                                            },
                                            error: (error: any) => {
                                                console.log('Error updating service:', error);
                                                this.showCustomToast(
                                                    this.translate.instant(
                                                        'SHOP_ARTICLES_MANAGEMENT.PRESTA_ERROR'
                                                    )
                                                );
                                            },
                                        });

                                    this.closeModal();
                                    this.articleUpdated.emit();
                                },
                                (error) => {
                                    console.error("Erreur lors de l'upload de l'image : ", error);
                                    this.showCustomToast(
                                        this.translate.instant(
                                            'SHOP_ARTICLES_MANAGEMENT.PHOTO_ERROR'
                                        )
                                    );
                                }
                            );
                    },
                    error: (error: any) => {
                        console.log('Error updating service:', error);
                        this.showCustomToast(
                            this.translate.instant('SHOP_ARTICLES_MANAGEMENT.PRESTA_ERROR')
                        );
                        this.articlesCopyData.push(this.modalService);
                    },
                });
            } else {
                const serviceId = this.modalService._id;
                this.productService.create(this.modalService).subscribe({
                    next: (data: any) => {
                        this.showCustomToast(
                            this.translate.instant('SHOP_ARTICLES_MANAGEMENT.PRESTA_SUCCESS')
                        );
                        this.closeModal();
                        this.articleUpdated.emit();
                    },
                    error: (error: any) => {
                        console.log('Error updating service:', error);
                        this.showCustomToast(
                            this.translate.instant('SHOP_ARTICLES_MANAGEMENT.PRESTA_ERROR')
                        );
                        this.articlesCopyData.push(this.modalService);
                    },
                });
            }

            this.closeModal();
        }
    }

    deleteService(index: number): void {
        const toDelete = this.articlesCopyData[index];
        if (index !== -1) {
            this.articlesCopyData.splice(index, 1);
        }

        this.productService.delete(toDelete._id).subscribe({
            next: (data: any) => {
                this.articleUpdated.emit();
                this.showCustomToast(
                    this.translate.instant('SHOP_ARTICLES_MANAGEMENT.PRESTA_DELETED')
                );
            },
            error: (error) => {
                this.showCustomToast(
                    this.translate.instant(
                        'SHOP_ARTICLES_MANAGEMENT.PRESTA_DELETE_ERROR'
                    )
                );
                console.log('Error updating shop:', error);
            },
        });
    }
}
