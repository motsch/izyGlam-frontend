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

// ✅ AjoutsizyGlam : toasts + i18n
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-address-modal',
  templateUrl: './address-modal.component.html',
  styleUrls: ['./address-modal.component.scss'],
})
export class AddressModalComponent implements AfterViewChecked, OnInit {
  @ViewChild('searchInput') searchInputElement: ElementRef | undefined;

  // 🔎 Exemples d’adresses récentes (affichage UI)
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

  // ⚙️ État d’UI
  step = 1;
  elem: any = {};
  validate = false;
  savedAddress: any = {};
  create = false;
  isAddingAddress = false;

  // 📦 Nouvelle adresse en construction
  newAddress: any = {};

  // 📍 Données villes/arrondissements (chargées via services/props)
  availableArrondissements: string[] = []; // liste filtrée d'arrondissements (name) pour une ville
  allCitiesData: any[] = [];               // on stocke ici toutes les villes brutes

  // 🌍 Sélecteurs pays/ville/CP
  selectedCountry = 'France';
  selectedCity: any | undefined = undefined;
  availableCountries = ['France'];
  availableCities: any[] = [];
  postalCode: string = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<AddressModalComponent>,
    private villeService: VilleService,
    private userService: UserService,
    private sharedService: SharedService,

    // ✅izyGlam
    private toastr: ToastrService,
    private translate: TranslateService
  ) { }

  // ---------------------------------------------------
  // ⏱️ Au chargement du composant (données modale)
  // ---------------------------------------------------
  ngOnInit() {
    // Sécurise selectedCity avant usage
    this.selectedCity = this.selectedCity || {};
    (this.selectedCity as any).name = '';
    console.log('User passé à la modale :', this.data.user);
  }

  // ---------------------------------------------------
  // 🎯 Focus automatique sur l’input de recherche
  // ---------------------------------------------------
  ngAfterViewChecked() {
    setTimeout(() => this.searchInputElement?.nativeElement.focus(), 0);
  }

  // ---------------------------------------------------
  // ✅ Contrôles UI (validation / navigation d’étapes)
  // ---------------------------------------------------
  showValidate() {
    this.validate = true;
  }

  editAddress(address: any) {
    this.step += 1;
    this.savedAddress = { ...address }; // copie pour rollback si annulation
    this.elem = { ...address };
    console.log('Edition adresse :', address);
  }

  newAddresss() {
    this.step += 1;
  }

  stepMinus() {
    if (this.savedAddress) {
      // rollback à l’adresse sauvegardée
      this.elem = { ...this.savedAddress };
      this.savedAddress = { ...this.savedAddress };
      this.savedAddress = null; // reset
      console.log('Modification annulée, retour à l’état initial :', this.elem);
    }
    this.step -= 1;
    this.validate = false;
    this.elem = {};
    console.log('savedAddress après retour :', this.savedAddress);
  }

  // ---------------------------------------------------
  // 💾 Enregistre la nouvelle adresse (call API)
  // ---------------------------------------------------
  saveAddress() {
    // Assigne city et country aux valeurs sélectionnées
    this.newAddress.city = this.selectedCity?.nom;
    this.newAddress.country = this.selectedCountry;

    console.log('Nouvelle adresse (avant validation) :', this.newAddress);

    // Vérifie que tous les champs nécessaires sont remplis
    if (
      this.newAddress.street &&
      this.newAddress.code_postal &&
      this.newAddress.city &&
      this.newAddress.country
    ) {
      // Conserve une copie de l’adresse à ajouter
      const addressToAdd = { ...this.newAddress };

      // Optionnel : mise à jour immédiate du tableau local pour l’UI
      try {
        this.data?.user?.address?.push(addressToAdd);
      } catch (e) {
        // on évite de casser si data.user.address est absent
        console.warn('Impossible de pusher localement dans user.address (non bloquant).');
      }

      // Appel API pour ajouter l’adresse côté backend
      this.userService.addAddress(this.data.user._id, addressToAdd).subscribe({
        next: (result: any) => {
          this.loadUser(); // recharge les infos de l’utilisateur (cache/partagé)
          console.log('Adresse ajoutée, utilisateur mis à jour :', result);
        },
        error: (err: any) => {
          console.error('Erreur lors de l’ajout d’adresse :', err);
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        }
      });

      // Reset du formulaire d’adresse + fermeture modale
      this.newAddress = { street: '', code_postal: '', city: '', country: '' };
      this.isAddingAddress = false;
      this.dialogRef.close();
    }
  }

  // ---------------------------------------------------
  // 🌍 Sélecteurs pays / ville / code postal
  // ---------------------------------------------------
  onCountryChange() {
    this.postalCode = '';
    this.availableCities = [];
    this.selectedCity = {};
  }

  onPostalCodeEntered() {
    if (!this.postalCode || this.postalCode.length < 4) return;

    this.villeService.getByPostalCode(this.postalCode, this.selectedCountry).subscribe({
      next: (cities: any[]) => {
        console.log('Villes trouvées pour CP', this.postalCode, ':', cities);
        this.availableCities = cities;
        this.newAddress.code_postal = this.postalCode;

        if (cities.length === 1) {
          this.selectedCity = cities[0];
        }
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des villes par CP :', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      }
    });
  }

  // ---------------------------------------------------
  // 🏙️ Quand l’utilisateur choisit une ville
  // ---------------------------------------------------
  onCityChange() {
    // Filtre les documents par pays + city
    const filteredByCity = this.allCitiesData.filter(
      v => v.pays === this.selectedCountry && v.city === this.selectedCity?.nom
    );

    if (filteredByCity.length > 1) {
      // Plusieurs arrondissements => on récupère juste la liste des name
      this.availableArrondissements = [...new Set(filteredByCity.map(v => v.name))];
      // L’utilisateur doit choisir l’arrondissement précis avant de fixer le CP
      this.newAddress.code_postal = '';
    } else if (filteredByCity.length === 1) {
      // Un seul document => on récupère directement le code postal
      const doc = filteredByCity[0];
      this.availableArrondissements = [doc.name]; // tableau à un élément
      this.newAddress.code_postal = doc.code_postal; // on met à jour le CP
    }

    // Met à jour la ville dans la nouvelle adresse
    this.newAddress.city = this.selectedCity?.nom;
  }

  // ---------------------------------------------------
  // 🔄 Recharge l’utilisateur depuis le service
  // ---------------------------------------------------
  loadUser() {
    // ⚠️ Selon ton UserService, getMe() peut renvoyer un cache (synchrone) :
    this.data.user = this.userService.getMe();
    this.sharedService.updateMe(this.data.user);
  }

  // ---------------------------------------------------
  // ✨ Toast d’erreur styliséizyGlam (centralisé)
  // ---------------------------------------------------
  private showCustomToast(message: string) {
    // StandardizyGlam : erreurs → toastr.error
    // Exemple clé i18n : this.translate.instant('ERROR.GENERIC_ERROR')
    this.toastr.error(message);
  }
}
