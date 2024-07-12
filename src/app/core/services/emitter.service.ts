import { Injectable, EventEmitter, Output } from '@angular/core';
import { Global } from '../global';

/**
 * Emitter service
 */
@Injectable({
  providedIn: 'root'
})
export class EmitterService {

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    @Output() fire: EventEmitter<any> = new EventEmitter();

    /* peut emitter pour le loading et pour les erreurs */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    change(loadingOuErreur: any) {
      Global.activeLoading = loadingOuErreur;
        this.fire.emit(loadingOuErreur);
   }

    getEmittedValue() {
        return this.fire;
    }
}
