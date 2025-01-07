import { BreakpointObserver } from '@angular/cdk/layout';
import {
    AfterViewInit,
    ChangeDetectorRef,
    Component,
    ElementRef,
    OnInit,
    ViewChild,
  } from '@angular/core';
  import { Router } from '@angular/router';
  import { environment } from 'src/environments/environment';
  
  @Component({
    selector: 'app-about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.scss'],
  })
  export class AboutComponent implements AfterViewInit {
    isSmallScreen: boolean = false;
    @ViewChild('videoElementAbout') videoElement!: ElementRef<HTMLVideoElement>;
    aPIimgStorageUrl = environment.APIimgStorageUrl.replace(/\/$/, '');
    playbackRate: number = 0.4; // Vitesse de lecture
    intervalId!: any; // ID de setInterval pour le retour en arrière
    paramVideo = false;
    constructor(private router: Router,private breakpointObserver: BreakpointObserver,
        private cdr: ChangeDetectorRef) { }
  
    goTo(name: string) {
      console.log(name);
      this.router.navigate(['/' + name]);
    }
  
    ngAfterViewInit(): void {
        this.breakpointObserver
          .observe(['(max-width: 766px)'])
          .subscribe(result => {
            this.isSmallScreen = result.matches;
            console.log('Small screen:', this.isSmallScreen);
            this.cdr.detectChanges();
          });
      if (this.paramVideo) {
        const video = this.videoElement.nativeElement;
    
        // Configurer la vitesse de lecture
        video.playbackRate = this.playbackRate;
        // Assurez-vous que la vidéo est en mode muet
        video.muted = true;
    
        // Tenter de lire la vidéo automatiquement
        video.play()
          .then(() => {
            console.log('Vidéo lancée automatiquement.');
          })
          .catch((err) => {
            console.error('Erreur lors de la lecture automatique :', err);
          });
      }
    }
  
    handlePlaybackDirection(video: HTMLVideoElement): void {
      // Reprendre la lecture normale en avant
      video.playbackRate = this.playbackRate;
      video.play();
    }
  
    ngOnDestroy(): void {
      if (this.intervalId) {
        clearInterval(this.intervalId); // Nettoyer l'intervalle si le composant est détruit
      }
    }
  }
  