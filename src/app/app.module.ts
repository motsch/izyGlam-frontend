import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppComponent } from './app.component';
import { CommonModule, registerLocaleData } from '@angular/common';
import {
    HttpClientModule,
    HttpClient,
    HTTP_INTERCEPTORS,
} from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';
import { AuthModule } from './auth/auth.module';
import { CoreModule, HttpLoaderFactory } from './core/core.module';
import { AlertService } from './core/services/alert.service';
import { AuthGuard } from './core/services/auth-guard.service';
import { GuestGuard } from './core/services/guest-guard.service';
import { InterceptorService } from './core/services/interceptor.service';
import { SessionService } from './core/services/session.service';
import localeFr from '@angular/common/locales/fr';
import { UnauthorizedInterceptorService } from './core/services/unauthorizeInterceptor.service';
import { WebsocketService } from './core/services/websocket.service';
import { PagesModule } from './pages/pages.module';
import { AppRoutingModule } from './app.routing.module';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { NgxSpinnerModule } from 'ngx-spinner';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { WINDOW, windowFactory } from './core/services/windows.service';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialogModule } from '@angular/material/dialog';
registerLocaleData(localeFr, 'fr');
import { CalendarModule, DateAdapter } from 'angular-calendar';
import { adapterFactory } from 'angular-calendar/date-adapters/date-fns';
import { NgxQrcodeStylingModule } from 'ngx-qrcode-styling';

@NgModule({
    declarations: [AppComponent],
    imports: [
        CommonModule,
        NgbModule,
        BrowserModule,
        HttpClientModule,
        FormsModule,
        NgxQrcodeStylingModule,
        RouterModule,
        ReactiveFormsModule,
        AppRoutingModule,
        CoreModule,
        AuthModule,
        MatDialogModule,
        PagesModule,
        BrowserAnimationsModule,
        NgxSpinnerModule,
        MatSidenavModule,
        MatListModule,
        MatAutocompleteModule,
        MatIconModule,
        MatFormFieldModule,
        CalendarModule.forRoot({ provide: DateAdapter, useFactory: adapterFactory }),
        MatSelectModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient],
            },
        }),
    ],
    providers: [
        { provide: WINDOW, useFactory: windowFactory },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: InterceptorService,
            multi: true,
        },
        {
            provide: HTTP_INTERCEPTORS,
            useClass: UnauthorizedInterceptorService,
            multi: true,
        },
        AuthGuard,
        GuestGuard,
        SessionService,
        AlertService,
        WebsocketService,
    ],
    bootstrap: [AppComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
