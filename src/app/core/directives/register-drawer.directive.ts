import { AfterViewInit, Directive, OnDestroy, Host } from '@angular/core';
import { MatDrawer } from '@angular/material/sidenav';
import { DrawerService } from 'src/app/core/services/drawer.service';

@Directive({
  selector: '[appRegisterDrawer]',
})
export class RegisterDrawerDirective implements AfterViewInit, OnDestroy {
  constructor(@Host() private drawer: MatDrawer, private drawerService: DrawerService) {}

  ngAfterViewInit(): void {
    // Le <mat-drawer> vient d’être instancié → on enregistre
    this.drawerService.setDrawer(this.drawer);
  }

  ngOnDestroy(): void {
    // Le <mat-drawer> est détruit (ex: *ngIf repasse à false) → on nettoie
    this.drawerService.clearDrawer();
  }
}
