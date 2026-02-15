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

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.device = this.detectDevice();
    this.targetUrl = this.getTargetUrl(this.device);

    if (!this.targetUrl) {
      // Device non détecté (desktop / autre) => retour à l'accueil
      this.router.navigateByUrl('/');
      return;
    }

    // Redirection dans le même onglet (fiable, pas bloqué)
    window.location.assign(this.targetUrl);
  }

  private detectDevice(): DeviceType {
    const ua = navigator.userAgent || '';
    const isAndroid = /Android/i.test(ua);
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
}
