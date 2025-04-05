import { Injectable } from '@angular/core';
import { IMqttMessage, MqttService as NgxMqttService } from 'ngx-mqtt';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MqttService {
  constructor(private mqttService: NgxMqttService) {}

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
}
