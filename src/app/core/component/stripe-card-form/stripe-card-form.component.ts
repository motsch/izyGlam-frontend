import {
  Component,
  ElementRef,
  EventEmitter,
  Output,
  AfterViewInit,
  OnDestroy,
  Input,
  ViewChild,
} from '@angular/core';
import { loadStripe, Stripe, StripeCardElement, StripeElements } from '@stripe/stripe-js';
import { environment } from 'src/environments/environment';
import { ToastrService } from 'ngx-toastr';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-stripe-card-form',
  templateUrl: './stripe-card-form.component.html',
  styleUrls: ['./stripe-card-form.component.scss'],
})
export class StripeCardFormComponent implements AfterViewInit, OnDestroy {
  /** Événement émis quand une carte est ajoutée avec succès (pour forcer un refresh parent) */
  @Output() cardAdded = new EventEmitter<void>();
  /** ID utilisateur nécessaire côté backend pour attacher la PM au customer */
  @Input() userId!: string;

  /** Référence DOM du conteneur d’Elements (évite les soucis d’ID dupliqués) */
  @ViewChild('cardElement', { static: true }) cardElementRef!: ElementRef<HTMLDivElement>;

  // ---- Stripe state
  private stripe: Stripe | null = null;
  private elements!: StripeElements;
  private card!: StripeCardElement;

  // ---- UI state
  isLoading = false;
  cardError = '';

  constructor(private toastr: ToastrService, private translate: TranslateService) {}

  // =========================================================
  // Lifecycle
  // =========================================================
  async ngAfterViewInit() {
    try {
      // 1) Sécurité basique : clé publique présente ?
      if (!environment?.stripePublicKey) {
        console.error('[StripeCardForm] Missing stripePublicKey in environment');
        this.showCustomToast(this.t('STRIPE.MISSING_PK') || 'Configuration Stripe manquante', 'error');
        return;
      }

      // 2) Chargement Stripe.js
      this.stripe = await loadStripe(environment.stripePublicKey);
      if (!this.stripe) {
        console.error('[StripeCardForm] Stripe failed to load');
        this.showCustomToast(this.t('STRIPE.LOAD_FAILED') || 'Stripe n’a pas pu être chargé', 'error');
        return;
      }

      // 3) Création d’Elements + CardElement et montage dans le container
      this.elements = this.stripe.elements();
      this.card = this.elements.create('card', {
        // tu peux personnaliser le style ici si besoin
        hidePostalCode: true,
      });
      this.card.mount(this.cardElementRef.nativeElement);

      // 4) Écoute des erreurs de validation côté front (immédiates)
      this.card.on('change', (event) => {
        this.cardError = event.error?.message || '';
      });

      console.log('[StripeCardForm] Stripe Elements mounted');
    } catch (err) {
      console.error('[StripeCardForm] ngAfterViewInit error:', err);
      this.showCustomToast(this.t('COMMON.UNEXPECTED_ERROR') || 'Une erreur inattendue est survenue', 'error');
    }
  }

  ngOnDestroy(): void {
    // Nettoyage : démonter l’élément pour éviter les fuites mémoire lors de la destruction du composant
    try {
      if (this.card) this.card.unmount();
    } catch (err) {
      console.warn('[StripeCardForm] ngOnDestroy warning:', err);
    }
  }

  // =========================================================
  // Soumission (Option A : SetupIntent) — recommandé pour “enregistrer une carte”
  // =========================================================
  async handleFormSubmit(event: Event) {
    event.preventDefault();

    if (!this.stripe || !this.card) {
      this.showCustomToast(this.t('STRIPE.NOT_READY') || 'Stripe non initialisé', 'error');
      return;
    }
    if (!this.userId) {
      this.showCustomToast(this.t('AUTH.LOGIN_REQUIRED') || 'Veuillez vous connecter', 'error');
      return;
    }

    this.isLoading = true;
    this.cardError = '';

    try {
      // 1) Demander au backend la création d’un SetupIntent
      const clientSecret = await this.getSetupIntentSecretFromBackend(this.userId);
      if (!clientSecret) {
        throw new Error('No client secret returned by backend');
      }

      // 2) Confirmer côté client avec la carte collectée par Elements
      const { setupIntent, error } = await this.stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: this.card,
          // 🔎 Ajoute des détails de facturation si tu les as (name/email du user)
        },
      });

      if (error) {
        console.error('[StripeCardForm] confirmCardSetup error:', error);
        this.cardError = error.message || '';
        this.showCustomToast(this.cardError || this.t('STRIPE.CONFIRM_FAILED') || 'Échec de l’enregistrement de la carte', 'error');
        this.isLoading = false;
        return;
      }

      // 3) Attacher la PM au customer côté backend (persisté chez toi)
      const pmId = setupIntent?.payment_method as string;
      await this.attachCardToCustomer(pmId, this.userId);

      // 4) Notifier + event parent
      this.showCustomToast(this.t('STRIPE.CARD_SAVED') || 'Carte enregistrée avec succès ✅', 'success');
      this.cardAdded.emit();
    } catch (err) {
      console.error('[StripeCardForm] handleFormSubmit error:', err);
      this.showCustomToast(this.t('COMMON.UNEXPECTED_ERROR') || 'Une erreur inattendue est survenue', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  // =========================================================
  // Alternative (Option B) : créer une PaymentMethod directement puis la sauvegarder
  // =========================================================
  async addCard() {
    if (!this.stripe || !this.card) {
      this.showCustomToast(this.t('STRIPE.NOT_READY') || 'Stripe non initialisé', 'error');
      return;
    }
    if (!this.userId) {
      this.showCustomToast(this.t('AUTH.LOGIN_REQUIRED') || 'Veuillez vous connecter', 'error');
      return;
    }

    this.isLoading = true;
    this.cardError = '';

    try {
      // 1) Créer une PaymentMethod à partir d’Elements
      const { paymentMethod, error } = await this.stripe.createPaymentMethod({
        type: 'card',
        card: this.card,
        // billing_details: { name: 'John Doe', email: 'john@doe.com' }, // si tu as ces infos
      });

      if (error || !paymentMethod) {
        console.error('[StripeCardForm] createPaymentMethod error:', error);
        this.cardError = error?.message || '';
        this.showCustomToast(this.cardError || this.t('STRIPE.PM_FAILED') || 'Échec de création de la carte', 'error');
        this.isLoading = false;
        return;
      }

      // 2) Persister/attacher côté backend (crée / attache au customer, sauvegarde en BDD)
      await this.saveCardOnServer(paymentMethod.id, this.userId);

      this.showCustomToast(this.t('STRIPE.CARD_SAVED') || 'Carte enregistrée avec succès ✅', 'success');
      this.cardAdded.emit();
    } catch (err) {
      console.error('[StripeCardForm] addCard error:', err);
      this.showCustomToast(this.t('COMMON.UNEXPECTED_ERROR') || 'Une erreur inattendue est survenue', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  // =========================================================
  // Backend calls
  // =========================================================

  /**
   * Demande au backend un SetupIntent pour l’utilisateur.
   * Le backend doit renvoyer { clientSecret }.
   */
  private async getSetupIntentSecretFromBackend(userId: string): Promise<string> {
    try {
      const res = await fetch(`${environment.apiUrl}stripe/create-setup-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data?.clientSecret || '';
    } catch (err) {
      console.error('[StripeCardForm] getSetupIntentSecretFromBackend error:', err);
      this.showCustomToast(this.t('STRIPE.SI_FAILED') || 'Impossible de préparer l’enregistrement de la carte', 'error');
      return '';
    }
  }

  /**
   * Attache la PaymentMethod à ton customer et la persiste en BDD.
   */
  private async attachCardToCustomer(paymentMethodId: string, userId: string): Promise<void> {
    try {
      const res = await fetch(`${environment.apiUrl}stripe/attach-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId, userId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.error('[StripeCardForm] attachCardToCustomer error:', err);
      this.showCustomToast(this.t('STRIPE.ATTACH_FAILED') || 'Impossible d’attacher la carte au compte', 'error');
      throw err;
    }
  }

  /**
   * Sauvegarde côté serveur (variante pour Option B).
   */
  private async saveCardOnServer(paymentMethodId: string, userId: string): Promise<void> {
    try {
      const res = await fetch(`${environment.apiUrl}stripe/save-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId, userId }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      console.log('[StripeCardForm] saveCardOnServer ok, customerId:', data?.customerId);
    } catch (err) {
      console.error('[StripeCardForm] saveCardOnServer error:', err);
      this.showCustomToast(this.t('STRIPE.SAVE_FAILED') || 'Échec de l’enregistrement de la carte', 'error');
      throw err;
    }
  }

  // =========================================================
  // Helpers (toasts + i18n)
  // =========================================================

  /** i18n safe */
  private t(key: string): string {
    try {
      const value = this.translate.instant(key);
      return value && value !== key ? value : key;
    } catch {
      return key;
    }
  }

  /** Toast centralisé */
  private showCustomToast(message: string, type: 'success' | 'error' = 'success'): void {
    try {
      if (type === 'success') this.toastr.success(message);
      else this.toastr.error(message);
    } catch (err) {
      console.warn('[StripeCardForm] showCustomToast warn:', err, message);
    }
  }
}
