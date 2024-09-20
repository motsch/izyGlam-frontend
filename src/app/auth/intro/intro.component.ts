import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { trigger, style, animate, transition, state } from '@angular/animations';

@Component({
  selector: 'app-intro',
  templateUrl: './intro.component.html',
  styleUrls: ['./intro.component.scss'],
  animations: [
    trigger('slideDown', [
      transition(':enter', [
        style({ transform: 'translateY(-100%)', opacity: 0 }),
        animate('1s ease-in-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('fadeOut', [
      transition(':leave', [
        style({ opacity: 1 }),
        animate('1s ease-in-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class IntroComponent implements OnInit {
  search: any = {};
  control = new FormControl();
  control2 = new FormControl();

  animationTrigger: boolean = true;
  options: string[] = [
    'Esthéticienne', 'Masseuse', 'Manucure', 'Pédicure', 'Maquilleuse', 'Coiffeuse',
  ];

  optionsCities: string[] = [
    'Paris 1', 'Paris 2', 'Paris 3', 'Paris 4', 'Paris 5', 'Paris 6', 'Paris 7', 'Paris 8',
    'Paris 9', 'Paris 10', 'Paris 11', 'Paris 12', 'Paris 13', 'Paris 14', 'Paris 15', 
    'Paris 16', 'Paris 17', 'Paris 18', 'Paris 19', 'Paris 20',
  ];

  filteredStreets!: Observable<string[]>;
  filteredLocations!: Observable<string[]>;

  imgStorageUrl: string = environment.imgStorageUrl;
  active = 'search';
  searchQuery: string = '';

  propositions: string[] = [
    'MAIN_CATEGORY_INTRO.COIFFURE', 'MAIN_CATEGORY_INTRO.MANUCURE', 'MAIN_CATEGORY_INTRO.ESTETICIAN',
    'MAIN_CATEGORY_INTRO.MASSAGE', 'MAIN_CATEGORY_INTRO.MAQUILLAGE', 'MAIN_CATEGORY_INTRO.PEDICURE',
    'MAIN_CATEGORY_INTRO.NUTRITION', 'MAIN_CATEGORY_INTRO.FITNESS',
  ];

  currentProposition: string;
  previousProposition: string;
  propositionIndex: number = 0;

  streetError: boolean = false;
  locationError: boolean = false;

  specialityTranslation: string = 'INTRO.SPECIALITY';
  whereTranslation: string = 'INTRO.WHERE';

  constructor(private translate: TranslateService, private router: Router) {
    this.currentProposition = this.propositions[0];
    this.previousProposition = this.propositions[0];
  }

  ngOnInit(): void {
    // Traduction des labels
    this.translate.get([this.specialityTranslation, this.whereTranslation]).subscribe(translations => {
      this.specialityTranslation = translations[this.specialityTranslation];
      this.whereTranslation = translations[this.whereTranslation];
    });

    this.startRotatingPropositions();

    this.filteredStreets = this.control.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value, this.options))
    );

    this.filteredLocations = this.control2.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value, this.optionsCities))
    );
  }

  private _filter(value: string, options: string[]): string[] {
    const filterValue = value.toLowerCase();
    const filteredOptions = options.filter(option => option.toLowerCase().includes(filterValue));
    if (options === this.options) {
      this.streetError = filteredOptions.length === 0;
    } else {
      this.locationError = filteredOptions.length === 0;
    }
    return filteredOptions;
  }

  startRotatingPropositions(): void {
    setInterval(() => {
      // Met à jour le texte à afficher
      this.previousProposition = this.currentProposition;
      this.propositionIndex = (this.propositionIndex + 1) % this.propositions.length;
      this.animationTrigger = false; // Force le changement pour l'animation fadeOut
    }, 3000);
  }

  onAnimationDone(): void {
    // Quand l'animation fadeOut est terminée, met à jour le texte et réactive slideDown
    this.currentProposition = this.propositions[this.propositionIndex];
    this.animationTrigger = true;  // Relance l'animation
  }

  onButtonClick(): void {
    console.log("Vous avez cliqué sur 'Rechercher'!");
    this.router.navigate(['/main']);
  }

  trackByFn(index: number, item: string): string {
    return item;
  }
}
