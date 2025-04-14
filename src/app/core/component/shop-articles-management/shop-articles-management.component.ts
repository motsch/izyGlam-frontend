import {
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnInit,
    Output,
    SimpleChanges,
} from '@angular/core';
import { ShopService } from '../../services/shop.service';
import { ProductService } from '../../services/product.service';
import { ColorService } from '../../services/color.service';
import { environment } from 'src/environments/environment';
import { ShopTemplateService } from '../../services/shop-template.service';

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

    constructor(
        private productService: ProductService,
        private colorService: ColorService,
        private shopTemplateService: ShopTemplateService
    ) {}

    ngOnInit(): void {
        localStorage.setItem("menu-param", 'management');
        // Initialize articlesCopyData if needed
        this.colorService.getAll().subscribe({
            next: (data: any) => {
                console.log(data);
                this.colors = data;
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
        if (
            changes['myArticlesData'] &&
            changes['myArticlesData'].currentValue
        ) {
            this.articlesCopyData = [...this.myArticlesData];
            for (let elem of this.articlesCopyData) {
                /*elem.image =
                    environment.APIimgStorageUrl +
                    elem.image.replace(/^\/+/, '');*/
            }
            console.log(
                'myArticlesData has been updated:',
                this.myArticlesData
            );
        } else if (
            changes['myShopData'] &&
            changes['myShopData'].currentValue
        ) {
            this.articleUpdated.emit();
        }
    }

    onFileSelected(event: any): void {
        const file: File = event.target.files[0];
        if (file) {
            this.selectedFile = file;

            console.log(
                'Selected File 1 : ' + JSON.stringify(this.selectedFile)
            );
            const reader = new FileReader();
            reader.onload = () => {
                this.imagePreview = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
    }

    uploadImage(): void {
        if (this.selectedFile) {
            console.log('selectedFile =====>');
            console.log(JSON.stringify(this.selectedFile));
            this.productService
                .uploadGalleryImages(
                    this.selectedService._id,
                    this.selectedFile
                )
                .subscribe(
                    (response) => {
                        console.log(
                            'Image uploadée avec succès : ',
                            response.imageUrl
                        );
                    },
                    (error) => {
                        console.error(
                            "Erreur lors de l'upload de l'image : ",
                            error
                        );
                    }
                );
        }
    }

    selectColor(color: string) {
        this.colors.forEach((elem: any) => {
            if (elem.hex === color) {
                elem.selected = true;
            } else {
                elem.selected = false;
            }
        });
        this.selectedColor = color;
        this.modalService.color = color;
    }
    truncateDescription() {
        if (this.modalService.description.length > 50) {
            this.modalService.description =
                this.modalService.description.substring(0, 50) + '...';
        }
    }
    openModal(service?: any): void {
        console.log("this.myShopData : "+ JSON.stringify(this.myShopData))
        if (!service) {
            this.shopTemplateService
                .getServiceTemplatesByCategory(this.myShopData.type)
                .subscribe({
                    next: (data: any[]) => {
                        console.log(data);
                        this.templateByType = data;
                        console.log(
                            "Type de l'article : " + this.myShopData.type
                        );
                        console.log(
                            'TtemplateByType : ' +
                                JSON.stringify(this.templateByType)
                        );

                        // Sélectionner un élément de manière aléatoire :
                        const filteredTemplates = this.templateByType.filter(
                            (x: any) => x.type === this.myShopData.type
                        );

                        if (filteredTemplates.length > 0) {
                            console.log("filteredTemplates .length > 0 ==>" + filteredTemplates.length);
                            const randomIndex = Math.floor(
                                Math.random() * filteredTemplates.length
                            );
                            console.log("randomIndex : " + randomIndex);
                            this.modalService = filteredTemplates[randomIndex];
                        } else {
                            console.log("filteredTemplates .length <= 0 ==>" + filteredTemplates.length);
                            this.modalService = null; // Au cas où il n'y a aucun élément correspondant au type
                        }
                        console.log(
                            'Service Selected : ' + this.modalService.name
                        );
                        console.log(
                            'Service type Selected : ' + this.modalService.type
                        );
                        this.modalService._id = undefined;
                        this.modalService.shopId =
                            this.myArticlesData[0].shopId;

                        this.creationType = this.modalService.type;
                        this.editingServiceIndex = null;
                        service = this.modalService;
                        this.imageUsed = service.image;
                        this.imagePreview = null;
                        this.selectedService = service;
                        this.selectedFile = null;
                    },
                    error: (error: any) => {
                        console.log(error);
                    },
                });
            // return;
        }
        this.imagePreview = null;
        // this.imagePreview = this.modalService.image;
        console.log('OPEN MODAL');
        console.log('OPEN MODAL');
        this.selectedService = service;
        this.modalOpen = true;
        this.imageUsed = service.image;
        // this.imageUsed = environment.APIimgStorageUrl + service.image;
        let coloSelected = this.colors.find((x: any) => x.selected === true);
        coloSelected = false;
        for (let elem of this.colors) {
            if (elem.hex === service.color) {
                elem.selected = true;
            } else {
                elem.selected = false;
            }
        }
        if (service) {
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
            if (this.selectedFile) {
                this.productService
                    .uploadGalleryImages(
                        this.selectedService._id,
                        this.selectedFile
                    )
                    .subscribe(
                        (response) => {
                            console.log(
                                'Image uploadée avec succès : ',
                                response.image
                            );

                            // Retirer "/uploads/images/" de l'URL de l'image
                            const cleanedImageUrl = response.image.replace(
                                '/uploads/images/',
                                ''
                            );
                            console.log(cleanedImageUrl);
                            this.modalService.image = response.image;

                            // Récupérer l'_id du service en cours d'édition
                            const serviceId = this.modalService._id;
                            // Envoyer la mise à jour au serveur avec l'_id
                            this.productService
                                .update(serviceId, this.modalService)
                                .subscribe({
                                    next: (data: any) => {
                                        this.articleUpdated.emit();
                                        console.log(
                                            'Service updated successfully'
                                        );
                                        this.closeModal();
                                    },
                                    error: (error: any) => {
                                        console.log(
                                            'Error updating service:',
                                            error
                                        );
                                    },
                                });
                        },
                        (error) => {
                            console.error(
                                "Erreur lors de l'upload de l'image : ",
                                error
                            );
                        }
                    );
            } else {
                // Récupérer l'_id du service en cours d'édition
                const serviceId = this.modalService._id;
                console.log(serviceId);
                console.log(
                    "Image de l'article dans update : " +
                        this.modalService.image
                );
                //this.modalService.image = this.modalService.image.split('/uploads/images/articles').pop();
                // /uploads/images/articles
                // Envoyer la mise à jour au serveur avec l'_id
                this.productService
                    .update(serviceId, this.modalService)
                    .subscribe({
                        next: (data: any) => {
                            console.log(
                                'Article updated successfully DATA : ' +
                                    JSON.stringify(data)
                            );
                            this.articleUpdated.emit();
                            console.log('Service updated successfully');
                            this.closeModal();
                        },
                        error: (error: any) => {
                            console.log('Error updating service:', error);
                        },
                    });
            }
        } else {
            if (this.selectedFile) {
                this.modalService.shopId = this.myShopData._id;
                // Création du nouvel article
                this.productService.create(this.modalService).subscribe({
                    next: (data: any) => {
                        console.log('Service updated successfully');
                        this.selectedService = data;
                        this.modalService = data;
                        if (!this.selectedFile) {
                            return;
                        }
                        this.productService
                            .uploadGalleryImages(
                                this.selectedService._id,
                                this.selectedFile
                            )
                            .subscribe(
                                (response) => {
                                    console.log(
                                        'Image uploadée avec succès : ',
                                        response.image
                                    );

                                    // Retirer "/uploads/images/" de l'URL de l'image
                                    const cleanedImageUrl =
                                        response.image.replace(
                                            '/uploads/images/',
                                            ''
                                        );
                                    console.log(cleanedImageUrl);
                                    this.modalService.image = response.image;
                                    this.productService
                                        .update(
                                            this.modalService._id,
                                            this.modalService
                                        )
                                        .subscribe({
                                            next: (data: any) => {
                                                this.articleUpdated.emit();
                                                console.log(
                                                    'Service updated successfully'
                                                );
                                                this.closeModal();
                                            },
                                            error: (error: any) => {
                                                console.log(
                                                    'Error updating service:',
                                                    error
                                                );
                                            },
                                        });
                                    // Récupérer l'_id du service en cours d'édition
                                    const serviceId = this.modalService._id;
                                    this.closeModal();
                                    this.articleUpdated.emit();
                                },
                                (error) => {
                                    console.error(
                                        "Erreur lors de l'upload de l'image : ",
                                        error
                                    );
                                }
                            );
                    },
                    error: (error: any) => {
                        console.log('Error updating service:', error);

                        // Ajouter un nouvel article si nous ne sommes pas en mode édition
                        this.articlesCopyData.push(this.modalService);
                    },
                });
            } else {
                // Récupérer l'_id du service en cours d'édition
                const serviceId = this.modalService._id;
                console.log(serviceId);
                console.log(
                    "Image de l'article dans update : " +
                        this.modalService.image
                );
                //this.modalService.image = this.modalService.image.split('/uploads/images/articles').pop();
                // /uploads/images/articles
                // Envoyer la mise à jour au serveur avec l'_id

                this.productService.create(this.modalService).subscribe({
                    next: (data: any) => {
                        console.log('Service updated successfully');

                        console.log(data);
                        this.closeModal();
                        this.articleUpdated.emit();
                    },
                    error: (error: any) => {
                        console.log('Error updating service:', error);

                        // Ajouter un nouvel article si nous ne sommes pas en mode édition
                        this.articlesCopyData.push(this.modalService);
                    },
                });
            }

            /*
            this.modalService.shopId = this.me.shopIds[0];
            this.modalService.image = this.me.shopIds[0];
            this.modalService.type = this.me.shopIds[0];
            */

            // Fermer la modal
            this.closeModal();
        }
    }

    deleteService(index: number): void {
        console.log('INDEX : ' + index);
        // Logique pour supprimer l'image de la galerie
        // const index = this.galleryImages.indexOf(image);
        const toDelete = this.articlesCopyData[index];
        if (index !== -1) {
            this.articlesCopyData.splice(index, 1);
        }

        // this.myShopData.galleryImages = this.galleryImages;
        this.productService.delete(toDelete._id).subscribe({
            next: (data: any) => {
                this.articleUpdated.emit();
                console.log(data);
            },
            error: (error) => {
                console.log('Error updating shop:', error);
            },
        });
    }
}
