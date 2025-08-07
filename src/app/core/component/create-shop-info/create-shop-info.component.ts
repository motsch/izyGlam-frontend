import { Component } from '@angular/core';

@Component({
  selector: 'app-create-shop-info',
  templateUrl: './create-shop-info.component.html',
  styleUrls: ['./create-shop-info.component.scss']
})
export class CreateShopInfoComponent {

  currentIndex = 0;
  autoScrollInterval: any;

  steps = [
    {
      titleTranslate: "INFO_SHOP_STEPS.STEP1.TITLE",
      textTranslate: "INFO_SHOP_STEPS.STEP1.TEXT",
      image: "assets/images/step-image-1.png"
    },
    {
      titleTranslate: "INFO_SHOP_STEPS.STEP2.TITLE",
      textTranslate: "INFO_SHOP_STEPS.STEP2.TEXT",
      image: 'assets/images/step-image-2.png'
    },
    {
      titleTranslate: "INFO_SHOP_STEPS.STEP3.TITLE",
      textTranslate: "INFO_SHOP_STEPS.STEP3.TEXT",
      image: 'assets/images/step-image-3.png'
    }
  ];

  constructor() {
    this.startAutoScroll();
  }

  get currentStep() {
    return this.steps[this.currentIndex];
  }

  prevStep() {
    this.currentIndex = (this.currentIndex - 1 + this.steps.length) % this.steps.length;
    this.restartAutoScroll();
  }

  nextStep() {
    this.currentIndex = (this.currentIndex + 1) % this.steps.length;
    this.restartAutoScroll();
  }

  startAutoScroll() {
    this.autoScrollInterval = setInterval(() => {
      this.nextStep();
    }, 5000); // Passage automatique toutes les 3 secondes
  }

  restartAutoScroll() {
    this.stopAutoScroll();
    this.startAutoScroll();
  }

  stopAutoScroll() {
    if (this.autoScrollInterval) {
      clearInterval(this.autoScrollInterval);
      this.autoScrollInterval = null;
    }
  }

  ngOnDestroy() {
    this.stopAutoScroll(); // Nettoyer l'intervalle pour éviter les fuites
  }
}
