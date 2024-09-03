import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ServiceTemplateService {
  constructor(private http: HttpClient) {}

  /**
   * Récupérer tous les serviceTemplates
   */
  getAll() {
    return this.http.get<any[]>(`${environment.apiUrl}serviceTemplate`);
  }

  /**
   * Récupérer un serviceTemplate par son ID
   * @param id (ID du serviceTemplate)
   */
  getById(id: string) {
    return this.http.get<any>(`${environment.apiUrl}serviceTemplate/${id}`);
  }

  /**
   * Créer un nouveau serviceTemplate
   * @param serviceTemplate (données du serviceTemplate à créer)
   */
  create(serviceTemplate: any) {
    return this.http.post<any>(`${environment.apiUrl}serviceTemplate`, serviceTemplate);
  }

  /**
   * Mettre à jour un serviceTemplate par son ID
   * @param serviceTemplate (données du serviceTemplate à mettre à jour)
   */
  update(serviceTemplate: any) {
    return this.http.put<any>(
      `${environment.apiUrl}serviceTemplate/${serviceTemplate._id}`,
      serviceTemplate
    );
  }

  /**
   * Supprimer un serviceTemplate par son ID
   * @param id (ID du serviceTemplate à supprimer)
   */
  delete(id: string) {
    return this.http.delete<any>(`${environment.apiUrl}serviceTemplate/${id}`);
  }

  /**
   * Récupérer tous les serviceTemplates d'une boutique par ID de la boutique
   * @param shopId (ID de la boutique)
   */
  getByCategory(type: string) {
    return this.http.get<any[]>(`${environment.apiUrl}shop/${type}/serviceTemplates`);
  }
}
