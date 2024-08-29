import {
    Component,
    ViewChild,
    ElementRef,
    AfterViewChecked,
    Inject,
    OnInit,
} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

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

  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit() {
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
    newAddress() {
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
}
