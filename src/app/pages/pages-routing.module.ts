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
import { CreationShopComponent } from './creation-shop/creation-shop.component';
import { CreationCompanyComponent } from './creation-company/creation-company.component';
import { SponsorComponent } from './sponsor/sponsor.component';
import { FidelityComponent } from './fidelity/fidelity.component';
import { PricePlansComponent } from './price-plans/price-plans.component';
import { SubscriptionComponent } from './subscription/subscription.component';
import { PayementProComponent } from './payement-pro/payement-pro.component';
import { PayementValidationComponent } from './payement-validation/payement-validation.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { MessageComponent } from './message/message.component';
// import { ChoiceTypeComponent } from './choice-type/choice-type.component';
import { QuickComponent } from './quick/quick.component';

const routes: Routes = [
    {
        path: 'main',
        component: MainComponent, canActivate: []
    },
    {
        path: 'quick',
        component: QuickComponent, canActivate: []
    },
    { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
    {
        path: 'shop/:handle',
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
    },
    {
        path: 'billing',
        component: PayementComponent,
        canActivate: [AuthGuard],
    },
    {
        path: 'payement-pro/:abonnement',
        component: PayementProComponent,
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
        path: 'verify-email', component: VerifyEmailComponent,
        canActivate: [GuestGuard]
    },
    {
        path: 'paiement-validation',
        component: PayementValidationComponent,
        canActivate: [AuthGuard],
    },
    {
        path: 'sponsor/:id',
        component: SponsorComponent,
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
    {
        path: 'message',
        component: MessageComponent,
        canActivate: [AuthGuard],
    },
    {
        path: 'creation-shop',
        component: CreationShopComponent,
        canActivate: [],
    },
    /*{
        path: 'choice',
        component: ChoiceTypeComponent,
        canActivate: [],
    },*/
    {
        path: 'creation-company',
        component: CreationCompanyComponent,
        canActivate: [],
    },
    {
        path: 'fidelity',
        component: FidelityComponent,
        canActivate: [],
    },
    {
        path: 'prices',
        component: PricePlansComponent,
        canActivate: [],
    },
    {
        path: 'subscription',
        component: SubscriptionComponent,
        canActivate: [],
    },
    { path: '', redirectTo: 'main', pathMatch: 'full' },
    { path: '**', redirectTo: 'main' }, // pour capturer les chemins invalides
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class PagesRoutingModule { }
