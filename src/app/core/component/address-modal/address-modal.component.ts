import {
    Component,
    ViewChild,
    ElementRef,
    AfterViewChecked,
} from '@angular/core';

@Component({
    selector: 'app-address-modal',
    templateUrl: './address-modal.component.html',
    styleUrls: ['./address-modal.component.scss'],
})
export class AddressModalComponent implements AfterViewChecked {
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

    ngAfterViewChecked() {
        setTimeout(() => this.searchInputElement?.nativeElement.focus(), 0);
    }
}
