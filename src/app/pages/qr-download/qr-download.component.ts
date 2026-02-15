import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

type DeviceType = 'android' | 'ios' | 'other';

@Component({
  selector: 'app-qr-download',
  templateUrl: './qr-download.component.html',
  styleUrls: ['./qr-download.component.scss'],
})
export class QrDownloadComponent implements OnInit {
  device: DeviceType = 'other';
  targetUrl: string | null = null;
  autoOpenBlocked = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.device = this.detectDevice();
    this.targetUrl = this.getTargetUrl(this.device);

    // Si on a une URL cible, on tente l'ouverture dans un nouvel onglet
    if (this.targetUrl) {
      const opened = this.openInNewTab(this.targetUrl);

      // Si bloqué (souvent sur iOS), on affiche un bouton de fallback
      if (!opened) {
        this.autoOpenBlocked = true;
        return;
      }

      // On redirige ensuite l'onglet courant vers "/"
      this.redirectHome();
    } else {
      // Device non supporté / desktop => on retourne sur "/"
      this.redirectHome();
    }
  }

  private detectDevice(): DeviceType {
    const ua = navigator.userAgent || '';
    const isAndroid = /Android/i.test(ua);
    // iPhone/iPad/iPod (y compris iPadOS qui peut parfois se présenter différemment)
    const isIOS = /iPhone|iPad|iPod/i.test(ua);

    if (isAndroid) return 'android';
    if (isIOS) return 'ios';
    return 'other';
  }

  private getTargetUrl(device: DeviceType): string | null {
    if (device === 'android') return environment.App_Android ?? null;
    if (device === 'ios') return environment.App_iOS ?? null;
    return null;
  }

  private openInNewTab(url: string): boolean {
    // window.open renvoie null si bloqué par le navigateur
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    return !!win;
  }

  redirectHome(): void {
    // Petite micro-latence pour éviter les comportements bizarres sur certains navigateurs
    setTimeout(() => {
      this.router.navigateByUrl('/');
    }, 150);
  }

  // Fallback si l'ouverture auto est bloquée
  openManually(): void {
    if (!this.targetUrl) return;
    this.openInNewTab(this.targetUrl);
    this.redirectHome();
  }
}
