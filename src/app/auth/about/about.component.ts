import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
})
export class AboutComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoElementAbout') videoElement?: ElementRef<HTMLVideoElement>;

  /** Base URL des médias (sans slash final) */
  aPIimgStorageUrl = (environment.APIimgStorageUrl || '').replace(/\/$/, '');

  /** Vitesse de lecture de la vidéo */
  playbackRate = 1;

  /** Active/désactive le mode vidéo (fallback image si false) */
  paramVideo = true;

  constructor(private router: Router) {}

  goTo(name: string) {
    this.router.navigate(['/' + name]);
  }

  ngAfterViewInit(): void {
    // Manipuler la vidéo uniquement si elle est rendue
    if (!this.paramVideo || !this.videoElement?.nativeElement) return;

    const video = this.videoElement.nativeElement;
    video.muted = true;         // requis pour l'autoplay mobile
    video.playbackRate = this.playbackRate;

    Promise.resolve()
      .then(() => video.play())
      .catch((err) => {
        // Pas bloquant, mais utile en dev
        console.warn('Lecture auto impossible :', err);
      });
  }

  ngOnDestroy(): void {
    const video = this.videoElement?.nativeElement;
    if (video && !video.paused) {
      try {
        video.pause();
      } catch {}
    }
  }
}
