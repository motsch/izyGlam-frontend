import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FinancialService {
  constructor(private http: HttpClient) {}

  /**
   * Crée le paiement initial lors de la réservation.
   * Le client paie la totalité et la plateforme reçoit l'intégralité en séquestre.
   * @param booking Données du booking
   */
  createInitialPayment(booking: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}financial/initial-payment`, { booking });
  }

  /**
   * Traite un remboursement.
   * Selon le refundType, on effectue un remboursement complet ou partiel.
   * @param bookingId L'ID du booking
   * @param refundType Le type de remboursement ("customer-cancel-greater-than-24", "customer-cancel-less-than-24", "provider-cancel", "no-show-pro")
   */
  processRefund(bookingId: string, refundType: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}financial/refund`, { bookingId, refundType });
  }

  /**
   * Effectue le versement (payout) au prestataire une fois la prestation terminée.
   * @param bookingId L'ID du booking
   */
  processPayout(bookingId: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}financial/payout`, { bookingId });
  }

  /**
   * Traite un retrait (withdrawal) pour un prestataire.
   * @param userProId L'ID du prestataire
   */
  processWithdrawal(userProId: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}financial/withdrawal`, { userProId });
  }
}
