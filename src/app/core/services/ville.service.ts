import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class VilleService {
  constructor(private http: HttpClient) { }

  /**
   * Récupérer toutes les villes
   */
  getAll(): Observable<any> {
    return this.http.get<any[]>(`${environment.apiUrl}city`);
  }

  /**
   * Récupérer toutes les villes
   */
  getAllLimted(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}ville-limited`);
  }

  /**
   * Récupérer une ville par son ID
   * @param id (ID de la ville)
   */
  getById(id: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}city/${id}`);
  }

  /**
   * Créer une nouvelle ville
   * @param ville (données de la ville à créer)
   */
  create(ville: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}city`, ville);
  }

  /**
   * Mettre à jour une ville par son ID
   * @param ville (données de la ville à mettre à jour, incluant son _id)
   */
  update(ville: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}city/${ville._id}`, ville);
  }

  /**
   * Supprimer une ville par son ID
   * @param id (ID de la ville à supprimer)
   */
  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}city/${id}`);
  }

  /**
 * Récupérer les villes par code postal et pays
 * @param codePostal 
 * @param pays (optionnel)
 */
  getByPostalCode(codePostal: string, pays?: string): Observable<any[]> {
    const url = `${environment.apiUrl}city-by-postal/${codePostal}`;
    return this.http.get<any[]>(pays ? `${url}?pays=${pays}` : url);
  }
}
