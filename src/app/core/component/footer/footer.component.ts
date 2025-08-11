import { Component, HostListener, OnInit, Type } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AccessibilityPolicyComponent } from '../accessibility-policy/accessibility-policy.component';
import { ConfidentialPolicyComponent } from '../confidential-policy/confidential-policy.component';
import { TermsPolicyComponent } from '../terms-policy/terms-policy.component';

// Import des composants standalone

type PolicyKind = 'confidentiality' | 'accessibility' | 'conditions';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.scss'],
})
export class FooterComponent implements OnInit {
    today: number = Date.now();

    // État modal
    modalVisible = false;
    activeComponent: Type<any> | null = null;
    modalTitle = '';

    // Map: clic -> composant + titre
    private policyMap: Record<PolicyKind, { comp: Type<any>; title: string }> = {
        confidentiality: { comp: ConfidentialPolicyComponent, title: 'Politique de confidentialité' },
        accessibility: { comp: AccessibilityPolicyComponent, title: 'Accessibilité' },
        conditions: { comp: TermsPolicyComponent, title: 'Conditions d\'utilisation' },
    };

    constructor(
        private router: Router,
        private translate: TranslateService
    ) { }

    ngOnInit() {
        const browserLang = navigator.language.split('-')[0];
        const storedLangue = (localStorage.getItem('langue') || browserLang || 'en').replace(/"/g, '');
        this.translate.use(storedLangue);
    }

    goToHelp() {
        this.router.navigate(['help']);
    }

    closeOnBackdrop(evt: MouseEvent) {
        // clic sur le fond => fermeture (le panel stopPropagation)
        this.closeModal();
    }

    @HostListener('document:keydown.escape')
    onEsc() {
        if (this.modalVisible) this.closeModal();
    }

    openModal(kind: PolicyKind, event?: Event) {
        if (event) event.preventDefault();
        const conf = this.policyMap[kind];
        this.activeComponent = conf.comp;
        this.modalTitle = conf.title;
        this.modalVisible = true;
        document.body.style.overflow = 'hidden'; // ⬅︎ bloque le scroll page
    }

    closeModal() {
        this.modalVisible = false;
        this.activeComponent = null;
        this.modalTitle = '';
        document.body.style.overflow = ''; // ⬅︎ rétablit
    }
}
