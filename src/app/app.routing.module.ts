import { Routes, RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { GuestGuard } from './core/services/guest-guard.service';
import { HomeComponent } from './auth/home/home.component';

const appRoutes: Routes = [
    {
        path: '',
        component: HomeComponent,
        pathMatch: 'full',
        canActivate: [GuestGuard],
    },
];

@NgModule({
    imports: [RouterModule.forRoot(appRoutes, { useHash: true })],
})
export class AppRoutingModule {}
