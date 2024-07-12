import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environnements/environment';

@Injectable({ providedIn: 'root' })
export class ColumnService {
  constructor(private http: HttpClient) {}

  /**
   * Créer une nouvelle colonne
   * @param column (données de la colonne à créer)
   */
  create(column: any) {
    return this.http.post<any>(`${environment.apiUrl}columns`, column);
  }

  /**
   * Créer de nouvelles colonnes
   * @param columns (données des colonnes à créer)
   */
  createMultipleColumns(columns: any[]) {
    return this.http.post<any>(`${environment.apiUrl}columns/create-multiple`, columns);
  }

  /**
   * Récupérer toutes les colonnes
   */
  getAll() {
    return this.http.get<any[]>(`${environment.apiUrl}columns`);
  }

  /**
   * Récupérer une colonne par son ID
   * @param id (ID de la colonne)
   */
  getById(id: string) {
    return this.http.get<any>(`${environment.apiUrl}columns/${id}`);
  }

  /**
   * Mettre à jour une colonne par son ID
   * @param column (données de la colonne à mettre à jour)
   */
  update(column: any) {
    return this.http.put<any>(`${environment.apiUrl}columns/${column._id}`, column);
  }

  /**
   * Créer de nouvelles colonnes
   * @param columns (données des colonnes à créer)
   */
  updateMultipleColumns(columns: any[]) {
    return this.http.put<any>(`${environment.apiUrl}columns/update-multiple`, columns);
  }

  /**
   * Supprimer une colonne par son ID
   * @param id (ID de la colonne à supprimer)
   */
  delete(id: string) {
    return this.http.delete<any>(`${environment.apiUrl}columns/${id}`);
  }
}
