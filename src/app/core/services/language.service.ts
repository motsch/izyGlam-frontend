import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  constructor(private http: HttpClient) {}

  /**
   * Récupérer toutes les langues
   */
  getAll(): Observable<any> {
    return this.http.get<any[]>(`${environment.apiUrl}language`);
  }
  /**
   * Récupérer toutes les langues
   */
  getAllCleaned(): Observable<any> {
    return this.http.get<any[]>(`${environment.apiUrl}language-cleaned`);
  }

  /**
   * Récupérer une langue par son ID
   * @param id (ID de la langue)
   */
  getById(id: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}language/${id}`);
  }

  /**
   * Créer une nouvelle langue avec upload d'image
   * @param language (données de la langue)
   * @param file (fichier image du drapeau)
   */
  create(language: any, file?: File): Observable<any> {
    const formData = new FormData();
    formData.append('code', language.code);
    formData.append('name', language.name);
    formData.append('trad', language.trad);
    formData.append('active', language.active);
    if (file) {
      formData.append('flag', file);
    }
    return this.http.post<any>(`${environment.apiUrl}language`, formData);
  }

  /**
   * Mettre à jour une langue par son ID avec possibilité de changer l'image
   * @param id (ID de la langue)
   * @param language (données de la langue à mettre à jour)
   * @param file (fichier image du drapeau)
   */
  update(id: string, language: any, file?: File): Observable<any> {
    const formData = new FormData();
    formData.append('code', language.code);
    formData.append('name', language.name);
    formData.append('trad', language.trad);
    formData.append('active', language.active);
    if (file) {
      formData.append('flag', file);
    }

    return this.http.put<any>(`${environment.apiUrl}language/${id}`, formData);
  }

  /**
   * Supprimer une langue par son ID
   * @param id (ID de la langue à supprimer)
   */
  delete(id: string): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}language/${id}`);
  }
}
