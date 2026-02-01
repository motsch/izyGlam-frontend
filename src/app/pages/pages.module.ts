import { CoreModule, HttpLoaderFactory } from '../core/core.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSliderModule } from '@angular/material/slider';
import { MatStepperModule } from '@angular/material/stepper';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MainComponent } from './main/main.component';
import { ProfileComponent } from './profile/profile.component';
import { ShopComponent } from './shop/shop.component';
import { ThankYouComponent } from './thank-you/thank-you.component';
import { ComingSoonComponent } from './coming-soon/coming-soon.component';
import { AuthModule } from '../auth/auth.module';
import { MatDialogModule } from '@angular/material/dialog';
import { PayementComponent } from './payement/payement.component';
import { OrdersComponent } from './orders/orders.component';
import { HelpComponent } from './help/help.component';
import { FavoritesComponent } from './favorites/favorites.component';
import { GiftCardComponent } from './gift-card/gift-card.component';
import { InviteFriendsComponent } from './invite-friends/invite-friends.component';
import { CreationShopComponent } from './creation-shop/creation-shop.component';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { CreationCompanyComponent } from './creation-company/creation-company.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SponsorComponent } from './sponsor/sponsor.component';
import { FidelityComponent } from './fidelity/fidelity.component';
import { PricePlansComponent } from './price-plans/price-plans.component';
import { QRCodeModule } from 'angularx-qrcode';
import { PayementProComponent } from './payement-pro/payement-pro.component';
import { PayementValidationComponent } from './payement-validation/payement-validation.component';
import { VerifyEmailComponent } from './verify-email/verify-email.component';
import { MessageComponent } from './message/message.component';
import { QuickComponent } from './quick/quick.component';
import { BillingComponent } from './billing/billing.component';
import { IzyPhoneInfoComponent } from './izyPhone-info/izyPhone-info.component';
import { SubscriptionComponent } from './subscription/subscription.component';
@NgModule({
    imports: [
        BrowserAnimationsModule,
        NgxSkeletonLoaderModule,
        CommonModule,
        BrowserModule,
        CoreModule,
        FormsModule,
        AuthModule,
        NgbModule,
        MatMenuModule,
        MatSnackBarModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule,
        MatSlideToggleModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatButtonModule,
        QRCodeModule,
        MatSelectModule,
        MatDialogModule,
        MatCardModule,
        MatExpansionModule,
        DragDropModule,
        ReactiveFormsModule,
        MatListModule,
        MatButtonToggleModule,
        MatProgressBarModule,
        MatChipsModule,
        MatRadioModule,
        MatStepperModule,
        MatSidenavModule,
        MatCheckboxModule,
        MatSliderModule,
        MatTabsModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient],
            },
        }),
    ],
    declarations: [
        MainComponent,
        ProfileComponent,
        ShopComponent,
        ThankYouComponent,
        BillingComponent,
        ComingSoonComponent,
        MessageComponent,
        QuickComponent,
        PayementValidationComponent,
        PayementComponent,
        IzyPhoneInfoComponent,
        PayementProComponent,
        OrdersComponent,
        HelpComponent,
        VerifyEmailComponent,
        FavoritesComponent,
        SponsorComponent,
        GiftCardComponent,
        InviteFriendsComponent,
        CreationShopComponent,
        CreationCompanyComponent,
        IzyPhoneInfoComponent,
        FidelityComponent,
        PricePlansComponent,
        SubscriptionComponent,
    ],
    exports: [CreationShopComponent, IzyPhoneInfoComponent, CreationCompanyComponent],
})
export class PagesModule {}
