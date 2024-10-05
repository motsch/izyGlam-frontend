import {
    Component,
    Input,
    OnInit,
    OnChanges,
    SimpleChanges,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { ShopService } from '../../services/shop.service';
import { ProductService } from '../../services/product.service';
import { ImageService } from '../../services/image.service';

@Component({
    selector: 'app-shop-management',
    templateUrl: './shop-management.component.html',
    styleUrls: ['./shop-management.component.scss'],
})
export class ShopManagementComponent implements OnInit, OnChanges {
    @Input() myShopData: any = {};
    @Input() me: any = {};

    selectedFile: File | null = null;
    imagePreview: string | null = null;
    shopCopyData: any = {
        name: '',
        description: '',
        image: '',
        averagePrice: '',
        ville: '',
        location: {
            latitude: 0,
            longitude: 0,
        },
        hours: {
            morning: {
                start: 0,
                end: 0,
            },
            afternoon: {
                start: 0,
                end: 0,
            },
        },
    };

    constructor(
        private shopService: ShopService,
        private imageService: ImageService
    ) {}

    ngOnInit(): void {
        // Initialisation : vérifie si les données sont disponibles au chargement
        if (this.myShopData && Object.keys(this.myShopData).length > 0) {
            this.shopCopyData = { ...this.myShopData };
            console.log(
                'myShopData initialisé dans ngOnInit :',
                this.shopCopyData
            );
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        // Si myShopData change après l'initialisation, on met à jour shopCopyData
        if (changes['myShopData'] && changes['myShopData'].currentValue) {
            this.shopCopyData = { ...this.myShopData }; // Met à jour les données
            console.log(
                'myShopData a été mis à jour via ngOnChanges :',
                this.shopCopyData
            );
        }
    }

    // Méthode appelée lorsque l'utilisateur sélectionne un fichier
    onFileSelected(event: any): void {
        const file: File = event.target.files[0];
        if (file) {
            this.selectedFile = file;

            // Affichage de l'aperçu de l'image
            const reader = new FileReader();
            reader.onload = () => {
                this.imagePreview = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
    }

    // Méthode pour uploader l'image
    uploadImage(): void {
        if (this.selectedFile) {
            this.imageService.uploadImage(this.selectedFile).subscribe(
                (response) => {
                    console.log(
                        'Image uploadée avec succès : ',
                        response.imageUrl
                    );
                    // Tu peux stocker l'URL de l'image dans la boutique ici si nécessaire
                    // this.shopCopyData.image = response.imageUrl;
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
    saveShop(): void {
        this.myShopData = this.shopCopyData;
        console.log('Enregistrement de la boutique:', this.myShopData);
        this.shopService.update(this.myShopData).subscribe({
            next: (data: any) => {
                console.log(data);
                this.shopCopyData = { ...data };
                this.myShopData = { ...data };
            },
            error: (error: any) => {
                console.log(error);
            },
        });
    }
}
