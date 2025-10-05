import { Component } from '@angular/core';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss']
})
export class LoaderComponent {
  icons = [
    { src: 'assets/images/icons/facebook.svg', alt: 'Facebook' },
    { src: 'assets/images/icons/instagram.svg', alt: 'Instagram' },
    { src: 'assets/images/icons/bluesky.svg', alt: 'Bluesky' },
    { src: 'assets/images/icons/linkedin.svg', alt: 'LinkedIn' },
    { src: 'assets/images/icons/tiktok.svg', alt: 'TikTok' },
  ];
  
  constructor() {}
}
