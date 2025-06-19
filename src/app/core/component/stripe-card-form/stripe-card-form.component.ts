import { Component, ElementRef, EventEmitter, Output, AfterViewInit, Input } from '@angular/core';
import { loadStripe, Stripe, StripeCardElement } from '@stripe/stripe-js';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-stripe-card-form',
  templateUrl: './stripe-card-form.component.html',
  styleUrls: ['./stripe-card-form.component.scss']
})
export class StripeCardFormComponent implements AfterViewInit {
  @Output() cardAdded = new EventEmitter<void>();
  @Input() userId!: string;

  private stripe: Stripe | null = null;
  private card!: StripeCardElement;

  async ngAfterViewInit() {
    this.stripe = await loadStripe(environment.stripePublicKey);
    if (!this.stripe) {
      console.error('Stripe n’a pas pu être chargé.');
      return;
    }
    const elements = this.stripe.elements();
    this.card = elements.create('card');
    this.card.mount('#card-element');
  }

  async handleFormSubmit(event: Event) {
    event.preventDefault();

    // 💡 Option A : tu as déjà créé un SetupIntent sur ton backend
    const setupIntentClientSecret = await this.getSetupIntentSecretFromBackend();
    if (!this.stripe) {
      console.log("Stripe pas possible !");
      return;
    }
    const { setupIntent, error } = await this.stripe.confirmCardSetup(setupIntentClientSecret, {
      payment_method: {
        card: this.card
      }
    });

    if (error) {
      alert(error.message);
      return;
    }

    console.log('Carte enregistrée avec succès :', setupIntent);

    // Tu peux maintenant envoyer l’ID de la méthode de paiement à ton backend
    await this.attachCardToCustomer(setupIntent.payment_method as string);

    this.cardAdded.emit(); // pour recharger les cartes côté parent
  }

  async getSetupIntentSecretFromBackend(): Promise<string> {
    const res = await fetch('/api/stripe/create-setup-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    return data.clientSecret;
  }

  async attachCardToCustomer(paymentMethodId: string): Promise<void> {
    await fetch('/api/stripe/attach-card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethodId })
    });
  }

  /**
   * Enregistre une méthode de paiement sur le serveur.
   * @param paymentMethodId - ID de la méthode de paiement.
   * @param userId - ID de l'utilisateur.
   */
  async saveCardOnServer(paymentMethodId: string, userId: string): Promise<void> {
    try {
      console.log('Enregistrement de la carte sur le serveur...');
      const response = await fetch(`${environment.apiUrl}stripe/save-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId, userId }),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(`Échec de l'enregistrement de la carte : ${errorMessage}`);
      }

      const data = await response.json();
      console.log('CustomerId mis à jour avec succès :', data.customerId);
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de la carte sur le serveur :', error);
      throw error;
    }
  }

  /**
   * Ajoute une nouvelle carte via Stripe Elements.
   */
  async addCard() {
    try {
      console.log('Ajout de carte en cours...');
      if (!this.stripe) {
        throw new Error('Stripe n\'est pas initialisé.');
      }

      // Collecte les détails de facturation
      const billingDetails = {
        name: 'Nom de l\'utilisateur',
        email: 'email@example.com',
      };

      // Crée une méthode de paiement avec Stripe Elements
      const { paymentMethod, error } = await this.stripe.createPaymentMethod({
        type: 'card',
        card: this.card,
        billing_details: billingDetails,
      });

      if (error) {
        // this.showCustomToast('Erreur lors de la création de la méthode de paiement');
        console.error('Erreur lors de la création de la méthode de paiement :', error);
        return;
      }

      // Récupérez l'ID de l'utilisateur depuis le localStorage
      if (!this.userId) {
        // this.showCustomToast('Aucun userId trouvé. Veuillez vous connecter');
        throw new Error('Aucun userId trouvé. Veuillez vous connecter.');
      }

      // Enregistrez la méthode de paiement sur votre serveur avec userId
      await this.saveCardOnServer(paymentMethod.id, this.userId);

      // Fermez la modal après avoir ajouté la carte
      // this.closeAddCardModal();

      this.cardAdded.emit(); // pour recharger les cartes côté parent
     
      // this.showCustomToast('Carte ajoutée avec succès !');
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la carte :', error);
      // this.showCustomToast('Une erreur est survenue lors de l\'ajout de la carte');
    }
  }
}
