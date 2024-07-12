import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { GuestGuard } from '../core/services/guest-guard.service';
import { SignInComponent } from './sign-in/sign-in.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { VerifSmsCodeComponent } from './verif-sms-code/verif-sms-code.component';
import { HomeComponent } from './home/home.component';
import { SignInSmsComponent } from './sign-in-sms/sign-in-sms.component';
import { ForgetPasswordComponent } from './forget-password/forget-password.component';

const routes: Routes = [
    { path: 'home', component: HomeComponent, canActivate: [GuestGuard] },
    { path: 'sign-in', component: SignInComponent, canActivate: [GuestGuard] },
    {
        path: 'sign-in-sms',
        component: SignInSmsComponent,
        canActivate: [GuestGuard],
    },
    { path: 'sign-up', component: SignUpComponent, canActivate: [GuestGuard] },
    {
        path: 'sms-verif',
        component: VerifSmsCodeComponent,
        canActivate: [GuestGuard],
    },
    {
        path: 'forget-password',
        component: ForgetPasswordComponent,
        canActivate: [GuestGuard],
    },
    { path: '', redirectTo: '/home', pathMatch: 'full' },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AuthRoutingModule {}
