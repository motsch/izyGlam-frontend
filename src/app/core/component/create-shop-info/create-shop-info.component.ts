import { Component, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-create-shop-info',
  templateUrl: './create-shop-info.component.html',
  styleUrls: ['./create-shop-info.component.scss']
})
export class CreateShopInfoComponent implements OnDestroy {

  // Index courant du carrousel
  currentIndex = 0;

  // Référence de l'intervalle d’auto-défilement
  autoScrollInterval: any;

  // Étapes affichées (clés de traduction + visuels)
  steps = [
    {
      titleTranslate: 'INFO_SHOP_STEPS.STEP1.TITLE',
      textTranslate: 'INFO_SHOP_STEPS.STEP1.TEXT',
      image: 'assets/images/step-image-1.png'
    },
    {
      titleTranslate: 'INFO_SHOP_STEPS.STEP2.TITLE',
      textTranslate: 'INFO_SHOP_STEPS.STEP2.TEXT',
      image: 'assets/images/step-image-2.png'
    },
    {
      titleTranslate: 'INFO_SHOP_STEPS.STEP3.TITLE',
      textTranslate: 'INFO_SHOP_STEPS.STEP3.TEXT',
      image: 'assets/images/step-image-3.png'
    }
  ];

  constructor(
    private translate: TranslateService,
    private toastr: ToastrService
  ) {
    // Au chargement, on démarre l’auto-défilement
    this.startAutoScroll();
  }

  // Étape courante (getter pratique pour le template)
  get currentStep() {
    return this.steps[this.currentIndex];
  }

  // Étape précédente (avec boucle)
  prevStep() {
    try {
      this.currentIndex = (this.currentIndex - 1 + this.steps.length) % this.steps.length;
      this.restartAutoScroll();
    } catch (err) {
      console.error('Erreur lors du passage à l’étape précédente :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // Étape suivante (avec boucle)
  nextStep() {
    try {
      this.currentIndex = (this.currentIndex + 1) % this.steps.length;
      this.restartAutoScroll();
    } catch (err) {
      console.error('Erreur lors du passage à l’étape suivante :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // Lance l’auto-défilement (toutes les 5s)
  startAutoScroll() {
    try {
      this.stopAutoScroll(); // sécurité pour éviter les doublons
      this.autoScrollInterval = setInterval(() => {
        this.nextStep();
      }, 5000);
    } catch (err) {
      console.error('Erreur lors du démarrage de l’auto-défilement :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // Redémarre l’auto-défilement (utilisé après action utilisateur)
  restartAutoScroll() {
    try {
      this.stopAutoScroll();
      this.startAutoScroll();
    } catch (err) {
      console.error('Erreur lors du redémarrage de l’auto-défilement :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // Stoppe proprement l’intervalle
  stopAutoScroll() {
    try {
      if (this.autoScrollInterval) {
        clearInterval(this.autoScrollInterval);
        this.autoScrollInterval = null;
      }
    } catch (err) {
      console.error('Erreur lors de l’arrêt de l’auto-défilement :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // Cycle de vie Angular : nettoyage pour éviter les fuites mémoire
  ngOnDestroy() {
    this.stopAutoScroll();
  }

  // --- IzyGlam: toasts unifiés ---

  // Erreur générique stylisée (clé: ERROR.GENERIC_ERROR)
  private showCustomToast(message: string) {
    this.toastr.error(message);
  }

  // Succès (clé: SUCCESS.* si besoin)
  private showSuccessToast(message: string) {
    this.toastr.success(message);
  }
}
