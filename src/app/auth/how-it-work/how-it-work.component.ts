import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-how-it-work',
  templateUrl: './how-it-work.component.html',
  styleUrls: ['./how-it-work.component.scss'],
})
export class HowItWorkComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoElementHow') videoElement?: ElementRef<HTMLVideoElement>;

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
    // On ne manipule la vidéo que si elle est affichée
    if (!this.paramVideo || !this.videoElement?.nativeElement) return;

    const video = this.videoElement.nativeElement;

    // Sécurités lecture auto
    video.muted = true;
    video.playbackRate = this.playbackRate;

    // Tentative de lecture auto (certains navigateurs exigent muted+playsinline)
    Promise.resolve()
      .then(() => video.play())
      .catch((err) => {
        // Silencieux, mais log utile en dev
        console.warn('Lecture auto impossible :', err);
      });
  }

  /** Hook si un jour tu veux contrôler la direction/lecture */
  handlePlaybackDirection(video: HTMLVideoElement): void {
    video.playbackRate = this.playbackRate;
    video.play().catch(() => {});
  }

  ngOnDestroy(): void {
    // Rien à nettoyer pour l’instant, mais on stoppe proprement la vidéo si nécessaire
    const video = this.videoElement?.nativeElement;
    if (video && !video.paused) {
      try {
        video.pause();
      } catch {}
    }
  }
}
