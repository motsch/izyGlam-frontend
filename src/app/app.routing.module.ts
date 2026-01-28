import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { GuestGuard } from './core/services/guest-guard.service';
import { HomeComponent } from './auth/home/home.component';
import { MainComponent } from './pages/main/main.component';

const appRoutes: Routes = [
  {
    path: '',
    component: HomeComponent,
    pathMatch: 'full',
    canActivate: [GuestGuard],
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes, {
      useHash: true,
      scrollPositionRestoration: 'top', // 👈 toujours en haut à chaque changement de page
      anchorScrolling: 'enabled',       // (optionnel) utile si tu utilises des liens #ancre
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
