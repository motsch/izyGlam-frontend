import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DrawerService } from './core/services/drawer.service';
import { SessionService } from './core/services/session.service';
import { UserService } from './core/services/user.service';
import { Router } from '@angular/router';
import { CartService } from './core/services/cart.service';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
    drawerOpen = false;
    cartOpen = false;
    imgStorageUrl: string = environment.imgStorageUrl;
    constructor(
        public translate: TranslateService,
        public sessionService: SessionService,
        public userService: UserService,
        private drawerService: DrawerService,
        private cartService: CartService,
        private router: Router
    ) {
        translate.addLangs(['fr', 'en']);
        const sessionLangue = this.sessionService.getLang();
        if (sessionLangue) {
            translate.setDefaultLang(sessionLangue);
        } else {
            translate.setDefaultLang('fr');
        }
        translate.getBrowserLang();
    }

    ngOnInit() {
        this.cartService.getCartState().subscribe((isOpen) => {
            console.log('Cart state changed:', isOpen);
            this.cartOpen = isOpen;
        });

        this.drawerService.getDrawerState().subscribe((isOpen) => {
            console.log('Drawer state changed:', isOpen);
            this.drawerOpen = isOpen;
        });
    }

    onDrawerStateChange(isOpen: boolean) {
        console.log('Drawer state changed:', isOpen);
        // Placez ici toute logique que vous souhaitez déclencher lorsque le drawer change d'état
    }

    toggleDrawer() {
        this.drawerService.toggleDrawer();
        this.drawerOpen = !this.drawerOpen;
    }

    closeDrawer() {
        console.log('close drawer 1');
        if (this.drawerOpen) {
            console.log('close drawer 2');
            this.drawerOpen = false;
        }
    }
    logout() {
        this.drawerService.closeDrawer();
        this.sessionService.destroy();
        localStorage.removeItem('unknownUser');
        this.router.navigate(['home']);
    }

    goToProfil() {
        this.drawerService.closeDrawer();
        this.router.navigate(['profile']);
    }
    checkout() {
        // Implement checkout logic here
    }
}
