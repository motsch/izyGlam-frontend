import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class DrawerService {
    private drawerOpen = new BehaviorSubject<boolean>(false);

    getDrawerState(): Observable<boolean> {
        return this.drawerOpen.asObservable();
    }

    toggleDrawer() {
        this.drawerOpen.next(!this.drawerOpen.value);
    }

    openDrawer() {
        this.drawerOpen.next(true);
        console.log('open drawer => service');
    }

    closeDrawer() {
        this.drawerOpen.next(false);
    }
}
