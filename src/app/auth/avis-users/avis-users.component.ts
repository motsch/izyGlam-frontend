import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-avis-users',
  templateUrl: './avis-users.component.html',
  styleUrls: ['./avis-users.component.scss']
})
export class AvisUsersComponent implements OnInit {
  avisList = [
    {
      "text": "AVIS.AVIS1",
      "image": "assets/images/profile/profile1.png",
      "name": "Mai-Liên N."
    },
    {
      "text": "AVIS.AVIS2",
      "image": "assets/images/profile/profile2.png",
      "name": "Emilie B."
    },
    {
      "text": "AVIS.AVIS3",
      "image": "assets/images/profile/profile3.png",
      "name": "Vanessa K."
    },
    {
      "text": "AVIS.AVIS4",
      "image": "assets/images/profile/profile4.png",
      "name": "Cécile S."
    },
    {
      "text": "AVIS.AVIS5",
      "image": "assets/images/profile/profile5.png",
      "name": "Moussou K."
    },
    {
      "text": "AVIS.AVIS6",
      "image": "assets/images/profile/profile6.png",
      "name": "Martine O."
    }
  ];

  activeIndex = 0;

  ngOnInit(): void {
    setInterval(() => {
      const previousIndex = this.activeIndex;

      // Passe à l'avis suivant
      this.activeIndex = (this.activeIndex + 1) % this.avisList.length;

      // Retire l'animation de sortie après un délai
      setTimeout(() => {
        const cards = document.querySelectorAll('.avis-card');
        if (cards[previousIndex]) {
          cards[previousIndex].classList.remove('exiting');
        }
      }, 800); // Temps égal à la durée de la transition CSS
    }, 7000); // Changement toutes les 5.5 secondes
  }
}
