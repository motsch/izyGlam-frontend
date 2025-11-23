import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TipService {
  constructor(private http: HttpClient) {}

  /**
   * Récupérer tous les tips
   */
  getAll(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}tips`);
  }

  /**
   * Récupérer un tip par son ID
   * @param id (ID du tip)
   */
  getById(id: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}tips/${id}`);
  }

  /**
   * Créer un nouveau tip
   * @param tip (données du tip à créer)
   */
  create(tip: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}tips`, tip);
  }

  /**
   * Mettre à jour un tip par son ID
   * @param tip (données du tip à mettre à jour)
   */
  update(tip: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}tips/${tip._id}`, tip);
  }

  /**
   * Supprimer un tip par son ID
   * @param id (ID du tip à supprimer)
   */
  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}tips/${id}`);
  }
}
