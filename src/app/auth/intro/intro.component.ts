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
        'Une esthéticienne',
        'Une masseuse',
        'Une manucure',
        'Une pédicure',
        'Une maquilleuse',
        'Une coiffeuse',
    ];
    currentProposition: string = this.propositions[0];
    previousProposition: string = this.propositions[0];
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
            const newProposition = this.propositions[this.propositionIndex];
            const oldProposition = this.currentProposition;

            // Mettre à jour l'ancienne proposition
            this.previousProposition = oldProposition;

            // Mettre à jour la nouvelle proposition après un léger délai
            setTimeout(() => {
                this.currentProposition = newProposition;

                // Temporary removal of class to restart the animation
                const newText = document.querySelector('.new-proposition');
                const oldText = document.querySelector('.old-proposition');
                if (newText && oldText) {
                    const newElement = newText as HTMLElement;
                    const oldElement = oldText as HTMLElement;

                    newElement.classList.remove('new-proposition');
                    oldElement.classList.remove('old-proposition');
                    void newElement.offsetWidth; // trigger reflow
                    void oldElement.offsetWidth; // trigger reflow
                    newElement.classList.add('new-proposition');
                    oldElement.classList.add('old-proposition');
                }
            }, 1000); // Attendre 1 seconde avant de changer l'ancienne proposition
        }, 2000); // Changer de proposition toutes les 2 secondes
    }

    onButtonClick(): void {
        console.log("Vous avez cliqué sur 'J'ai de la chance'!");
    }
}
