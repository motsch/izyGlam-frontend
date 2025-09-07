import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  constructor(private http: HttpClient) { }

  // Récupérer les paramètres administratifs
  getAdminSettings(): Observable<any> {
    return this.http.get(`${environment.apiUrl}admin-settings`);
  }

  // Créer ou initialiser les paramètres administratifs
  createAdminSettings(settings: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}admin-settings`, settings);
  }

  // Mettre à jour les paramètres administratifs
  updateAdminSettings(settings: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}admin-settings`, settings);
  }

  // Supprimer les paramètres administratifs
  deleteAdminSettings(): Observable<any> {
    return this.http.delete(`${environment.apiUrl}admin-settings`);
  }
}