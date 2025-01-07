import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-feature',
  templateUrl: './feature.component.html',
  styleUrls: ['./feature.component.scss'],
})
export class FeatureComponent implements AfterViewInit {
  @ViewChild('videoElementFeature') videoElement!: ElementRef<HTMLVideoElement>;
  imgStorageUrl: string = environment.imgStorageUrl;
  aPIimgStorageUrl = environment.APIimgStorageUrl.replace(/\/$/, '');
  paramVideo = false;
  playbackRate: number = 1; // Vitesse de lecture
  intervalId!: any; // ID de setInterval pour le retour en arrière

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
