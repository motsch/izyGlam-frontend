import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

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
import { ShopItemCardComponent } from './component/shop-item-card/shop-item-card.component';
import { MatDialogModule } from '@angular/material/dialog';
import { AddressModalComponent } from './component/address-modal/address-modal.component';
import { RoundShopCardComponent } from './component/round-shop-card/round-shop-card.component';
import { RdvModalComponent } from './component/rdv-modal/rdv-modal.component';
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
// AoT requires an exported function for factories
export function HttpLoaderFactory(httpClient: HttpClient) {
    return new TranslateHttpLoader(httpClient);
}

/**
 * Core module pour la déclaration des services, des pipes et des constantes
 */
@NgModule({
    imports: [
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
        MatSelectModule,
        RouterModule,
        MatChipsModule,
        MatDialogModule,
        MatToolbarModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient],
            },
        }),
        NgbModule,
        BrowserAnimationsModule,
        MatListModule,
        MatSidenavModule,
        MatButtonModule,
        ReactiveFormsModule,
        CalendarModule.forRoot({ provide: DateAdapter, useFactory: adapterFactory }),
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
        FooterComponent,
        ShopCardComponent,
        ShopItemCardComponent,
        AddressModalComponent,
        RoundShopCardComponent,
        RdvModalComponent,
    ],
    exports: [
        PageNotFoundComponent,
        HeaderComponent,
        ModalYesNoComponent,
        TruncatePipe,
        FilterByString,
        HeaderComponent,
        FooterComponent,
        ShopCardComponent,
        ShopItemCardComponent,
        RoundShopCardComponent,
    ],
    providers: [SessionService, ModalYesNoComponent],
})
export class CoreModule {}
