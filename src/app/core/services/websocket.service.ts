import { Injectable } from "@angular/core";
import { Observable, Subject,Observer } from 'rxjs';
/**
 * Service pour connection en websocket
 */
@Injectable()
export class WebsocketService {

    private subject: Subject<MessageEvent> | null | undefined;

    private ws: WebSocket | undefined;

    public connect(url: string | URL): Subject<MessageEvent> {
        if (!this.subject) {
            this.subject = this.create(url);
        }
        return this.subject;
    }

    private create(url: string | URL): Subject<MessageEvent> {
        this.ws = new WebSocket(url);

        const observable = Observable.create((obs: Observer<MessageEvent>) => {
            if(this.ws) {
                this.ws.onmessage = obs.next.bind(obs);
                this.ws.onerror = obs.error.bind(obs);
                this.ws.onclose = obs.complete.bind(obs);
                return this.ws.close.bind(this.ws);
            }
            return;
        });

        const observer = {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            next: (data: any) => {
                if (this.ws?.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify(data));
                }
            }
        };

        return Subject.create(observer, observable);
    }

    public close() {
        if (this.ws) {
            this.ws.close();
            this.subject = null;
        }
    }

}
