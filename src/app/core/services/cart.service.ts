import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class CartService {
    private cartOpen = new BehaviorSubject<boolean>(false);

    getCartState(): Observable<boolean> {
        return this.cartOpen.asObservable();
    }

    toggleCart() {
        this.cartOpen.next(!this.cartOpen.value);
    }

    openCart() {
        this.cartOpen.next(true);
        console.log('open drawer => service');
    }

    closeCart() {
        this.cartOpen.next(false);
    }
}
