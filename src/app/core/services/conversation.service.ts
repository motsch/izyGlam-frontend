// src/app/services/conversation.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ConversationService {
  private baseUrl = environment.apiUrl; // ex: http://localhost:3000/api/

  constructor(private http: HttpClient) { }

  /**
   * Récupérer la conversation du support ou la créer
   */
  getOrCreateSupportConversation(language: string, userId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}support`, { params: { language, userId } });
  }

  /**
   * Envoyer un message au support
   */
  // ✅ Peut recevoir { conversationId?, content, messageType, clientId, language }
  sendMessageToSupport(messageData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}support/message`, messageData);
  }

  /**
   * Récupérer toutes les conversations
   */
  getAllConversations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}conversation`);
  }

  getAllSupportConversations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}support-conversation`);
  }

  /**
   * Récupérer une conversation par ID
   */
  getConversationById(id: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}conversation/${id}`);
  }

  /**
   * Créer une nouvelle conversation
   */
  createConversation(conversationData: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}conversation`, conversationData);
  }

  /**
   * Ajouter un message à une conversation
   */
  addMessage(conversationId: string, payload: any): Observable<any> {
    // ⚠️ retiré le "/" en trop dans ton code original
    return this.http.post<any>(`${this.baseUrl}conversation/${conversationId}/message`, payload);
  }

  deleteConversation(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}conversation/${id}`);
  }

  deleteMessage(conversationId: string, messageId: string): Observable<any> {
    return this.http.delete<any>(
      `${this.baseUrl}conversation/${conversationId}/message/${messageId}`
    );
  }

  inviteUser(conversationId: string, userId: string): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}conversation/${conversationId}/invite`,
      { userId }
    );
  }

  getOrCreateConversationByUserId(userId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}conversation-user/${userId}`);
  }

  getByEmail(email: string, userEmail: string) {
    return this.http.put<any>(`${this.baseUrl}conversation-email/${email}`, { userEmail });
  }

  /**
   * Récupérer toutes les conversations liées à un utilisateur
   * @param type "user" | "pro"
   * @param id userId
   */
  getConversationsByType(type: 'user' | 'pro', id: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.baseUrl}conversation-by-type/user/${type}/${id}`
    );
  }

}
