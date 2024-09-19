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
      title: "Simplifiez la gestion de votre activité",
      text: "Gérez votre activité en toute sérénité grâce à izyGlam, la solution complète pour les professionnels du bien-être. Profitez d'outils flexibles et d'un accompagnement personnalisé pour répondre à tous vos besoins.",
      image: "assets/images/step-image-1.png"
    },
    {
      title: 'Boostez vos ventes',
      text: 'Chaque jour, des milliers de personnes utilisent izyGlam pour trouver des experts en beauté près de chez eux. Profitez de cette opportunité pour toucher de nouveaux clients dans votre domaine.',
      image: 'assets/images/step-image-2.png'
    },
    {
      title: 'Satisfaction clientéle garantie',
      text: 'Avec izyGlam, proposez une expérience personnalisée à vos clients. Gérez facilement vos rendez-vous, communiquez rapidement et offrez des services adaptés. Vos clients bénéficient de soins où et quand ils le souhaitent, assurant leur satisfaction et fidélité.',
      image: 'assets/images/step-image-3.png'
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
