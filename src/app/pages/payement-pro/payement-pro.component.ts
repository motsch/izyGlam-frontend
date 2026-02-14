import { Component, OnInit, HostListener, Type } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from 'src/app/core/services/user.service';
import { environment } from 'src/environments/environment';
import { loadStripe } from '@stripe/stripe-js';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';
import { StripeService } from 'src/app/core/services/stripe.service';
import { CountryService } from 'src/app/core/services/country.service';
import { ConfidentialPolicyComponent } from 'src/app/core/component/confidential-policy/confidential-policy.component';
import { AccessibilityPolicyComponent } from 'src/app/core/component/accessibility-policy/accessibility-policy.component';
import { TermsPolicyComponent } from 'src/app/core/component/terms-policy/terms-policy.component';

// ✅ Composants des policies (mêmes que footer)

type PolicyKind = 'confidentiality' | 'accessibility' | 'conditions';

@Component({
  selector: 'app-payement-pro',
  templateUrl: './payement-pro.component.html',
  styleUrls: ['./payement-pro.component.scss']
})
export class PayementProComponent implements OnInit {

  abonnement!: 'premium' | 'pro';
  abonnements: any = null;

  planLabel: string = '';
  displayPrice: string = '';
  currencySymbol: string = '€';

  me: any = {};
  adressePrincipale: any = {};
  stripeCustomerID?: string;
  cards: any[] = [];
  selectedCardId: string | null = null;
  showAddCardForm = false;

  private stripePromise?: Promise<any>;

  // ✅ Modale "Offre soumise à conditions"
  showConditionsModal = false;

  // ✅ Modale policy (comme footer)
  policyModalVisible = false;
  policyActiveComponent: Type<any> | null = null;
  policyModalTitle = '';

  private policyMap: Record<PolicyKind, { comp: Type<any>; title: string }> = {
    confidentiality: { comp: ConfidentialPolicyComponent, title: 'Politique de confidentialité' },
    accessibility: { comp: AccessibilityPolicyComponent, title: 'Accessibilité' },
    conditions: { comp: TermsPolicyComponent, title: "Conditions d'utilisation" },
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private toastr: ToastrService,
    private translate: TranslateService,
    private stripeService: StripeService,
    private countryService: CountryService
  ) { }

  ngOnInit(): void {
    this.abonnement = this.route.snapshot.paramMap.get('abonnement') as any;

    if (this.abonnement !== 'premium' && this.abonnement !== 'pro') {
      this.router.navigate(['/main']);
      return;
    }

    const nav = this.router.getCurrentNavigation();
    const stateSubs = nav?.extras?.state?.['subs'];

    if (stateSubs) {
      this.abonnements = stateSubs;
      this.computePlanUi();
    } else {
      this.loadSubscriptionsFromApi();
    }

    this.loadUser();
  }

  private loadSubscriptionsFromApi(): void {
    this.countryService.getMySubscriptions().subscribe({
      next: (subs: any) => {
        this.abonnements = subs;
        this.computePlanUi();
      },
      error: () => {
        this.computePlanUi();
      }
    });
  }

  private computePlanUi(): void {
    // ✅ Correction : c'était "TARIF.BASIC" chez toi
    this.planLabel =
      this.abonnement === 'premium'
        ? this.translate.instant('TARIF.PREMIUM')
        : this.translate.instant('TARIF.PRO');

    const currency = this.abonnements?.currency || 'EUR';

    const currencyMap: any = {
      EUR: '€',
      USD: '$',
      GBP: '£'
    };

    this.currencySymbol = currencyMap[currency] || currency;

    const cents =
      this.abonnement === 'premium'
        ? this.abonnements?.premiumMonthlyCents
        : this.abonnements?.proMonthlyCents;

    if (typeof cents === 'number') {
      this.displayPrice = (cents / 100).toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      return;
    }

    const fallback = this.abonnement === 'premium' ? 89.9 : 59.9;
    this.displayPrice = fallback.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  private loadUser(): void {
    this.userService.getMe().subscribe({
      next: async (user: any) => {
        this.me = user;
        this.stripeCustomerID = user.customerId;

        const addressTemp = user.address?.find((x: any) => x.main === true);
        this.adressePrincipale = addressTemp || user.address?.[0];

        this.stripePromise = loadStripe(environment.stripePublicKey);

        if (this.stripeCustomerID) {
          await this.loadCards();
        }
      },
      error: () => this.showError()
    });
  }

  async loadCards(): Promise<void> {
    try {
      const response = await fetch(
        `${environment.apiUrl}stripe/get-cards?customerId=${this.stripeCustomerID}`
      );

      const data = await response.json();
      this.cards = data.cards || [];

      const defaultCard =
        this.cards.find((c: any) => c.isDefault) || this.cards[0];

      this.selectedCardId = defaultCard?.id || null;
    } catch {
      this.showError();
    }
  }

  selectCard(cardId: string) {
    this.selectedCardId = cardId;
  }

  goToAbonnement() {
    this.router.navigate(['/prices']);
  }

  onCardAdded(_event: any) {
    this.showAddCardForm = false;
    this.loadCards();
  }

  finalizePurchase() {
    if (!this.me?._id) {
      this.showError();
      return;
    }

    this.stripeService
      .createCheckoutSession(this.me._id, this.abonnement)
      .subscribe({
        next: (res: any) => {
          if (res?.url) {
            window.location.href = res.url;
          } else {
            window.location.href = '/thank-you?fallback=1';
          }
        },
        error: () => this.showError()
      });
  }

  // ==========================
  // ✅ MODALE CONDITIONS
  // ==========================
  openConditionsModal(event?: Event) {
    event?.preventDefault();
    this.showConditionsModal = true;
    document.body.classList.add('modal-open');
  }

  closeConditionsModal() {
    this.showConditionsModal = false;
    document.body.classList.remove('modal-open');
  }

  // ==========================
  // ✅ MODALE POLICY (comme footer)
  // ==========================
  openPolicyModal(kind: PolicyKind, event?: Event): void {
    try {
      if (event) event.preventDefault();

      const conf = this.policyMap[kind];
      if (!conf) {
        this.showError();
        return;
      }

      this.policyActiveComponent = conf.comp;
      this.policyModalTitle = conf.title;
      this.policyModalVisible = true;

      document.body.style.overflow = 'hidden';
    } catch (err) {
      console.error('Erreur openPolicyModal :', err);
      this.showError();
    }
  }

  closePolicyOnBackdrop(_evt: MouseEvent): void {
    this.closePolicyModal();
  }

  closePolicyModal(): void {
    this.policyModalVisible = false;
    this.policyActiveComponent = null;
    this.policyModalTitle = '';
    document.body.style.overflow = '';
  }

  // ✅ ESC : ferme la modale ouverte (priorité à la policy si ouverte)
  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.policyModalVisible) {
      this.closePolicyModal();
      return;
    }
    if (this.showConditionsModal) {
      this.closeConditionsModal();
    }
  }

  private showError() {
    this.toastr.error(this.translate.instant('ERROR.GENERIC_ERROR'));
  }
}
