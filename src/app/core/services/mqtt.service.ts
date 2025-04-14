import { Injectable } from '@angular/core';
import { IMqttMessage, MqttService as NgxMqttService } from 'ngx-mqtt';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MqttService {
  constructor(private mqttService: NgxMqttService) { }

  /**
   * Publie un message sur un topic MQTT
   * @param topic le nom du topic (ex: 'maison/temperature')
   * @param message un objet ou string à envoyer
   */
  public publish(topic: string, message: any): void {
    const payload = typeof message === 'string' ? message : JSON.stringify(message);

    this.mqttService.unsafePublish(topic, payload, {
      qos: 1,
      retain: false,
    });

    console.log(`📢 Message envoyé sur ${topic}:`, payload);
  }

  /**
   * S'abonne à un topic MQTT
   * @param topic le nom du topic (ex: 'maison/temperature')
   * @returns un Observable contenant les messages reçus
   */
  public subscribe(topic: string): Observable<IMqttMessage> {
    console.log(`📡 Abonnement au topic: ${topic}`);
    return this.mqttService.observe(topic);
  }

  /**
 * Getter privé pour accéder au client MQTT malgré sa propriété private
 */
  private get mqttClient() {
    // 🛑 Astuce un peu "hacky" mais safe ici pour accéder au client MQTT interne
    // car la lib ngx-mqtt ne fournit pas encore d'accès public.
    return (this.mqttService as any).client;
  }

  /**
   * Se désabonne de tous les topics MQTT
   */
  public unsubscribeAll(): void {
    const client = this.mqttClient;
    if (client && client.unsubscribe) {
      console.log('🚫 Désabonnement de tous les topics...');
      client.unsubscribe('#'); // '#' = wildcard pour tous les topics
    } else {
      console.warn('⚠️ Le client MQTT n\'est pas initialisé ou ne supporte pas unsubscribe.');
    }
  }

  /**
   * Ferme la connexion MQTT
   */
  public logout(): void {
    const client = this.mqttClient;
    if (client && client.end) {
      console.log('🔌 Déconnexion du client MQTT...');
      client.end(true); // true = force la déconnexion immédiate
    } else {
      console.warn('⚠️ Le client MQTT n\'est pas initialisé ou ne supporte pas end().');
    }
  }
}
