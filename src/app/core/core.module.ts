import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { PageNotFoundComponent } from './component/page-not-found/page-not-found.component';
import { SessionService } from './services/session.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ModalYesNoComponent } from './component/modal-yes-no/modal-yes-no.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FilterByString } from './pipe/FilterByString.pipe';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { HeaderComponent } from './component/header/header.component';
import { FooterComponent } from './component/footer/footer.component';
import { TruncatePipe } from './pipe/truncate.pipe';
import { ShopCardComponent } from './component/shop-card/shop-card.component';
import { FullCalendarModule } from '@fullcalendar/angular'; // Import FullCalendar
import { ShopItemCardComponent } from './component/shop-item-card/shop-item-card.component';
import { MatDialogModule } from '@angular/material/dialog';
import { AddressModalComponent } from './component/address-modal/address-modal.component';
import { RoundShopCardComponent } from './component/round-shop-card/round-shop-card.component';
import { RdvModalComponent } from './component/rdv-modal/rdv-modal.component';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ProchesModalComponent } from './component/proches-modal/proches-modal.component';
import { ChangePasswordComponent } from './component/change-password/change-password.component';
import { ConfidentialPolicyComponent } from './component/confidential-policy/confidential-policy.component';
import { DashboardComponent } from './component/dashboard/dashboard.component';
import { ProfileInformationsComponent } from './component/profile-informations/profile-informations.component';
import { FinanceComponent } from './component/finance/finance.component';
import { AdminComponent } from './component/admin/admin.component';
import { ShopManagementComponent } from './component/shop-management/shop-management.component';
import { CompanyManagementComponent } from './component/company-management/company-management.component';
import { CreditEmployeeModalComponent } from './component/credit-employee-modal/credit-employee-modal.component';
import { CompanySetDefaultPasswordComponent } from './component/company-set-default-password/company-set-default-password.component';
import { CompanyFinanceManagementComponent } from './component/company-finance-management/company-finance-management.component';
import { ShopArticlesManagementComponent } from './component/shop-articles-management/shop-articles-management.component';
import { OrderItemComponent } from './component/order-item/order-item.component';
import { CreateShopComponent } from './component/create-shop/create-shop.component';
import { CreateShopStepsComponent } from './component/create-shop-steps/create-shop-steps.component';
import { CreateCompanyComponent } from './component/create-company/create-company.component';
import { CreateCompanyStepComponent } from './component/create-company-step/create-company-step.component';
import { NewShopModalComponent } from './component/new-shop-modal/new-shop-modal.component';
import {
    AgendaComponent,
    ContentCalendarItemDialog,
} from './component/agenda/agenda.component';
import { ShopPhotoGalleryComponent } from './component/shop-photo-gallery/shop-photo-gallery.component';
import { ChatModalComponent } from './component/chat-modal/chat-modal.component';
import { AiMarkdownPipe } from './pipe/aiMarkDown.pipe';
import { AvatarComponent } from './component/avatar/avatar.component';
import { ZombieComponent } from './component/monstres/zombie/zombie.component';
import { SurvivorComponent } from './component/monstres/surviror/survivor.component';
import { RatingModalComponent } from './component/rating-modal/rating-modal.component';
import { AdminParamComponent } from './component/admin-param/admin-param.component';
import { AdminClientsManagementComponent } from './component/admin-clients-management/admin-clients-management.component';
import { AdminShopsManagementComponent } from './component/admin-shops-management/admin-shops-management.component';
import { AdminMessagerieComponent } from './component/admin-messagerie/admin-messagerie.component';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { HorizontalShopListComponent } from './component/horizontal-shop-list/horizontal-shop-list.component';
import { HorizontalPubListComponent } from './component/horizontal-pub-list/horizontal-pub-list.component';
import { CalendarComponent } from './component/calendar/calendar.component';
import { OrderCardComponent } from './component/order-card/order-card.component';
import { ReviewModalComponent } from './component/review-modal/review-modal.component';
import { CreateShopInfoComponent } from './component/create-shop-info/create-shop-info.component';
import { ShopEmployeesComponent } from './component/shop-employees/shop-employees.component';
import { StripeCardFormComponent } from './component/stripe-card-form/stripe-card-form.component';
// AoT requires an exported function for factories
export function HttpLoaderFactory(httpClient: HttpClient) {
    return new TranslateHttpLoader(httpClient);
}

/**
 * Core module pour la déclaration des services, des pipes et des constantes
 */
@NgModule({
    imports: [
        NgbModule,
        CommonModule,
        BrowserModule,
        BrowserAnimationsModule,
        MatListModule,
        MatSidenavModule,
        MatSelectModule,
        MatButtonModule,
        MatMenuModule,
        MatTooltipModule,
        MatIconModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule,
        RouterModule,
        FullCalendarModule,
        MatChipsModule,
        MatDialogModule,
        MatToolbarModule,
        MatDatepickerModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatNativeDateModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient],
            },
        }),
        ReactiveFormsModule,
        CalendarModule.forRoot({
            provide: DateAdapter,
            useFactory: adapterFactory,
        }),
    ],    
    declarations: [
        CreateShopComponent,
        AiMarkdownPipe,
        PageNotFoundComponent,
        FilterByString,
        TruncatePipe,
        ModalYesNoComponent,
        HeaderComponent,
        ShopManagementComponent,
        AdminComponent,
        FinanceComponent,
        ProfileInformationsComponent,
        ChangePasswordComponent,
        ConfidentialPolicyComponent,
        FooterComponent,
        StripeCardFormComponent,
        CompanyManagementComponent,
        ShopCardComponent,
        ShopItemCardComponent,
        AddressModalComponent,
        RoundShopCardComponent,
        RdvModalComponent,
        ProchesModalComponent,
        CompanyFinanceManagementComponent,
        ChangePasswordComponent,
        ConfidentialPolicyComponent,
        DashboardComponent,
        CalendarComponent,
        ProfileInformationsComponent,
        FinanceComponent,
        AdminComponent,
        ShopArticlesManagementComponent,
        CompanySetDefaultPasswordComponent,
        ShopManagementComponent,
        ShopEmployeesComponent,
        CompanyManagementComponent,
        OrderItemComponent,
        CreditEmployeeModalComponent,
        CompanySetDefaultPasswordComponent,
        CompanyFinanceManagementComponent,
        ShopArticlesManagementComponent,
        OrderItemComponent,
        CreateShopInfoComponent,
        CreateShopStepsComponent,
        CreateCompanyComponent,
        CreateCompanyStepComponent,
        AgendaComponent,
        ContentCalendarItemDialog,
        NewShopModalComponent,
        ShopPhotoGalleryComponent,
        ChatModalComponent,
        AvatarComponent,
        ZombieComponent,
        SurvivorComponent,
        RatingModalComponent,
        AdminParamComponent,
        AdminClientsManagementComponent,
        AdminShopsManagementComponent,
        AdminMessagerieComponent,
        HorizontalShopListComponent,
        HorizontalPubListComponent,
        OrderCardComponent,
        ReviewModalComponent,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    exports: [
        CalendarComponent,
        PageNotFoundComponent,
        HeaderComponent,
        ShopManagementComponent,
        AdminComponent,
        FinanceComponent,
        ProfileInformationsComponent,
        ChangePasswordComponent,
        ConfidentialPolicyComponent,
        ModalYesNoComponent,
        OrderItemComponent,
        CompanyManagementComponent,
        TruncatePipe,
        CompanyFinanceManagementComponent,
        FilterByString,
        ShopArticlesManagementComponent,
        HeaderComponent,
        FooterComponent,
        CompanySetDefaultPasswordComponent,
        ShopCardComponent,
        ShopItemCardComponent,
        RoundShopCardComponent,
        DashboardComponent,
        CreateShopComponent,
        CreateShopInfoComponent,
        ShopEmployeesComponent,
        CreateShopStepsComponent,
        CreateCompanyComponent,
        CreateCompanyStepComponent,
        NewShopModalComponent,
        AgendaComponent,
        ShopPhotoGalleryComponent,
        ChatModalComponent,
        AvatarComponent,
        StripeCardFormComponent,
        ZombieComponent,
        SurvivorComponent,
        AdminParamComponent,
        AdminClientsManagementComponent,
        AdminShopsManagementComponent,
        AdminMessagerieComponent,
        HorizontalShopListComponent,
        HorizontalPubListComponent,
        OrderCardComponent,
        ReviewModalComponent,
    ],
    providers: [SessionService, ModalYesNoComponent, DatePipe],
})
export class CoreModule {}
