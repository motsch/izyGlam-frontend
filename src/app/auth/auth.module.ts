import { CoreModule, HttpLoaderFactory } from '../core/core.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthRoutingModule } from './auth-routing.module';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { PagesRoutingModule } from '../pages/pages-routing.module';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { AboutComponent } from './about/about.component';
import { FeatureComponent } from './feature/feature.component';
import { HowItWorkComponent } from './how-it-work/how-it-work.component';
import { TestimonialComponent } from './testimonial/testimonial.component';
import { DownloadComponent } from './download/download.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { SignInComponent } from './sign-in/sign-in.component';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { IntroComponent } from './intro/intro.component';
import { RouterModule } from '@angular/router';
import { VerifSmsCodeComponent } from './verif-sms-code/verif-sms-code.component';
import { HomeComponent } from './home/home.component';
import { SignInSmsComponent } from './sign-in-sms/sign-in-sms.component';
import { ForgetPasswordComponent } from './forget-password/forget-password.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
    imports: [
        BrowserAnimationsModule,
        CommonModule,
        AuthRoutingModule,
        PagesRoutingModule,
        FormsModule,
        MatListModule,
        CoreModule,
        MatSidenavModule,
        MatSelectModule,
        MatButtonModule,
        MatMenuModule,
        MatIconModule,
        MatAutocompleteModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        CarouselModule,
        MatIconModule,
        MatToolbarModule,
        NgbDropdownModule,
        MatTooltipModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient],
            },
        }),
    ],
    declarations: [
        AboutComponent,
        FeatureComponent,
        HowItWorkComponent,
        TestimonialComponent,
        DownloadComponent,
        SignUpComponent,
        SignInComponent,
        HomeComponent,
        IntroComponent,
        VerifSmsCodeComponent,
        SignInSmsComponent,
        ForgetPasswordComponent,
    ],
    exports: [RouterModule],
})
export class AuthModule {}
