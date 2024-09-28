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
import { AgendaComponent } from './component/agenda/agenda.component';
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
        MatSelectModule,
        MatMenuModule,
        MatTooltipModule,
        MatIconModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatAutocompleteModule,
        MatSelectModule,
        RouterModule,
        FullCalendarModule,
        MatChipsModule,
        MatDialogModule,
        MatToolbarModule,
        MatDatepickerModule,
        MatNativeDateModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient],
            },
        }),
        BrowserAnimationsModule,
        MatListModule,
        MatSidenavModule,
        MatButtonModule,
        ReactiveFormsModule,
        CalendarModule.forRoot({
            provide: DateAdapter,
            useFactory: adapterFactory,
        }),
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient],
            },
        }),
    ],
    declarations: [
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
        ProfileInformationsComponent,
        FinanceComponent,
        AdminComponent,
        ShopArticlesManagementComponent,
        CompanySetDefaultPasswordComponent,
        ShopManagementComponent,
        CompanyManagementComponent,
        OrderItemComponent,
        CreditEmployeeModalComponent,
        CompanySetDefaultPasswordComponent,
        CompanyFinanceManagementComponent,
        ShopArticlesManagementComponent,
        OrderItemComponent,
        CreateShopComponent,
        CreateShopStepsComponent,
        CreateCompanyComponent,
        CreateCompanyStepComponent,
        AgendaComponent,
        NewShopModalComponent,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    exports: [
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
        CreateShopStepsComponent,
        CreateCompanyComponent,
        CreateCompanyStepComponent,
        NewShopModalComponent,
        AgendaComponent,
    ],
    providers: [SessionService, ModalYesNoComponent, DatePipe],
})
export class CoreModule {}
