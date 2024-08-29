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
    selector: 'app-proches-modal',
    templateUrl: './proches-modal.component.html',
    styleUrls: ['./proches-modal.component.scss'],
})
export class ProchesModalComponent implements AfterViewChecked, OnInit {
    @ViewChild('searchInput') searchInputElement: ElementRef | undefined;
    step = 1;
    elem: any = {};
    validate = false;
    savedProche: any = {};

    constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

    ngOnInit() {
        console.log(this.data.user); // Utilisez les données passées ici
    }
    ngAfterViewChecked() {
        setTimeout(() => this.searchInputElement?.nativeElement.focus(), 0);
    }

    showValidate() {
        this.validate = true;
    }

    editProche(proche: any) {
        this.step += 1;
        this.savedProche = { ...proche }; // Créer une copie de l'objet
        this.elem = { ...proche };
        // this.savedProche = proche;
        console.log(proche);
    }
    newProche() {
        this.step += 1;
    }

    stepMinus() {
        if (this.savedProche) {
            this.elem = { ...this.savedProche }; // Restaurer l'objet initial
            this.savedProche = { ...this.savedProche };
            this.savedProche = null; // Réinitialiser après annulation
            console.log(
                "Modification annulée, retour à l'état initial :",
                this.elem
            );
        }
        this.step -= 1;
        this.validate = false;
        this.elem = {};
        console.log(this.savedProche);
    }
}
