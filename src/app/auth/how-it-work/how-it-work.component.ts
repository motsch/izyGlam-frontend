import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-how-it-work',
  templateUrl: './how-it-work.component.html',
  styleUrls: ['./how-it-work.component.scss'],
})
export class HowItWorkComponent implements AfterViewInit {
  @ViewChild('videoElementHow') videoElement!: ElementRef<HTMLVideoElement>;
  aPIimgStorageUrl = environment.APIimgStorageUrl.replace(/\/$/, '');
  playbackRate: number = 0.9; // Vitesse de lecture
  intervalId!: any; // ID de setInterval pour le retour en 
  paramVideo = false;

  constructor(private router: Router) { }

  goTo(name: string) {
    console.log(name);
    this.router.navigate(['/' + name]);

  }

  ngAfterViewInit(): void {
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
    video.playbackRate = this.playbackRate;
    video.play();
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId); // Nettoyer l'intervalle si le composant est détruit
    }
  }
}
