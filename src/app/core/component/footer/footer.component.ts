import { Component, HostListener, OnInit, Type } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

import { AccessibilityPolicyComponent } from '../accessibility-policy/accessibility-policy.component';
import { ConfidentialPolicyComponent } from '../confidential-policy/confidential-policy.component';
import { TermsPolicyComponent } from '../terms-policy/terms-policy.component';

// Types autorisés pour les politiques affichées dans la modale
type PolicyKind = 'confidentiality' | 'accessibility' | 'conditions';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {
  /** Timestamp du jour pour affichage dynamique dans le footer */
  today: number = Date.now();

  // -----------------------
  // État de la modale
  // -----------------------
  /** La modale est-elle visible ? */
  modalVisible = false;
  /** Composant actuellement monté dans la modale */
  activeComponent: Type<any> | null = null;
  /** Titre affiché en tête de la modale */
  modalTitle = '';

  /**
   * Table de correspondance clic -> composant + titre.
   * Utilisée par openModal() pour choisir le bon contenu sans switch/case verbeux.
   */
  private policyMap: Record<PolicyKind, { comp: Type<any>; title: string }> = {
    confidentiality: { comp: ConfidentialPolicyComponent, title: 'Politique de confidentialité' },
    accessibility: { comp: AccessibilityPolicyComponent, title: 'Accessibilité' },
    conditions: { comp: TermsPolicyComponent, title: 'Conditions d\'utilisation' },
  };

  constructor(
    private router: Router,
    private translate: TranslateService,
    private toastr: ToastrService
  ) {}

  // --------------------------------
  // Cycle de vie
  // --------------------------------
  ngOnInit(): void {
    // Détermine la langue (localStorage > langue navigateur > fallback 'en')
    const browserLang = navigator.language.split('-')[0];
    const storedLangue = (localStorage.getItem('langue') || browserLang || 'en').replace(/"/g, '');

    // ⚠️ .use() renvoie un observable => on gère les erreurs d’application de la langue
    this.translate.use(storedLangue).subscribe({
      next: () => {
        // Option : toaster silencieux si besoin
        // this.showCustomToast(this.translate.instant('SUCCESS.SUBSCRIBE_SUCCESS'));
      },
      error: (err) => {
        console.error('Erreur lors de l’application de la langue :', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), true);
      }
    });
  }

  // --------------------------------
  // Navigation & interactions
  // --------------------------------

  /** Redirection vers la page d’aide */
  goToHelp(): void {
    try {
      this.router.navigate(['help']);
    } catch (err) {
      console.error('Erreur lors de la navigation vers /help :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), true);
    }
  }

  /** Clic sur l’arrière-plan : on ferme la modale */
  closeOnBackdrop(evt: MouseEvent): void {
    // Le conteneur de la modale stoppe la propagation, ici on ferme directement
    this.closeModal();
  }

  /** Écoute de la touche Échap pour fermer la modale proprement */
  @HostListener('document:keydown.escape')
  onEsc(): void {
    if (this.modalVisible) this.closeModal();
  }

  /**
   * Ouvre la modale et charge dynamiquement le composant de politique
   * @param kind Type de politique ('confidentiality' | 'accessibility' | 'conditions')
   * @param event Optionnel : event de click pour éviter la navigation par défaut sur <a>
   */
  openModal(kind: PolicyKind, event?: Event): void {
    try {
      if (event) event.preventDefault();

      const conf = this.policyMap[kind];
      if (!conf) {
        // Cas défensif : type inconnu
        console.warn('Type de politique inconnu :', kind);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), true);
        return;
      }

      this.activeComponent = conf.comp;
      this.modalTitle = conf.title;
      this.modalVisible = true;

      // Empêche le scroll de la page derrière la modale
      document.body.style.overflow = 'hidden';
    } catch (err) {
      console.error('Erreur lors de l’ouverture de la modale :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), true);
    }
  }

  /** Ferme la modale et restaure l’état du document (scroll) */
  closeModal(): void {
    try {
      this.modalVisible = false;
      this.activeComponent = null;
      this.modalTitle = '';

      // Restaure le scroll de la page
      document.body.style.overflow = '';
    } catch (err) {
      console.error('Erreur lors de la fermeture de la modale :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'), true);
    }
  }

  // --------------------------------
  // Toast unifié (succès/erreur)
  // --------------------------------

  /**
   * Affiche un toast unifiéizyGlam
   * @param message  Texte (déjà traduit idéalement)
   * @param isError  True => toast d’erreur | False (défaut) => toast de succès
   *
   * Rappel i18n : place toujours tes messages dans
   *  - "SUCCESS.*" pour les succès
   *  - "ERROR.*"   pour les erreurs
   */
  private showCustomToast(message: string, isError: boolean = false): void {
    if (isError) {
      this.toastr.error(message);
    } else {
      this.toastr.success(message);
    }
  }
}
