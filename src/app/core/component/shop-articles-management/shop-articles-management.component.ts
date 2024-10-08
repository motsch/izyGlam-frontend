import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { ShopService } from '../../services/shop.service';
import { ProductService } from '../../services/product.service';
import { ColorService } from '../../services/color.service';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-shop-articles-management',
    templateUrl: './shop-articles-management.component.html',
    styleUrls: ['./shop-articles-management.component.scss'],
})
export class ShopArticlesManagementComponent implements OnInit {
    @Input() myArticlesData: any[] = [];
    @Input() me: any = {};
    services: any[] = [];
    modalOpen = false;
    editingServiceIndex: number | null = null;
    articlesCopyData: any[] = [];
    modalService: any = {};
    colors: any[] = [];
    selectedColor: string = '';
    imgStorageUrl: string = environment.imgStorageUrl;
    imageUsed: string | null = null;
    selectedFile: File | null = null;
    imagePreview: string | null = null;

    constructor(private productService: ProductService, private colorService: ColorService) {}

    ngOnInit(): void {
        // Initialize articlesCopyData if needed
        this.colorService.getAll().subscribe({
            next: (data: any) => {
                console.log(data);
                this.colors = data;
                for(let elem of this.colors) {
                    elem.selected = false;
                }
            },
            error: (error: any) => {
                console.log(error);
            },
        });
    }

    onFileSelected(event: any): void {
        const file: File = event.target.files[0];
        if (file) {
            this.selectedFile = file;

            const reader = new FileReader();
            reader.onload = () => {
                this.imagePreview = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
    }

    selectColor(color: string) {
        this.colors.forEach((elem: any) => {
            if(elem.hex === color) {
                elem.selected = true;
            } else {
                elem.selected = false;
            }
        });
        this.selectedColor = color;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (
            changes['myArticlesData'] &&
            changes['myArticlesData'].currentValue
        ) {
            this.articlesCopyData = [...this.myArticlesData];
            console.log(
                'myArticlesData has been updated:',
                this.myArticlesData
            );
        }
    }
    truncateDescription() {
        if (this.modalService.description.length > 50) {
          this.modalService.description = this.modalService.description.substring(0, 50) + '...';
        }
      }
    openModal(service?: any): void {
        console.log('OPEN MODAL');
        this.modalOpen = true;
        this.imageUsed = environment.APIimgStorageUrl + service.image;
        let coloSelected =this.colors.find((x: any) => x.selected === true);
        coloSelected = false;
            for (let elem of this.colors) {
                if(elem.hex === service.color) {
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
            // Récupérer l'_id du service en cours d'édition
            const serviceId = this.modalService._id;

            // Mettre à jour l'article dans le tableau local
            this.articlesCopyData[this.editingServiceIndex] = this.modalService;
            console.log(serviceId);
            // Envoyer la mise à jour au serveur avec l'_id
            this.productService.update(serviceId).subscribe({
                next: (data: any) => {
                    console.log('Service updated successfully');
                },
                error: (error: any) => {
                    console.log('Error updating service:', error);
                },
            });
        } else {
            this.modalService.shopId = this.me.shopIds[0];
            this.modalService.image = this.me.shopIds[0];
            this.modalService.type = this.me.shopIds[0];
            this.modalService.price = 20;
            this.modalService.duration = 20;
            console.log(this.modalService);
            this.productService.create(this.modalService).subscribe({
                next: (data: any) => {
                    console.log('Service updated successfully');
                    this.productService
                        .getProductsByShop(this.me.shopIds[0])
                        .subscribe({
                            next: (data: any) => {
                                console.log(data);
                            },
                            error: (error: any) => {
                                console.log(error);
                            },
                        });
                },
                error: (error: any) => {
                    console.log('Error updating service:', error);

                    // Ajouter un nouvel article si nous ne sommes pas en mode édition
                    this.articlesCopyData.push(this.modalService);
                },
            });

            // Fermer la modal
            this.closeModal();
        }
    }

    deleteService(index: number): void {
        this.articlesCopyData.splice(index, 1);
    }
}
