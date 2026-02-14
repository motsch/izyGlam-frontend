import { Injectable } from '@angular/core';
import { loadStripe, Stripe, StripeCardElement } from '@stripe/stripe-js';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type SubscriptionPlan = 'pro' | 'premium';

@Injectable({
  providedIn: 'root',
})
export class StripeService {
  public stripePromise: Promise<Stripe | null>;

  constructor(private http: HttpClient) {
    this.stripePromise = loadStripe(environment.stripePublicKey);
  }

  // ======================================================
  // ✅ STRIPE CONNECT (inchangé)
  // ======================================================

  createStripeOnboardingLink(userId: string) {
    return this.http.post<{ url: string }>(
      `${environment.apiUrl}stripe/connect/onboarding-link`,
      { userId }
    );
  }

  refreshStripeStatus(userId: string) {
    return this.http.get<any>(`${environment.apiUrl}stripe/connect/status`, {
      params: { userId },
    });
  }

  // ======================================================
  // ✅ PAIEMENTS / CARDS (inchangé)
  // ======================================================

  createPaymentIntent(amount: number, currency: string, customerId: string) {
    return this.http.post(`${environment.apiUrl}stripe/create-payment-intent`, {
      amount,
      currency,
      customerId,
    });
  }

  saveCard(paymentMethodId: string, userId: string) {
    return this.http.post(`${environment.apiUrl}stripe/save-card`, {
      paymentMethodId,
      userId,
    });
  }

  setPrimaryCard(cardId: string, customerId: string) {
    return this.http.post(`${environment.apiUrl}stripe/set-primary-card`, {
      cardId,
      customerId,
    });
  }

  getCards(customerId: string) {
    return this.http.get(`${environment.apiUrl}stripe/get-cards`, {
      params: { customerId },
    });
  }

  async createPaymentMethod(cardElement: StripeCardElement, billingDetails: any) {
    const stripe = await this.stripePromise;
    if (!stripe) throw new Error("Stripe n'est pas initialisé.");

    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: billingDetails,
    });

    if (error) throw error;
    return paymentMethod;
  }

  async createPaymentMethodFromDetails(
    cardNumber: string,
    expMonth: string,
    expYear: string,
    cvc: string
  ): Promise<string> {
    throw new Error('Cette méthode est obsolète. Utilisez Stripe Elements à la place.');
  }

  refundPayment(paymentIntentId: string, amount?: number): Observable<any> {
    const url = `${environment.apiUrl}stripe/refund`;
    const payload: any = { paymentIntentId };
    if (amount !== undefined) payload.amount = amount;
    return this.http.post<any>(url, payload);
  }

  // ======================================================
  // ✅ NOUVELLE API SUBSCRIPTION (PRO + PREMIUM dynamiques)
  // ======================================================

  /**
   * ✅ Nouvelle méthode recommandée
   * POST /subscription/checkout-session
   * Body: { userId, plan: "pro" | "premium" }
   */
  createCheckoutSession(userId: string, plan: SubscriptionPlan) {
    return this.http.post(`${environment.apiUrl}subscription/checkout-session`, {
      userId,
      plan,
    });
  }

  /**
   * ✅ Statut checkout (même endpoint que premium legacy)
   * GET /subscription/checkout-session-status?session_id=...&userId=...
   */
  getCheckoutStatus(sessionId: string, userId: string) {
    return this.http.get(`${environment.apiUrl}subscription/checkout-session-status`, {
      params: { session_id: sessionId, userId },
    });
  }

  /**
   * ✅ Subscription actuelle de l'utilisateur (pro/premium/free)
   * GET /subscription?userId=...
   */
  getSubscription(userId: string) {
    return this.http.get(`${environment.apiUrl}subscription`, {
      params: { userId },
    });
  }

  /**
   * ✅ Annuler à la fin de période
   * POST /subscription/cancel { userId }
   */
  cancelSubscription(userId: string) {
    return this.http.post(`${environment.apiUrl}subscription/cancel`, { userId });
  }

  /**
   * ✅ Reprendre (cancel_at_period_end=false)
   * POST /subscription/resume { userId }
   */
  resumeSubscription(userId: string) {
    return this.http.post(`${environment.apiUrl}subscription/resume`, { userId });
  }

  /**
   * ✅ Ouvrir Stripe Customer Portal
   * POST /subscription/portal { userId }
   */
  openSubscriptionPortal(userId: string) {
    return this.http.post(`${environment.apiUrl}subscription/portal`, { userId });
  }

  // ======================================================
  // 🧱 LEGACY PREMIUM (NE PAS CASSER ton existant)
  // ======================================================

  createPremiumCheckoutSession(userId: string) {
    return this.http.post(`${environment.apiUrl}premium/checkout-session`, { userId });
  }

  getPremiumCheckoutStatus(sessionId: string, userId: string) {
    return this.http.get(`${environment.apiUrl}premium/checkout-session-status`, {
      params: { session_id: sessionId, userId },
    });
  }

  getPremiumSubscription(userId: string) {
    return this.http.get(`${environment.apiUrl}premium/subscription`, {
      params: { userId },
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

  // ======================================================
  // 🆕 BONUS : helpers pratiques (optionnel)
  // ======================================================

  /**
   * Permet de garder une API simple côté component
   * en utilisant la nouvelle route dynamique.
   */
  createProCheckoutSession(userId: string) {
    return this.createCheckoutSession(userId, 'pro');
  }

  createPremiumCheckoutSessionV2(userId: string) {
    return this.createCheckoutSession(userId, 'premium');
  }
}
