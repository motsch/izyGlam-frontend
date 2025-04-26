import { Injectable } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class DrawerService {
    private drawer!: MatDrawer;
    private drawerOpen = new BehaviorSubject<boolean>(false);

    getDrawerState(): Observable<boolean> {
        return this.drawerOpen.asObservable();
    }

    setDrawer(drawer: MatDrawer) {
        this.drawer = drawer;
    }

    toggleDrawer() {
        if (this.drawer) {
            this.drawer.toggle();
        }
    }

    openDrawer() {
        if (this.drawer) {
            this.drawer.open();
            console.log('open drawer => service');
        }
    }

    closeDrawer() {
        if (this.drawer) {
            this.drawer.close();
        }
    }
}
