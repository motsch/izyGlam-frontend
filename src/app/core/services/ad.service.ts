import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdService {
  constructor(private http: HttpClient) {}

  /**
   * Récupérer toutes les campagnes publicitaires
   */
  getAll(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}ads`);
  }

  /**
   * Récupérer une campagne publicitaire par son ID
   * @param id (ID de la campagne)
   */
  getById(id: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}ads/${id}`);
  }

  /**
   * Récupérer les campagnes publicitaires d'un utilisateur par son ID
   * @param userId (ID de l'utilisateur)
   */
  getByUserId(userId: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}ads-by-user/${userId}`);
  }

  /**
   * Créer une nouvelle campagne publicitaire
   * @param ad (données de la campagne à créer)
   */
  create(ad: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}ads`, ad);
  }

  /**
   * Mettre à jour une campagne publicitaire par son ID
   * @param ad (données de la campagne à mettre à jour)
   */
  update(ad: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}ads/${ad._id}`, ad);
  }

  /**
   * Supprimer une campagne publicitaire par son ID
   * @param id (ID de la campagne à supprimer)
   */
  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}ads/${id}`);
  }
}
