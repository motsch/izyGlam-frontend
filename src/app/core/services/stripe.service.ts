import { Injectable } from '@angular/core';
import { loadStripe, Stripe, StripeCardElement } from '@stripe/stripe-js';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class StripeService {
  public stripePromise: Promise<Stripe | null>;
  constructor(private http: HttpClient) {
    this.stripePromise = loadStripe(environment.stripePublicKey);
  }

  createStripeOnboardingLink(userId: string) {
    return this.http.post<{ url: string }>(
      `${environment.apiUrl}stripe/connect/onboarding-link`,
      { userId }
    );
  }

  refreshStripeStatus(userId: string) {
    return this.http.get<any>(`${environment.apiUrl}stripe/connect/status`, {
      params: { userId },
    }
    );
  }

  // Créer une intention de paiement
  createPaymentIntent(amount: number, currency: string, customerId: string) {
    return this.http.post(`${environment.apiUrl}stripe/create-payment-intent`, {
      amount,
      currency,
      customerId, // Ajoutez customerId ici
    });
  }

  // Enregistrer une carte
  saveCard(paymentMethodId: string, userId: string) {
    return this.http.post(`${environment.apiUrl}stripe/save-card`, {
      paymentMethodId,
      userId,
    });
  }

  // Définir une carte comme principale
  setPrimaryCard(cardId: string, customerId: string) {
    return this.http.post(`${environment.apiUrl}stripe/set-primary-card`, {
      cardId,
      customerId,
    });
  }

  // Récupérer les cartes associées à un utilisateur
  getCards(customerId: string) {
    return this.http.get(`${environment.apiUrl}stripe/get-cards`, {
      params: { customerId },
    });
  }

  async createPaymentMethod(cardElement: StripeCardElement, billingDetails: any) {
    const stripe = await this.stripePromise;
    if (!stripe) throw new Error('Stripe n\'est pas initialisé.');
    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: billingDetails,
    });
    if (error) throw error;
    return paymentMethod;
  }

  // Cette méthode devient inutile car nous utilisons maintenant Stripe Elements
  async createPaymentMethodFromDetails(cardNumber: string, expMonth: string, expYear: string, cvc: string): Promise<string> {
    throw new Error('Cette méthode est obsolète. Utilisez Stripe Elements à la place.');
  }

  /**
   * Demande un remboursement via le backend.
   * Le backend doit ensuite appeler l'API Stripe pour traiter le remboursement.
   * @param paymentIntentId L'identifiant du paiement à rembourser.
   * @returns Un Observable contenant la réponse du backend.
   */
  refundPayment(paymentIntentId: string, amount?: number): Observable<any> {
    const url = `${environment.apiUrl}stripe/refund`;
    // Construire le payload en incluant le montant si fourni
    const payload: any = { paymentIntentId };
    if (amount !== undefined) {
      payload.amount = amount;
    }
    return this.http.post<any>(url, payload);
  }

  createPremiumCheckoutSession(userId: string) {
    return this.http.post(`${environment.apiUrl}premium/checkout-session`, { userId });
  }

  getPremiumCheckoutStatus(sessionId: string, userId: string) {
    return this.http.get(`${environment.apiUrl}premium/checkout-session-status`, {
      params: { session_id: sessionId, userId }
    });
  }

  getPremiumSubscription(userId: string) {
    return this.http.get(`${environment.apiUrl}premium/subscription`, {
      params: { userId }
    });
  }

  cancelPremium(userId: string) {
    return this.http.post(`${environment.apiUrl}premium/cancel`, { userId });
  }

  resumePremium(userId: string) {
    return this.http.post(`${environment.apiUrl}premium/resume`, { userId });
  }

  openCustomerPortal(userId: string) {
    return this.http.post(`${environment.apiUrl}premium/portal`, { userId });
  }
}