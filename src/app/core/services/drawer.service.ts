import { Injectable } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';
import { take } from 'rxjs/operators';

let __drawerServiceInstanceCounter = 0;

@Injectable({ providedIn: 'root' })
export class DrawerService {
  private readonly instanceId = ++__drawerServiceInstanceCounter;

  private drawer?: MatDrawer;
  private ready$ = new ReplaySubject<MatDrawer>(1);
  private drawerOpen$ = new BehaviorSubject<boolean>(false);

  constructor() {
    console.log(`[DrawerService#${this.instanceId}] constructed`);
    if (this.instanceId > 1) {
      console.error(
        `[DrawerService] ❌ Il existe ${this.instanceId} instances !`,
        'Vérifie qu’il n’y a pas un autre fichier DrawerService ou un providers:[DrawerService] dans un module lazy.'
      );
    }
  }

  getDrawerState(): Observable<boolean> {
    return this.drawerOpen$.asObservable();
  }

  setDrawer(drawer: MatDrawer) {
    if (this.drawer === drawer) return;
    this.drawer = drawer;
    console.log(`[DrawerService#${this.instanceId}] setDrawer`, drawer);
    this.ready$.next(drawer);
    this.drawerOpen$.next(drawer.opened);
    drawer.openedChange.subscribe((isOpen) => this.drawerOpen$.next(isOpen));
  }

  clearDrawer() {
    console.log(`[DrawerService#${this.instanceId}] clearDrawer`);
    this.drawer = undefined;
  }

  openDrawer() {
    if (this.drawer) {
      console.log(`[DrawerService#${this.instanceId}] open NOW`);
      this.drawer.open();
    } else {
      console.log(`[DrawerService#${this.instanceId}] open QUEUED`);
      this.ready$.pipe(take(1)).subscribe((d) => d.open());
    }
  }

  toggleDrawer() {
    if (this.drawer) {
      console.log(`[DrawerService#${this.instanceId}] toggle NOW`);
      this.drawer.toggle();
    } else {
      console.log(`[DrawerService#${this.instanceId}] toggle QUEUED`);
      this.ready$.pipe(take(1)).subscribe((d) => d.toggle());
    }
  }

  closeDrawer() {
    if (this.drawer) {
      console.log(`[DrawerService#${this.instanceId}] close NOW`);
      this.drawer.close();
    } else {
      console.log(`[DrawerService#${this.instanceId}] close QUEUED`);
      this.ready$.pipe(take(1)).subscribe((d) => d.close());
    }
  }
}
