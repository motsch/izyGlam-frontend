import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { GuestGuard } from '../core/services/guest-guard.service';
import { SignInComponent } from './sign-in/sign-in.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { HomeComponent } from './home/home.component';
import { ForgetPasswordComponent } from './forget-password/forget-password.component';
import { CguComponent } from './cgu/cgu.component';
import { MetaLoginComponent } from './meta-login/meta-login.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { ThreadLoginComponent } from './thread-login/thread-login.component';

const routes: Routes = [
    { path: 'home', component: HomeComponent, canActivate: [GuestGuard] },
    { path: 'sign-in', component: SignInComponent, canActivate: [GuestGuard] },
    { path: 'sign-up', component: SignUpComponent, canActivate: [GuestGuard] },
    { path: 'meta-login', component: MetaLoginComponent, canActivate: [GuestGuard] },
    { path: 'thread-login', component: ThreadLoginComponent },
    { path: 'forget-password', component: ForgetPasswordComponent, canActivate: [GuestGuard] },
    { path: 'reset-password', component: ResetPasswordComponent, canActivate: [GuestGuard] },
    { path: 'cgu', component: CguComponent, canActivate: [GuestGuard] },
    { path: '', redirectTo: '/home', pathMatch: 'full' },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AuthRoutingModule {}
