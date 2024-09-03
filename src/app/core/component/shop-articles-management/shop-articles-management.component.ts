import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { ShopService } from '../../services/shop.service';
import { ProductService } from '../../services/product.service';

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

    constructor(private productService: ProductService) {}

    ngOnInit(): void {
        // Initialize articlesCopyData if needed
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

    openModal(service?: any): void {
        console.log('OPEN MODAL');
        this.modalOpen = true;
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
