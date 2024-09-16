import { Component } from '@angular/core';

@Component({
  selector: 'app-create-shop-info',
  templateUrl: './create-shop-info.component.html',
  styleUrls: ['./create-shop-info.component.scss']
})
export class CreateShopInfoComponent {

  currentIndex = 0;

  steps = [
    {
      title: 'Développez votre activité',
      text: 'Des milliers d\'utilisateurs de l\'application izyGlam sont susceptibles de rechercher un restaurant dans votre secteur...',
      image: 'assets/step1-image.png'
    },
    {
      title: 'Augmentez votre visibilité',
      text: 'Utilisez les outils marketing d\'izyGlam pour toucher plus de clients dans votre secteur...',
      image: 'assets/step2-image.png'
    },
    {
      title: 'Optimisez vos opérations',
      text: 'Gérez efficacement les commandes avec l\'interface intuitive fournie par izyGlam...',
      image: 'assets/step3-image.png'
    },
    {
      title: 'Nouveau Step 1',
      text: 'Voici le contenu de votre premier step supplémentaire...',
      image: 'assets/step4-image.png'
    },
    {
      title: 'Nouveau Step 2',
      text: 'Voici le contenu de votre deuxième step supplémentaire...',
      image: 'assets/step5-image.png'
    }
  ];

  get currentStep() {
    return this.steps[this.currentIndex];
  }

  prevStep() {
    this.currentIndex = (this.currentIndex - 1 + this.steps.length) % this.steps.length;
  }

  nextStep() {
    this.currentIndex = (this.currentIndex + 1) % this.steps.length;
  }
}
