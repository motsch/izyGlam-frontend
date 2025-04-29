import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WebSocketService } from './websocket.service'; // Assurez-vous d'importer le nouveau service

@Injectable({
  providedIn: 'root',
})
export class MqttService {
  constructor(private webSocketService: WebSocketService) { }

  /**
   * Publie un message via WebSocket
   * @param topic le nom du topic (ex: 'maison/temperature')
   * @param message un objet ou string à envoyer
   */
  public publish(topic: string, message: any): void {
    const payload = { topic, message: typeof message === 'string' ? message : JSON.stringify(message) };
    this.webSocketService.send(payload);
    console.log(`📢 Message envoyé sur ${topic}:`, payload);
  }

  /**
   * S'abonne aux messages WebSocket
   * @returns un Observable contenant les messages reçus
   */
  public subscribe(): Observable<any> {
    console.log('📡 Abonnement aux messages WebSocket...');
    return this.webSocketService.observe();
  }

  /**
   * Ferme la connexion WebSocket
   */
  public logout(): void {
    this.webSocketService.close();
  }
}
