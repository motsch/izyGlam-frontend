import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ColorService {
  constructor(private http: HttpClient) {}

  /**
   * Récupérer toutes les couleurs
   */
  getAll(): Observable<any> {
    return this.http.get<any[]>(`${environment.apiUrl}color`);
  }

  /**
   * Récupérer une couleur par son ID
   * @param id (ID de la couleur)
   */
  getById(id: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}color/${id}`);
  }

  /**
   * Créer une nouvelle couleur
   * @param color (données de la couleur à créer)
   */
  create(color: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}color`, color);
  }

  /**
   * Mettre à jour une couleur par son ID
   * @param color (données de la couleur à mettre à jour)
   */
  update(color: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}color/${color._id}`, color);
  }

  /**
   * Supprimer une couleur par son ID
   * @param id (ID de la couleur à supprimer)
   */
  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}color/${id}`);
  }
}
