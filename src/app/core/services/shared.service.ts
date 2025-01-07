import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class SharedService {
    private meSubject = new BehaviorSubject<any>(null); // Initialise avec null
    me$ = this.meSubject.asObservable(); // Observable pour écouter les mises à jour

    updateMe(me: any) {
        this.meSubject.next(me); // Met à jour la valeur de `me`
    }

    getCurrentMe() {
        return this.meSubject.getValue(); // Récupère la valeur actuelle de `me`
    }
}
