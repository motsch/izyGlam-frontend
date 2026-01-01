import { Component, ElementRef, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { trigger, style, animate, transition } from '@angular/animations';
import { BreakpointObserver } from '@angular/cdk/layout';

@Component({
  selector: 'app-intro',
  templateUrl: './intro.component.html',
  styleUrls: ['./intro.component.scss'],
  animations: [
    trigger('slideFadeInOut', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(30%)' }),
        animate('700ms ease-out', style({ opacity: 1, transform: 'translateY(0%)' }))
      ]),
      transition(':leave', [
        animate('700ms ease-in', style({ opacity: 0, transform: 'translateY(-30%)' }))
      ])
    ])
  ]
})
export class IntroComponent implements OnInit, AfterViewInit {
  @ViewChild('videoElementIntro') videoElement?: ElementRef<HTMLVideoElement>;

  paramVideo = true;
  search: any = {};
  control = new FormControl();
  control2 = new FormControl();
  isSmallScreen = false; // peut rester, même si non requis pour l’ordre

  options: string[] = ['Esthéticienne', 'Masseuse', 'Manucure', 'Pédicure', 'Maquilleuse', 'Coiffeuse'];
  optionsCities: string[] = [
    'Paris 1','Paris 2','Paris 3','Paris 4','Paris 5','Paris 6','Paris 7','Paris 8',
    'Paris 9','Paris 10','Paris 11','Paris 12','Paris 13','Paris 14','Paris 15',
    'Paris 16','Paris 17','Paris 18','Paris 19','Paris 20'
  ];

  filteredStreets!: Observable<string[]>;
  filteredLocations!: Observable<string[]>;

  aPIimgStorageUrl = environment.APIimgStorageUrl.replace(/\/$/, '');
  imgStorageUrl: string = environment.imgStorageUrl;

  propositions: string[] = [
    'MAIN_CATEGORY_INTRO.COIFFURE', 'MAIN_CATEGORY_INTRO.MANUCURE', 'MAIN_CATEGORY_INTRO.ESTETICIAN',
    'MAIN_CATEGORY_INTRO.MASSAGE', 'MAIN_CATEGORY_INTRO.MAQUILLAGE', 'MAIN_CATEGORY_INTRO.PEDICURE',
    'MAIN_CATEGORY_INTRO.NUTRITION', 'MAIN_CATEGORY_INTRO.FITNESS'
  ];
  currentProposition = this.propositions[0];
  previousProposition = this.propositions[0];
  propositionIndex = 0;
  currentKey = 0;
  playbackRate = 1; // Vitesse de lecture
  textVisible = true;

  streetError = false;
  locationError = false;

  specialityTranslation = 'INTRO.SPECIALITY';
  whereTranslation = 'INTRO.WHERE';

  constructor(
    private translate: TranslateService,
    private router: Router,
    private breakpointObserver: BreakpointObserver
  ) {}

  ngOnInit(): void {
    // Tu peux garder cet observer si tu en as besoin ailleurs
    this.breakpointObserver
      .observe(['(max-width: 991.98px)'])
      .subscribe(result => {
        this.isSmallScreen = result.matches;
      });

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

  ngAfterViewInit(): void {
    if (!this.paramVideo || !this.videoElement?.nativeElement) return;

    const video = this.videoElement.nativeElement;
    video.playbackRate = this.playbackRate;
    video.muted = true;

    video.play().catch((err) => {
      console.error('Erreur lors de la lecture automatique :', err);
    });
  }

  private _filter(value: string, options: string[]): string[] {
    const filterValue = (value || '').toLowerCase();
    const filtered = options.filter(option => option.toLowerCase().includes(filterValue));
    if (options === this.options) this.streetError = filtered.length === 0;
    else this.locationError = filtered.length === 0;
    return filtered;
  }

  startRotatingPropositions(): void {
    setInterval(() => {
      this.textVisible = false; // déclenche :leave
      setTimeout(() => {
        this.propositionIndex = (this.propositionIndex + 1) % this.propositions.length;
        this.currentProposition = this.propositions[this.propositionIndex];
        this.currentKey++; // force un nouvel élément pour :enter
        this.textVisible = true; // déclenche :enter
      }, 700);
    }, 3000);
  }

  onButtonClick(): void {
    this.router.navigate(['/main']);
  }

  trackByFn(index: number, item: string): string {
    return item;
  }
}
