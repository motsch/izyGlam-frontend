import { Component } from '@angular/core';

@Component({
  selector: 'app-create-company-info',
  templateUrl: './create-company-info.component.html',
  styleUrls: ['./create-company-info.component.scss']
})
export class CreateCompanyInfoComponent {

  currentIndex = 0;

  steps = [
    {
      titleTranslate: "INFO_COMPANY_STEPS.STEP1.TITLE",
      textTranslate: "INFO_COMPANY_STEPS.STEP1.TEXT",
      image: "assets/images/step-image2-1.png"
    },
    {
      titleTranslate: "INFO_COMPANY_STEPS.STEP2.TITLE",
      textTranslate: "INFO_COMPANY_STEPS.STEP2.TEXT",
      image: 'assets/images/step-image2-2.png'
    },
    {
      titleTranslate: "INFO_COMPANY_STEPS.STEP3.TITLE",
      textTranslate: "INFO_COMPANY_STEPS.STEP3.TEXT",
      image: 'assets/images/step-image2-3.png'
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
