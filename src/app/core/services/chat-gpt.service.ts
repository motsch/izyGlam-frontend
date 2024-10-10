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


  // Ajout de l'historique dans la requête
  sendMessage(prompt: string, history: any[]): Observable<any> {
    const body = { prompt, history };  // Envoie du message et de l'historique
    return this.http.post<any>(this.apiUrl, body);
  }
}
