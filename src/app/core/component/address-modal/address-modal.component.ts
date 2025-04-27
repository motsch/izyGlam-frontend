import {
    Component,
    ViewChild,
    ElementRef,
    AfterViewChecked,
    Inject,
    OnInit,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { VilleService } from '../../services/ville.service';
import { UserService } from '../../services/user.service';
import { SharedService } from '../../services/shared.service';

@Component({
    selector: 'app-address-modal',
    templateUrl: './address-modal.component.html',
    styleUrls: ['./address-modal.component.scss'],
})
export class AddressModalComponent implements AfterViewChecked, OnInit {
    @ViewChild('searchInput') searchInputElement: ElementRef | undefined;
    recentAddresses = [
        { street: '64 Av. de Fontainebleau', city: 'Le Kremlin-Bicêtre' },
        {
            street: 'Le Kremlin-Bicêtre, 64 avenue de Fontainebleau',
            city: 'Le Kremlin-Bicêtre, 94270, FR',
        },
        {
            street: 'Centre Commercial Okabe',
            city: '63 av de Fontainebleau, Le Kremlin-Bicêtre, 94270, FR',
        },
        { street: '42 Bd du Maréchal Foch', city: 'Fontainebleau' },
        { street: '22 Rue Alphonse Daudet, 5', city: 'Évry-Courcouronnes' },
    ];
    step = 1;
    elem: any = {};
    validate = false;
    savedAddress: any = {};
    create = false;
    isAddingAddress = false;
    newAddress: any = {};
    availableArrondissements: string[] = []; // liste filtrée d'arrondissements (name) pour une ville
    allCitiesData: any[] = [];        // on stocke ici toutes les villes brutes


    
    selectedCountry = 'France';
    selectedCity: any | undefined = undefined;
    availableCountries = ['France'];
    availableCities: any[] = [];
    postalCode: string = '';
    constructor(@Inject(MAT_DIALOG_DATA) public data: any,
        private dialogRef: MatDialogRef<AddressModalComponent>,
        private villeService: VilleService,
        private userService: UserService,
        private sharedService: SharedService,) { }

    ngOnInit() {
        this.selectedCity.name = '';
        console.log(this.data.user);  // Utilisez les données passées ici
    }
    ngAfterViewChecked() {
        setTimeout(() => this.searchInputElement?.nativeElement.focus(), 0);
    }

    showValidate() {
        this.validate = true;
    }

    editAddress(address: any) {
        this.step += 1;
        this.savedAddress = { ...address }; // Créer une copie de l'objet
        this.elem = { ...address };
        // this.savedProche = proche;
        console.log(address);
    }
    newAddresss() {
        this.step += 1;
    }

    stepMinus() {
        if (this.savedAddress) {
            this.elem = { ...this.savedAddress }; // Restaurer l'objet initial
            this.savedAddress = { ...this.savedAddress };
            this.savedAddress = null; // Réinitialiser après annulation
            console.log(
                "Modification annulée, retour à l'état initial :",
                this.elem
            );
        }
        this.step -= 1;
        this.validate = false;
        this.elem = {};
        console.log(this.savedAddress);
    }

    // 📌 Enregistre la nouvelle adresse
    saveAddress() {
        // Assigne city et country aux nouvelles valeurs sélectionnées
        this.newAddress.city = this.selectedCity.nom;
        this.newAddress.country = this.selectedCountry;

        console.log(this.newAddress)

        // Vérifie que tous les champs nécessaires sont remplis
        if (
            this.newAddress.street &&
            this.newAddress.code_postal &&
            this.newAddress.city &&
            this.newAddress.country
        ) {
            // Conserve une copie de la nouvelle adresse à ajouter
            const addressToAdd = { ...this.newAddress };

            // Optionnel : si tu tiens à mettre à jour un tableau local
            this.data.user.address.push(addressToAdd);

            // Appelle la méthode du service pour ajouter l'adresse
            this.userService.addAddress(this.data.user._id, addressToAdd).subscribe(
                (result: any) => {
                    this.loadUser(); // recharge les infos de l'utilisateur
                    console.log("Adresse ajoutée, utilisateur mis à jour :", result);
                },
                (error: any) => {
                    console.log(error);
                }
            );

            // Réinitialise le formulaire d'adresse
            this.newAddress = { street: '', code_postal: '', city: '', country: '' };
            this.isAddingAddress = false;
            this.dialogRef.close();
        }
    }

    // ----------------------------------------
    // 1) Quand l’utilisateur choisit un pays
    // ----------------------------------------
    

    onCountryChange() {
        this.postalCode = '';
        this.availableCities = [];
        this.selectedCity = {};
    }
    

    onPostalCodeEntered() {
        if (!this.postalCode || this.postalCode.length < 4) return;

        this.villeService.getByPostalCode(this.postalCode, this.selectedCountry).subscribe((cities: any[]) => {
            console.log(cities)
            this.availableCities = cities;
            this.newAddress.code_postal = this.postalCode;

            if (cities.length === 1) {
                this.selectedCity = cities[0];
            }
        });
    }

    // -----------------------------------------
    // 2) Quand l’utilisateur choisit une ville
    // -----------------------------------------
    onCityChange() {
        // Filtre les documents par pays + city
        const filteredByCity = this.allCitiesData.filter(
            v => v.pays === this.selectedCountry && v.city === this.selectedCity.nom
        );
        if (filteredByCity.length > 1) {
            // Plusieurs arrondissements => on récupère juste la liste des name
            this.availableArrondissements = [...new Set(filteredByCity.map(v => v.name))];
            // On ne définit pas encore le code postal, 
            // car l’utilisateur doit choisir l’arrondissement précis.
            this.newAddress.code_postal = '';
        } else if (filteredByCity.length === 1) {
            // Un seul document => on récupère directement le code postal
            const doc = filteredByCity[0];
            this.availableArrondissements = [doc.name]; // si tu veux un tableau à un seul élément
            this.newAddress.code_postal = doc.code_postal; // On met à jour le CP
        }
        // On met à jour la ville
        this.newAddress.city = this.selectedCity.nom;
    }


    loadUser() {
        this.data.user = this.userService.getMe();
        this.sharedService.updateMe(this.data.user);
    }
}
