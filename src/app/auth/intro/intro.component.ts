import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-intro',
    templateUrl: './intro.component.html',
    styleUrls: ['./intro.component.scss'],
})
export class IntroComponent implements OnInit {
    imgStorageUrl: string = environment.imgStorageUrl;
    active = 'search';
    searchQuery: string = '';
    propositions: string[] = [
        'Proposition 1',
        'Proposition 2',
        'Proposition 3',
        'Proposition 4',
    ];
    currentProposition: string = this.propositions[0];
    propositionIndex: number = 0;
    constructor() {}

    ngOnInit(): void {
        this.startRotatingPropositions();
    }
    activateSearch(type: string) {
        this.active = type;
    }
    cancelSearch() {
        this.searchQuery = '';
    }
    startRotatingPropositions(): void {
        setInterval(() => {
            this.propositionIndex =
                (this.propositionIndex + 1) % this.propositions.length;
            this.currentProposition = this.propositions[this.propositionIndex];
        }, 1000); // Changer de proposition toutes les secondes
    }

    onButtonClick(): void {
        console.log("Vous avez cliqué sur 'J'ai de la chance'!");
    }
}
