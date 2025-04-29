import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root',
})
export class WebSocketService {
    private socket: WebSocket;

    constructor() {
        this.socket = new WebSocket(environment.webSocketUrl); // Remplacez par votre URL WebSocket

        this.socket.onopen = (event) => {
            console.log('WebSocket connecté:', event);
        };

        this.socket.onclose = (event) => {
            console.log('WebSocket déconnecté:', event);
        };

        this.socket.onerror = (error) => {
            console.error('Erreur WebSocket:', error);
        };
    }

    /**
     * Publie un message via WebSocket
     * @param message un objet ou string à envoyer
     */
    public send(message: any): void {
        const payload = typeof message === 'string' ? message : JSON.stringify(message);
        this.socket.send(payload);
        console.log('📢 Message envoyé:', payload);
    }

    /**
     * S'abonne aux messages WebSocket
     * @returns un Observable contenant les messages reçus
     */
    public observe(): Observable<any> {
        return new Observable((observer: Observer<any>) => {
            this.socket.onmessage = (event) => {
                observer.next(event.data);
            };

            return () => {
                this.socket.close();
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
