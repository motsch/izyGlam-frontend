import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ReviewsModalData {
  shop: any | null;
}

@Injectable({ providedIn: 'root' })
export class ReviewsModalService {
  private _state$ = new BehaviorSubject<ReviewsModalData>({ shop: null });
  state$ = this._state$.asObservable();

  open(shop: any) {
    this._state$.next({ shop });
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
  }

  close() {
    this._state$.next({ shop: null });
    document.body.style.overflow = '';
    document.body.classList.remove('modal-open');
  }

  get current(): ReviewsModalData {
    return this._state$.getValue();
  }
}
