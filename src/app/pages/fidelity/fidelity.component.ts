import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-fidelity',
  templateUrl: './fidelity.component.html',
  styleUrls: ['./fidelity.component.scss']
})
export class FidelityComponent implements OnInit {
  expiryDate: string = '31/12/2025';
  stars: number = 3;
  starsArray: any[] = [];
  fullStars: any[] = [];
  emptyStars: any[] = [];

  logoStar = '/assets/images/logo.png';
  giftIcon = '/assets/images/kdo.png';

  ngOnInit(): void {
    // Simulé (à remplacer par un vrai appel backend plus tard)
    this.starsArray = [
      { type: 'izyGlam', reward_name: 'Manucure', reward_date: '12/04/2025' },
      { type: 'izyGlam', reward_name: 'Massage', reward_date: '05/04/2025' },
      { type: 'izyGlam', reward_name: 'Coiffure', reward_date: '01/04/2025' }
    ];
    this.stars = this.starsArray.length;

    this.fullStars = Array(this.stars).fill(0);
    this.emptyStars = Array(10 - this.stars).fill(0);
  }
}
