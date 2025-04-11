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
    selectedCountry = '';
    selectedCity = '';
    selectedArrondissement = '';
    availableCountries = [];
    availableCities: string[] = [];
    availableArrondissements: string[] = []; // liste filtrée d'arrondissements (name) pour une ville
    allCitiesData: any[] = [];        // on stocke ici toutes les villes brutes

    constructor(@Inject(MAT_DIALOG_DATA) public data: any,
        private dialogRef: MatDialogRef<AddressModalComponent>,
        private villeService: VilleService,
        private userService: UserService,
        private sharedService: SharedService,) { }

    ngOnInit() {
        console.log(this.data.user);  // Utilisez les données passées ici
        this.getCities();
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
        this.newAddress.city = this.selectedCity;
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

    getCities() {
        this.villeService.getAllLimted().subscribe((result: any) => {
            console.log(result);
            this.allCitiesData = result.data;
            this.availableCountries = result.pays;  // Liste unique de pays

        }, (error: any) => {
            console.log(error);
        })
    }

    // ----------------------------------------
    // 1) Quand l’utilisateur choisit un pays
    // ----------------------------------------
    onCountryChange() {
        // Filtrer les villes qui appartiennent à ce pays
        const filteredByCountry = this.allCitiesData.filter(v => v.pays === this.selectedCountry);
        // Extraire la liste unique de city
        this.availableCities = [...new Set(filteredByCountry.map(v => v.city))];
        // On réinitialise la sélection de ville & arrondissements
        this.selectedCity = '';
        this.availableArrondissements = [];
        // Mettre à jour l'objet newAddress
        this.newAddress.country = this.selectedCountry;
    }

    // -----------------------------------------
    // 2) Quand l’utilisateur choisit une ville
    // -----------------------------------------
    onCityChange() {
        // Filtre les documents par pays + city
        const filteredByCity = this.allCitiesData.filter(
            v => v.pays === this.selectedCountry && v.city === this.selectedCity
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
            this.selectedArrondissement = doc.name;     // on sélectionne l'arrondissement par défaut
            this.newAddress.code_postal = doc.code_postal; // On met à jour le CP
        }
        // On met à jour la ville
        this.newAddress.city = this.selectedCity;
    }


    // ------------------------------------------------
    // 3) Quand l’utilisateur choisit un arrondissement
    // ------------------------------------------------
    onArrondissementChange() {
        // Refiltrer pour trouver l’unique document
        const doc = this.allCitiesData.find(
            v =>
                v.pays === this.selectedCountry &&
                v.city === this.selectedCity &&
                v.name === this.selectedArrondissement
        );
        if (doc) {
            this.newAddress.code_postal = doc.code_postal;
            // on peut aussi récupérer d’autres infos si besoin
        }
        // Mettre à jour l'objet newAddress
        this.newAddress.arrondissement = this.selectedArrondissement;
    }

    loadUser() {
        this.data.user = this.userService.getMe();
        this.sharedService.updateMe(this.data.user);
    }
}
