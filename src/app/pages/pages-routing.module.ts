import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '../core/services/auth-guard.service';
import { MainComponent } from './main/main.component';
import { ProfileComponent } from './profile/profile.component';
import { ShopComponent } from './shop/shop.component';
import { TermsComponent } from './terms/terms.component';
import { ThankYouComponent } from './thank-you/thank-you.component';
import { GuestGuard } from '../core/services/guest-guard.service';
import { ComingSoonComponent } from './coming-soon/coming-soon.component';
import { PayementComponent } from './payement/payement.component';
import { OrdersComponent } from './orders/orders.component';
import { HelpComponent } from './help/help.component';
import { FavoritesComponent } from './favorites/favorites.component';
import { GiftCardComponent } from './gift-card/gift-card.component';
import { InviteFriendsComponent } from './invite-friends/invite-friends.component';

const routes: Routes = [
    {
        path: 'main',
        component: MainComponent,
        canActivate: [],
    },
    { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
    {
        path: 'shop/:id',
        component: ShopComponent,
        canActivate: [],
    },
    { path: 'terms', component: TermsComponent, canActivate: [AuthGuard] },
    {
        path: 'coming-soon/:country',
        component: ComingSoonComponent,
        canActivate: [GuestGuard],
    },
    {
        path: 'thank-you',
        component: ThankYouComponent,
        canActivate: [AuthGuard],
    },
    {
        path: 'billing',
        component: PayementComponent,
        canActivate: [AuthGuard],
    },
    {
        path: 'orders',
        component: OrdersComponent,
        canActivate: [AuthGuard],
    },
    {
        path: 'help',
        component: HelpComponent
    },
    {
        path: 'favorites',
        component: FavoritesComponent,
        canActivate: [AuthGuard],
    },
    {
        path: 'gift-card',
        component: GiftCardComponent,
        canActivate: [AuthGuard],
    },
    {
        path: 'invite-friends',
        component: InviteFriendsComponent,
        canActivate: [AuthGuard],
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class PagesRoutingModule {}
