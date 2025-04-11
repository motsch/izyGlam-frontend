import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  constructor(private http: HttpClient) {}

  /**
   * Récupérer toutes les transactions
   */
  getAll(): Observable<any> {
    return this.http.get<any[]>(`${environment.apiUrl}transaction`);
  }

  /**
   * Récupérer une transaction par son ID
   * @param id (ID de la transaction)
   */
  getById(id: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}transaction/${id}`);
  }

  /**
   * Créer une nouvelle transaction
   * @param transaction (données de la transaction à créer)
   */
  create(transaction: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}transaction`, transaction);
  }

  /**
   * Mettre à jour une transaction par son ID
   * @param transaction (données de la transaction à mettre à jour, incluant son _id)
   */
  update(transaction: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}transaction/${transaction._id}`, transaction);
  }

  /**
   * Supprimer une transaction par son ID
   * @param id (ID de la transaction à supprimer)
   */
  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}transaction/${id}`);
  }
}
