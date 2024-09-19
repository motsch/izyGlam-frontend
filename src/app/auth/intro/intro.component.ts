import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-intro',
  templateUrl: './intro.component.html',
  styleUrls: ['./intro.component.scss'],
})
export class IntroComponent implements OnInit {
    search:any = {};
  control = new FormControl();
  control2 = new FormControl();  // Ajout d'un autre FormControl pour le deuxième champ
  options: string[] = [
    'Esthéticienne',
    'Masseuse',
    'Manucure',
    'Pédicure',
    'Maquilleuse',
    'Coiffeuse',
  ];
  optionsCities: string[] = [
    'Paris 1',
    'Paris 2',
    'Paris 3',
    'Paris 4',
    'Paris 5',
    'Paris 6',
    'Paris 7',
    'Paris 8',
    'Paris 9',
    'Paris 10',
    'Paris 11',
    'Paris 12',
    'Paris 13',
    'Paris 14',
    'Paris 15',
    'Paris 16',
    'Paris 17',
    'Paris 18',
    'Paris 19',
    'Paris 20',
  ];
  filteredStreets: Observable<string[]> | undefined;
  filteredLocations: Observable<string[]> | undefined;  // Observable pour le deuxième champ
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
  streetError: boolean = false;  // Erreur pour le premier champ
  locationError: boolean = false;  // Erreur pour le deuxième champ

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.startRotatingPropositions();
    this.filteredStreets = this.control.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value, 'street'))
    );
    this.filteredLocations = this.control2.valueChanges.pipe(  // Initialiser l'Observable pour le deuxième champ
      startWith(''),
      map(value => this._filterCities(value, 'location'))
    );
  }

  private _filter(value: string, type: string): string[] {
    const filterValue = value.toLowerCase();
    const filteredOptions = filterValue.length > 0 ? this.options.filter(option => option.toLowerCase().includes(filterValue)) : [];
    if (type === 'street') {
      this.streetError = filteredOptions.length === 0;
    } else if (type === 'location') {
      this.locationError = filteredOptions.length === 0;
    }
    return filteredOptions;
  }

  private _filterCities(value: string, type: string): string[] {
    const filterValue = value.toLowerCase();
    const filteredOptions = filterValue.length > 0 ? this.optionsCities.filter(option => option.toLowerCase().includes(filterValue)) : [];
    if (type === 'street') {
      this.streetError = filteredOptions.length === 0;
    } else if (type === 'location') {
      this.locationError = filteredOptions.length === 0;
    }
    return filteredOptions;
  }

  trackByFn(index: number, item: string): string {
    return item;
  }

  activateSearch(type: string) {
    this.active = type;
  }

  cancelSearch() {
    this.searchQuery = '';
  }

  startRotatingPropositions(): void {
    setInterval(() => {
      this.propositionIndex = (this.propositionIndex + 1) % this.propositions.length;
      const newProposition = this.propositions[this.propositionIndex];
      const oldProposition = this.currentProposition;

      this.previousProposition = oldProposition;

      setTimeout(() => {
        this.currentProposition = newProposition;

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
      }, 1000);
    }, 2000);
  }

  onButtonClick(): void {
    console.log("Vous avez cliqué sur 'Rechercher'!");
    this.router.navigate(['/main']);
  }
}
