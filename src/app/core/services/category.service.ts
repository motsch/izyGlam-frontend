import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  constructor(private http: HttpClient) {}

  // Créer une nouvelle catégorie
  create(category: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/category`, category);
  }

  // Récupérer toutes les catégories
  getAll(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/category`);
  }

  // Récupérer une catégorie par ID
  getById(id: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/category/${id}`);
  }

  // Mettre à jour une catégorie par ID
  updateById(id: string, category: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/category/${id}`, category);
  }

  // Supprimer une catégorie par ID
  deleteById(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/category/${id}`);
  }

  // Récupérer les catégories disponibles en fonction des shops filtrés par géolocalisation ou codes postaux
  getAvailableCategories(lat?: number, lon?: number, codes?: string[]): Observable<any[]> {
    let url = `${environment.apiUrl}category/available?`;

    // On ajoute lat/lon si fournis
    if (lat && lon) {
      url += `lat=${lat}&lon=${lon}`;
    }

    // On ajoute codes si fournis
    if (codes && codes.length > 0) {
      url += `codes=${codes.join(',')}`;
    }

    return this.http.get<any[]>(url);
  }
}
