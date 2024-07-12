/*import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MqttCallback, MqttCallbackFunc } from '../interfaces/mqttCallback.interface';

import { environment } from 'src/environnements/environment';
import { Client, connect as MqttConnect, IClientOptions } from 'mqtt/dist/mqtt';
import { v4 as uuid } from 'uuid';

@Injectable({
  providedIn: 'root',
})
export class MqttService {
  private client: Client | undefined;
  private topicSubscriptions: Map<string, MqttCallback[]> = new Map<string, MqttCallback[]>();
  private static CALLBACK_ID = 0;

  connectToBroker(): Observable<boolean> {
    const brokerUrl = environment.mqttBrokerUrl;
    const opts: IClientOptions = {
      clientId: environment.mqttClientIdPrefix + uuid(),
      username: environment.mqttUserName,
      password: environment.mqttPassword
    }

    this.client = MqttConnect(brokerUrl, opts);

    return new Observable<boolean>(observer => {
      if (this.client) {
        this.client.on('connect', () => {
          console.log('Connected to MQTT broker');
          observer.next(true);
          observer.complete();
        });
    
        this.client.on('error', (error:any) => {
          console.error('MQTT connection error', error);
          observer.next(false);
          observer.complete();
        });
      } else {
        observer.next(false);
        observer.complete();
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  publishMessage(payload: any) {
    if (this.client) {
      // Publier un message
      this.client.publish(payload.topic, payload.message);
    } else {
      console.error("MQTT client is not initialized.");
    }
  }

  subscribe(topic: string, callbackFunc: MqttCallbackFunc): MqttCallback | null {
    if(this.client == null) {
      console.error("The MQTT client isn't created while trying to subscribe to the topic " + topic);
      return null;
    }
    const callback: MqttCallback = {
      id: MqttService.CALLBACK_ID++,
      callback: callbackFunc
    }
    if (this.topicSubscriptions.has(topic)) {
      const callbacks = this.topicSubscriptions.get(topic);
      if(callbacks) {
        callbacks.push(callback);
      }
    } else {
      this.topicSubscriptions.set(topic, [callback]);

      this.client.subscribe(topic);

      this.client.on('message', (receivedTopic, message) => {
        if (receivedTopic === topic) {
          const callbacks = this.topicSubscriptions.get(topic);
          callbacks?.forEach((cb) => cb.callback(message));
        }
      });
    }
    return callback;
  }

  unsubscribe(topic: string, callback: MqttCallback): void {
    if (this.client === null) {
      console.error("The MQTT client isn't created while trying to unsubscribe to the topic " + topic);
      return;
    }
  
    if (this.topicSubscriptions.has(topic)) {
      const callbacks = this.topicSubscriptions.get(topic);
      
      if (callbacks) {
        const updatedCallbacks = callbacks.filter((cb) => cb.id !== callback.id);
        this.topicSubscriptions.set(topic, updatedCallbacks);
  
        if (this.client && updatedCallbacks.length === 0) {
          this.client.unsubscribe(topic);
        }
      }
    }
  }

}
*/