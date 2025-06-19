import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SubscriptionService {
  constructor(private http: HttpClient) {}

  /**
   * Récupérer tous les abonnements (optionnellement filtrés par pays)
   * @param country (ex : "FR")
   */
  getAll(country?: string): Observable<any[]> {
    const url = country
      ? `${environment.apiUrl}subscription?country=${country}`
      : `${environment.apiUrl}subscription`;
    return this.http.get<any[]>(url);
  }

  /**
   * Récupérer un abonnement par son ID
   * @param id (ID de l'abonnement)
   */
  getById(id: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}subscription/${id}`);
  }

  /**
   * Lancer un abonnement Stripe pour un utilisateur
   * @param data { userId, subscriptionId, paymentMethodId }
   */
  startSubscription(data: {
    userId: string;
    subscriptionId: string;
    paymentMethodId: string;
  }): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}subscription`, data);
  }

  /**
   * Créer un abonnement dans Mongo uniquement (si jamais tu veux séparer les deux logiques)
   * @param subscription (plan d'abonnement à créer dans la base)
   */
  createRawSubscription(subscription: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}subscription`, subscription);
  }

  /**
   * Mettre à jour un abonnement Mongo par son ID
   * @param subscription (données de l'abonnement à mettre à jour)
   */
  update(subscription: any): Observable<any> {
    return this.http.put<any>(
      `${environment.apiUrl}subscription/${subscription._id}`,
      subscription
    );
  }

  /**
   * Supprimer un abonnement Mongo par son ID
   * @param id (ID de l'abonnement à supprimer)
   */
  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}subscription/${id}`);
  }
}
