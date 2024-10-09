import {
    Component,
    Input,
    OnInit,
    OnChanges,
    SimpleChanges,
    Output,
    EventEmitter,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { UserService } from '../../services/user.service';
import { ShopService } from '../../services/shop.service';
import { ProductService } from '../../services/product.service';
import { ImageService } from '../../services/image.service';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-shop-management',
    templateUrl: './shop-management.component.html',
    styleUrls: ['./shop-management.component.scss'],
})
export class ShopManagementComponent implements OnInit, OnChanges {
    @Input() myShopData: any = {};
    @Input() me: any = {};
    @Output() shopUpdated: EventEmitter<string> = new EventEmitter<string>();
    imageUsed: string | null = null;
    selectedFile: File | null = null;
    imagePreview: string | null = null;
    shopCopyData: any | null = null;
    villes: string[] = ['Paris', 'Berlin', 'Londres', 'Madrid', 'Rome'];
    filteredArrondissements: {
        name: string;
        latitude: number;
        longitude: number;
    }[] = [];
    formModified = false;
    formValid = false;

    arrondissementsParis = [
        { name: '1er', latitude: 48.8626, longitude: 2.3364 },
        { name: '2ème', latitude: 48.8682, longitude: 2.3449 },
        { name: '3ème', latitude: 48.8635, longitude: 2.36 },
        { name: '4ème', latitude: 48.8546, longitude: 2.357 },
        { name: '5ème', latitude: 48.8445, longitude: 2.3488 },
        { name: '6ème', latitude: 48.8493, longitude: 2.3332 },
        { name: '7ème', latitude: 48.8566, longitude: 2.3126 },
        { name: '8ème', latitude: 48.8718, longitude: 2.3115 },
        { name: '9ème', latitude: 48.8767, longitude: 2.3362 },
        { name: '10ème', latitude: 48.8744, longitude: 2.3572 },
        { name: '11ème', latitude: 48.8594, longitude: 2.3798 },
        { name: '12ème', latitude: 48.8414, longitude: 2.3929 },
        { name: '13ème', latitude: 48.8311, longitude: 2.3557 },
        { name: '14ème', latitude: 48.8323, longitude: 2.3233 },
        { name: '15ème', latitude: 48.8407, longitude: 2.2981 },
        { name: '16ème', latitude: 48.862, longitude: 2.2709 },
        { name: '17ème', latitude: 48.8848, longitude: 2.3157 },
        { name: '18ème', latitude: 48.8924, longitude: 2.3447 },
        { name: '19ème', latitude: 48.8847, longitude: 2.3829 },
        { name: '20ème', latitude: 48.8635, longitude: 2.3985 },
    ];

    arrondissementsBerlin = [
        { name: 'Mitte', latitude: 52.52, longitude: 13.405 },
        {
            name: 'Friedrichshain-Kreuzberg',
            latitude: 52.5101,
            longitude: 13.426,
        },
        { name: 'Pankow', latitude: 52.576, longitude: 13.411 },
        {
            name: 'Charlottenburg-Wilmersdorf',
            latitude: 52.5163,
            longitude: 13.3041,
        },
        { name: 'Spandau', latitude: 52.5342, longitude: 13.1996 },
    ];

    arrondissementsLondres = [
        { name: 'Westminster', latitude: 51.4995, longitude: -0.1357 },
        { name: 'Camden', latitude: 51.529, longitude: -0.1255 },
        { name: 'Kensington', latitude: 51.501, longitude: -0.1936 },
        { name: 'Chelsea', latitude: 51.4875, longitude: -0.1682 },
        { name: 'Greenwich', latitude: 51.4821, longitude: -0.0057 },
    ];

    arrondissementsMadrid = [
        { name: 'Centro', latitude: 40.4165, longitude: -3.7036 },
        { name: 'Arganzuela', latitude: 40.398, longitude: -3.6944 },
        { name: 'Retiro', latitude: 40.4136, longitude: -3.6818 },
        { name: 'Salamanca', latitude: 40.4259, longitude: -3.6842 },
        { name: 'Chamartín', latitude: 40.458, longitude: -3.6889 },
    ];

    arrondissementsRome = [
        { name: 'Municipio I', latitude: 41.9009, longitude: 12.4833 },
        { name: 'Municipio II', latitude: 41.913, longitude: 12.4907 },
        { name: 'Municipio III', latitude: 41.961, longitude: 12.5432 },
        { name: 'Municipio IV', latitude: 41.9259, longitude: 12.568 },
        { name: 'Municipio V', latitude: 41.8947, longitude: 12.5306 },
    ];
    // Ajout d'autres arrondissements pour d'autres villes

    constructor(
        private shopService: ShopService,
        private imageService: ImageService
    ) {}

    ngOnInit(): void {
        if (this.myShopData && Object.keys(this.myShopData).length > 0) {
            console.log(this.myShopData.image);
            console.log(this.myShopData);
            this.shopCopyData = { ...this.myShopData };
            this.imageUsed =
                environment.APIimgStorageUrl +
                'uploads/images/' +
                this.shopCopyData.image;
            console.log('shopCopyData initialisé :', this.shopCopyData.image);

            // this.onCityChange();
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['myShopData'] && changes['myShopData'].currentValue) {
            this.shopCopyData = { ...this.myShopData };

            this.imageUsed =
                environment.APIimgStorageUrl +
                'uploads/images/' +
                this.shopCopyData.image;

                console.log('imageUsed :', this.imageUsed);
            this.onCityChange();
        }
    }

    validateForm(): void {
        const descriptionValid =
            this.shopCopyData.description &&
            this.shopCopyData.description.length >= 25;
        const cityValid = this.shopCopyData.ville && this.shopCopyData.district;
        const maxDistanceValid =
            this.shopCopyData.maxDistance && this.shopCopyData.maxDistance > 0;
        const morningHoursValid =
            this.shopCopyData.hours.morning.start &&
            this.shopCopyData.hours.morning.end;
        const afternoonHoursValid =
            this.shopCopyData.hours.afternoon.start &&
            this.shopCopyData.hours.afternoon.end;

        this.formValid =
            descriptionValid &&
            cityValid &&
            maxDistanceValid &&
            morningHoursValid &&
            afternoonHoursValid;
    }

    markFormModified(): void {
        this.formModified = true;
        this.validateForm();
    }

    updateSubmitButtonState(): void {
        const submitButton = document.querySelector(
            'button[type="submit"]'
        ) as HTMLButtonElement;
        if (submitButton) {
            submitButton.disabled = !(this.formValid && this.formModified);
        }
    }

    onCityChange(): void {
        switch (this.shopCopyData.ville) {
            case 'Paris':
                this.filteredArrondissements = this.arrondissementsParis;
                break;
            case 'Berlin':
                this.filteredArrondissements = this.arrondissementsBerlin;
                break;
            case 'Londres':
                this.filteredArrondissements = this.arrondissementsLondres;
                break;
            case 'Madrid':
                this.filteredArrondissements = this.arrondissementsMadrid;
                break;
            case 'Rome':
                this.filteredArrondissements = this.arrondissementsRome;
                break;
            default:
                this.filteredArrondissements = [];
                break;
        }

        if (this.filteredArrondissements.length > 0) {
            this.shopCopyData.district = this.filteredArrondissements[0].name;
            this.shopCopyData.location.latitude =
                this.filteredArrondissements[0].latitude;
            this.shopCopyData.location.longitude =
                this.filteredArrondissements[0].longitude;
        } else {
            this.shopCopyData.district = '';
            this.shopCopyData.location.latitude = 0;
            this.shopCopyData.location.longitude = 0;
        }
        this.markFormModified();
    }

    onDistrictChange(): void {
        const selectedArrondissement = this.filteredArrondissements.find(
            (arr) => arr.name === this.shopCopyData.district
        );
        if (selectedArrondissement) {
            this.shopCopyData.location.latitude =
                selectedArrondissement.latitude;
            this.shopCopyData.location.longitude =
                selectedArrondissement.longitude;
        }
        this.markFormModified();
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
        this.markFormModified();
    }


    saveShop(): void {
        this.myShopData = this.shopCopyData;
        console.log('Enregistrement de la boutique:', this.myShopData);

        if (this.selectedFile) {
            this.imageService.uploadImage(this.selectedFile).subscribe(
                (response) => {
                    console.log(
                        'Image uploadée avec succès : ',
                        response.imageUrl
                    );

                    // Retirer "/uploads/images/" de l'URL de l'image
                    const cleanedImageUrl = response.imageUrl.replace(
                        '/uploads/images/',
                        ''
                    );

                    this.myShopData.image = cleanedImageUrl;
                    this.shopService.update(this.myShopData).subscribe({
                        next: (data: any) => {
                            console.log(data);
                            this.shopCopyData = { ...data };
                            this.myShopData = { ...data };

                            this.imageUsed =
                                environment.APIimgStorageUrl +
                                this.shopCopyData.image;
                            this.imagePreview = null;

                            this.shopUpdated.emit(this.myShopData._id);
                            console.log(
                                'shopCopyData initialisé :',
                                this.shopCopyData
                            );
                        },
                        error: (error: any) => {
                            console.log(error);
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
            this.shopService.update(this.myShopData).subscribe({
                next: (data: any) => {
                    console.log(data);
                    this.shopCopyData = { ...data };
                    this.myShopData = { ...data };
                    this.shopUpdated.emit(this.myShopData._id);
                },
                error: (error: any) => {
                    console.log(error);
                },
            });
        }
    }
}
