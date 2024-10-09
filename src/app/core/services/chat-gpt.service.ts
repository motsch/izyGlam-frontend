import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ChatGptService {

  // Met à jour l'URL de ton backend
  private apiUrl = 'http://localhost:3000/api/openai/chat'; 

  constructor(private http: HttpClient) {}

  sendMessage(prompt: string): Observable<any> {
    // Préparer les en-têtes si nécessaire (par exemple pour l'authentification)
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${token}` // Ajouter un token si nécessaire
    });

    // Appel POST vers ton backend avec le prompt
    return this.http.post<any>(this.apiUrl, { prompt }, { headers });
  }
}
