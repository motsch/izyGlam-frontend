import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ShopTemplateService {

  constructor(private http: HttpClient) {}

  getUniqueServiceTemplatesByType() {
    return this.http.get<any[]>(`${environment.apiUrl}serviceTemplateUniqueByType`);
  }

  // Créer un nouveau serviceTemplate
  createServiceTemplate(serviceTemplate: any) {
    return this.http.get<any[]>(`${environment.apiUrl}serviceTemplate`, serviceTemplate);
  }

  // Récupérer tous les serviceTemplates
  getAllServiceTemplates() {
    return this.http.get<any[]>(`${environment.apiUrl}serviceTemplate`);
  }

  // Récupérer un serviceTemplate par ID
  getServiceTemplateById(id: string) {
    return this.http.get<any[]>(`${environment.apiUrl}serviceTemplate/${id}`);
  }

  // Mettre à jour un serviceTemplate par ID
  updateServiceTemplateById(id: string, serviceTemplate: any) {
    return this.http.get<any[]>(`${environment.apiUrl}serviceTemplate/${id}`, serviceTemplate);
  }

  // Supprimer un serviceTemplate par ID
  deleteServiceTemplateById(id: string) {
    return this.http.get<any[]>(`${environment.apiUrl}serviceTemplate/${id}`);
  }

  // Récupérer tous les serviceTemplates d'une catégorie spécifique
  getServiceTemplatesByCategory(type: string) {
    return this.http.get<any[]>(`${environment.apiUrl}shop/${type}/serviceTemplates`);
  }
}
