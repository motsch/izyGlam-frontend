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
  selector: 'app-feature',
  templateUrl: './feature.component.html',
  styleUrls: ['./feature.component.scss'],
})
export class FeatureComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoElementFeature') videoElement?: ElementRef<HTMLVideoElement>;

  /** Base URL médias (sans slash final) */
  aPIimgStorageUrl = (environment.APIimgStorageUrl || '').replace(/\/$/, '');

  /** Active/désactive la vidéo (fallback image sinon) */
  paramVideo = true;

  /** Vitesse de lecture vidéo */
  playbackRate = 1;

  constructor(private router: Router) {}

  goTo(name: string) {
    this.router.navigate(['/' + name]);
  }

  ngAfterViewInit(): void {
    if (!this.paramVideo || !this.videoElement?.nativeElement) return;

    const video = this.videoElement.nativeElement;
    video.muted = true; // requis pour autoplay mobile
    video.playbackRate = this.playbackRate;

    Promise.resolve()
      .then(() => video.play())
      .catch((err) => {
        // Non bloquant : certains navigateurs peuvent refuser
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
