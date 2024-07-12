import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '../core/services/auth-guard.service';
import { MainComponent } from './main/main.component';
import { ProfileComponent } from './profile/profile.component';
import { ShopComponent } from './shop/shop.component';
import { TermsComponent } from './terms/terms.component';
import { ThankYouComponent } from './thank-you/thank-you.component';
import { GuestGuard } from '../core/services/guest-guard.service';

const routes: Routes = [
    { path: 'main', component: MainComponent, canActivate: [AuthGuard] },
    { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
    { path: 'shop', component: ShopComponent, canActivate: [AuthGuard] },
    { path: 'terms', component: TermsComponent, canActivate: [AuthGuard] },
    {
        path: 'thank-you',
        component: ThankYouComponent,
        canActivate: [AuthGuard],
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class PagesRoutingModule {}
