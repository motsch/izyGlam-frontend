import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class WebSocketService {
    private socket: WebSocket | null = null; // Initialisation à null
    private reconnectInterval = 5000; // Délai de reconnexion en millisecondes
    private maxReconnectAttempts = 5; // Nombre maximum de tentatives de reconnexion
    private reconnectAttempts = 0;

    constructor() {
        this.connect();
    }

    private connect() {
        this.socket = new WebSocket(environment.webSocketUrl); // Remplacez par votre URL WebSocket

        this.socket.onopen = (event) => {
            console.log('WebSocket connecté:', event);
            this.reconnectAttempts = 0; // Réinitialiser les tentatives de reconnexion
        };

        this.socket.onclose = (event) => {
            console.log('WebSocket déconnecté:', event);
            this.handleReconnect();
        };

        this.socket.onerror = (error) => {
            console.error('Erreur WebSocket:', error);
            this.handleReconnect();
        };
    }

    private handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            console.log(`Tentative de reconnexion ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts}`);
            this.reconnectAttempts++;
            setTimeout(() => {
                this.connect();
            }, this.reconnectInterval);
        } else {
            console.error('Nombre maximum de tentatives de reconnexion atteint. Arrêt des tentatives.');
        }
    }

    /**
     * Publie un message via WebSocket
     * @param message un objet ou string à envoyer
     */
    public send(message: any): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            const payload = typeof message === 'string' ? message : JSON.stringify(message);
            this.socket.send(payload);
            console.log('📢 Message envoyé:', payload);
        } else {
            console.error('WebSocket non connecté. Impossible d\'envoyer le message.');
        }
    }

    /**
     * S'abonne aux messages WebSocket
     * @returns un Observable contenant les messages reçus
     */
    public observe(): Observable<any> {
        return new Observable((observer: Observer<any>) => {
            if (this.socket) {
                this.socket.onmessage = (event) => {
                    observer.next(event.data);
                };
            }

            return () => {
                if (this.socket) {
                    this.socket.close();
                }
            };
        });
    }

    /**
     * Ferme la connexion WebSocket
     */
    public close(): void {
        if (this.socket) {
            this.socket.close();
            console.log('🔌 Déconnexion du WebSocket...');
        }
    }
}
