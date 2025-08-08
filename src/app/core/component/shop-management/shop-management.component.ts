import {
    Component,
    Input,
    OnInit,
    OnChanges,
    SimpleChanges,
    Output,
    EventEmitter,
} from '@angular/core';
import { ShopService } from '../../services/shop.service';
import { ImageService } from '../../services/image.service';
import { environment } from 'src/environments/environment';
import { VilleService } from '../../services/ville.service';
import { ToastrService } from 'ngx-toastr';
import { UserService } from '../../services/user.service';
import { SessionService } from '../../services/session.service';
import { TranslateService } from '@ngx-translate/core';

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
    error: any = {};
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
    employees: any[] = [];


    selectedCountry = 'France';
    selectedCity: any = {};
    selectedArrondissement = '';
    availableCountries = ['France'];
    availableCities: any[] = [];
    postalCode: string = '';


    allowedMorningHours: string[] = [];
    allowedAfternoonHours: string[] = [];
    deliveryPostalCode: string = '';
    days: string[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];


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
        private imageService: ImageService,
        private villeService: VilleService,
        private toastr: ToastrService,
        private userService: UserService,
        private sessionService: SessionService,
        private translate: TranslateService
    ) { }

    ngOnInit(): void {
        if (!this.me) {
            this.me = this.sessionService.getCurrentUser();
        }
        if(this.me.role === 'boss') {
            this.fetchEmployees();
        }
        this.allowedMorningHours = this.generateTimeSlots('05:00', '12:00');
        this.allowedAfternoonHours = this.generateTimeSlots('12:00', '23:00');
        localStorage.setItem("menu-param", 'management');
        if (this.myShopData && Object.keys(this.myShopData).length > 0) {
            console.log(this.myShopData.image);
            console.log(this.myShopData);
            this.shopCopyData = { ...this.myShopData };
            this.imageUsed =
                environment.APIimgStorageUrl +
                'uploads/images/' +
                this.shopCopyData.image;
            console.log('shopCopyData initialisé :', this.shopCopyData.image);
            this.initHoursStructure();
        }
    }

    

  fetchEmployees() {
    this.userService.getMyEmployees().subscribe({
      next: (users: any[]) => {
        this.employees = users;
      },
      error: (error: any) => {
        console.log(error)
      }
    });
  } 
    initHoursStructure() {
        const defaultSchedule = {
            morning: { start: '09:00', end: '12:00' },
            afternoon: { start: '13:00', end: '18:00' },
            closed: false
        };

        const legacy = this.shopCopyData.hours;

        // Si l'objet n'est pas encore au bon format, on transforme :
        if (!legacy.monday) {
            const fullWeek: any = {};
            const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

            days.forEach(day => {
                fullWeek[day] = {
                    morning: legacy.morning || defaultSchedule.morning,
                    afternoon: legacy.afternoon || defaultSchedule.afternoon,
                    closed: false
                };
            });

            this.shopCopyData.hours = fullWeek;
        }
    }


    generateTimeSlots(start: string, end: string): string[] {
        const times: string[] = [];
        let [h, m] = start.split(':').map(Number);
        const [endH, endM] = end.split(':').map(Number);

        while (h < endH || (h === endH && m <= endM)) {
            const hourStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            times.push(hourStr);
            m += 30; // <== ici on ajoute 30 minutes à chaque fois
            if (m >= 60) {
                m = 0;
                h++;
            }
        }
        return times;
    }
    ngOnChanges(changes: SimpleChanges): void {
        if (changes['myShopData'] && changes['myShopData'].currentValue) {
            this.shopCopyData = { ...this.myShopData };
            console.log('shopCopyData :', JSON.stringify(this.shopCopyData));
            this.imageUsed =
                environment.APIimgStorageUrl +
                'uploads/images/' +
                this.shopCopyData.image;

            console.log('imageUsed :', this.imageUsed);
            // this.onCityChange();
        }
    }

    validateForm(): void {
        const descriptionValid =
            this.shopCopyData.description &&
            this.shopCopyData.description.length >= 25;

        const cityValid =
            this.shopCopyData.ville && this.shopCopyData.district;

        const maxDistanceValid =
            this.shopCopyData.maxDistance && this.shopCopyData.maxDistance > 0;

        const allDaysValid = Object.entries(this.shopCopyData.hours).every(([day, data]: [string, any]) => {
            if (data.closed) return true; // jour fermé = OK
            return (
                data.morning?.start &&
                data.morning?.end &&
                data.afternoon?.start &&
                data.afternoon?.end
            );
        });

        this.formValid =
            descriptionValid &&
            cityValid &&
            maxDistanceValid &&
            allDaysValid;
    }

    generateIzyGlamDescription() {
        const type = this.shopCopyData.type; // à adapter selon ta structure exacte
        const userDescription = this.shopCopyData.description || null;

        this.shopService.generateIzyGlamDescription(type, userDescription)
            .subscribe({
                next: (description: string) => {
                    this.shopCopyData.description = description;
                    this.markFormModified();
                },
                error: (err) => {
                    console.error('Erreur lors de la génération de la description :', err);
                }
            });
    }


    removePostalCode(index: number) {
        this.shopCopyData.deliveryPostalCodes.splice(index, 1);
        this.shopCopyData.deliveryPostalCodes = this.shopCopyData.deliveryPostalCodes;
        this.saveShop()
    }

    onPostalCodeEntered() {
        if (!this.postalCode || this.postalCode.length < 4) return;

        this.villeService.getByPostalCode(this.postalCode, this.selectedCountry).subscribe((cities: any[]) => {
            console.log(cities)
            this.availableCities = cities;
            this.shopCopyData.code_postal = this.postalCode;

            if (cities.length === 1) {
                this.selectedCity = cities[0];
            }
        });
    }

    addPostalCode() {
        if (!this.deliveryPostalCode) return;
        // Vérifie si le code est déjà ajouté
        if (this.shopCopyData.deliveryPostalCodes.includes(this.deliveryPostalCode)) {
            this.error.deliveryPostalCode = "Ce code postal est déjà ajouté.";
            return;
        }
        this.villeService.getByPostalCode(this.deliveryPostalCode).subscribe({
            next: (res) => {
                if (res.length > 0) {
                    this.shopCopyData.deliveryPostalCodes.push(this.deliveryPostalCode);
                    this.deliveryPostalCode = ''; // Réinitialise le champ
                    this.error.deliveryPostalCode = null;
                    this.saveShop();
                } else {
                    this.error.deliveryPostalCode = "Code postal introuvable dans la base";
                }
            },
            error: () => {
                alert("Erreur lors de la recherche du code postal.");
            }
        });
    }
    markFormModified(): void {
        this.formModified = true;
        this.validateForm();
        this.saveShop();
    }

    updateSubmitButtonState(): void {
        const submitButton = document.querySelector(
            'button[type="submit"]'
        ) as HTMLButtonElement;
        if (submitButton) {
            submitButton.disabled = !(this.formValid && this.formModified);
        }
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

    showCustomToast(message: string) {
        this.toastr.success(message);
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
                            this.showCustomToast(this.translate.instant('CARD.SALON'));
                        },
                        error: (error: any) => {
                            console.log(error);
                            this.showCustomToast(this.translate.instant('CARD.ERROR1'));
                        },
                    });
                },
                (error) => {
                    console.error(
                        "Erreur lors de l'upload de l'image : ",
                        error
                    );
                    this.showCustomToast(this.translate.instant('CARD.ERROR2'));

                }
            );
        } else {
            this.shopService.update(this.myShopData).subscribe({
                next: (data: any) => {
                    console.log(data);
                    this.shopCopyData = { ...data };
                    this.myShopData = { ...data };
                    this.shopUpdated.emit(this.myShopData._id);
                    this.showCustomToast(this.translate.instant('CARD.UPDATE'));
                },
                error: (error: any) => {
                    console.log(error);
                    this.showCustomToast(this.translate.instant('CARD.ERROR1'));
                },
            });
        }
    }
}
