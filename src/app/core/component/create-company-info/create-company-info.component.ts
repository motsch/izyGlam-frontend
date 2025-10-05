import { Component, OnDestroy } from '@angular/core';
// ✅ IzyGlam: traductions & toasts
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-create-company-info',
  templateUrl: './create-company-info.component.html',
  styleUrls: ['./create-company-info.component.scss']
})
export class CreateCompanyInfoComponent implements OnDestroy {

  // 🔢 Index de l'étape courante
  currentIndex = 0;

  // ⏱️ Référence du setInterval pour l’auto défilement
  autoScrollInterval: any;

  // 🪄 Données des étapes (utilise des clés de traduction)
  

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

  constructor(
    // ✅ IzyGlam injections
    private translate: TranslateService,
    private toastr: ToastrService
  ) {
    // ⚠️ On garde le démarrage auto ici comme dans ta version,
    // mais on sécurise avec try/catch.
    try {
      this.startAutoScroll();
    } catch (err) {
      console.error('Erreur lors du démarrage de l’auto-scroll :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // 🧭 Renvoie l’étape courante (avec garde)
  get currentStep() {
    // Sécurité: si l’index est hors bornes, on revient au début
    if (!this.steps || this.steps.length === 0) return null;
    const safeIndex = ((this.currentIndex % this.steps.length) + this.steps.length) % this.steps.length;
    return this.steps[safeIndex];
  }

  // ⬅️ Étape précédente (boucle en arrière)
  prevStep() {
    try {
      if (!this.steps?.length) return;
      this.currentIndex = (this.currentIndex - 1 + this.steps.length) % this.steps.length;
    } catch (err) {
      console.error('Erreur prevStep :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // ➡️ Étape suivante (boucle en avant)
  nextStep() {
    try {
      if (!this.steps?.length) return;
      this.currentIndex = (this.currentIndex + 1) % this.steps.length;
    } catch (err) {
      console.error('Erreur nextStep :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // ▶️ Lance le défilement automatique
  startAutoScroll() {
    try {
      // On évite de créer plusieurs intervals
      this.stopAutoScroll();

      this.autoScrollInterval = setInterval(() => {
        this.nextStep();
      }, 5000); // ⏱️ Passage automatique toutes les 5 secondes
    } catch (err) {
      console.error('Erreur startAutoScroll :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // 🔄 Relance l’auto-scroll proprement
  restartAutoScroll() {
    try {
      this.stopAutoScroll();
      this.startAutoScroll();
    } catch (err) {
      console.error('Erreur restartAutoScroll :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // ⏸️ Stoppe le défilement automatique
  stopAutoScroll() {
    try {
      if (this.autoScrollInterval) {
        clearInterval(this.autoScrollInterval);
        this.autoScrollInterval = null;
      }
    } catch (err) {
      console.error('Erreur stopAutoScroll :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // 🧹 Nettoyage pour éviter les fuites de mémoire
  ngOnDestroy() {
    try {
      this.stopAutoScroll();
    } catch (err) {
      console.error('Erreur ngOnDestroy CreateCompanyInfoComponent :', err);
      // Pas de toast nécessaire ici, le composant est en destruction, mais on reste cohérents :
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // ------------------------------------------------------------
  // ✨ Toasts IzyGlam
  // ------------------------------------------------------------
  private showCustomToast(message: string) {
    this.toastr.error(message); // erreurs → .error()
  }

  private showSuccessToast(message: string) {
    this.toastr.success(message); // succès → .success()
  }
}
