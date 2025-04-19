import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DrawerService } from './core/services/drawer.service';
import { SessionService } from './core/services/session.service';
import { UserService } from './core/services/user.service';
import { Router } from '@angular/router';
import { CartService } from './core/services/cart.service';
import { environment } from 'src/environments/environment';
import { ShopTemplateService } from './core/services/shop-template.service';
import { MatDialog } from '@angular/material/dialog';
import { ChatModalComponent } from './core/component/chat-modal/chat-modal.component';
import { GeoLocationService } from './core/services/geolocation.service';
import { SharedService } from './core/services/shared.service';
import { MqttService } from './core/services/mqtt.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
    today: number = Date.now();
    drawerOpen = false;
    cartOpen = false;
    imgStorageUrl: string = environment.imgStorageUrl;
    aPIimgStorageUrl : string = environment.APIimgStorageUrl;
    backgroundImages = "";
    me:any = {};
  imageNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
    constructor(
        private sharedService: SharedService,
        public translate: TranslateService,
        public sessionService: SessionService,
        public userService: UserService,
        private drawerService: DrawerService,
        private cartService: CartService,
        private router: Router,
        public dialog: MatDialog,
        private mqttService: MqttService,
        private geoLocationService: GeoLocationService
    ) {
        translate.addLangs([
            'de',
            'en',
            'es',
            'nl',
            'it',
            'fr',
            'nl',
            'sv',
            'pl',
            'da',
            'fi',
        ]);

        // Définit la langue par défaut
        const sessionLangue = this.sessionService.getLang();
        translate.setDefaultLang(sessionLangue ? sessionLangue : 'fr');

        // Initialisation de `me` depuis SessionService
        const user = this.sessionService.getCurrentUser();
        if (user) {
            this.me = user;
        }
    }

    ngOnInit() {
        this.geoLocationService.checkAndRedirect(['SY', 'KP', 'RU', 'IR', 'GB', 'CN']);
        this.backgroundImages = this.aPIimgStorageUrl + 'uploads/images/creation/15/14.png';

        this.cartService.getCartState().subscribe((isOpen) => {
            console.log('Cart state changed:', isOpen);
            this.cartOpen = isOpen;
        });

        this.drawerService.getDrawerState().subscribe((isOpen) => {
            console.log('Drawer state changed:', isOpen);
            this.drawerOpen = isOpen;
        });

        // Écoute les mises à jour de `me`
        this.sharedService.me$.subscribe((data) => {
            this.me = data;
            console.log('Updated me in AppComponent:', this.me);
        });
    }

    getBackgroundStyle() {
        return {
          'background-image': `url(${this.backgroundImages})`
        };
    }
    
    openChat(): void {
        const dialogRef = this.dialog.open(ChatModalComponent, {
            width: '400px',
            height: '600px',
            position: { bottom: '20px', right: '20px' },
            panelClass: 'custom-modalbox',
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
        if (this.drawerOpen) {
            this.drawerOpen = false;
        }
    }

    goTo(name: string) {
        this.drawerService.closeDrawer();
        this.router.navigate([name]);
    }
    
    async logout() {
        await this.drawerService.closeDrawer();
        await this.sessionService.destroy();
        await this.mqttService.unsubscribeAll();
        await this.mqttService.logout();
        await this.router.navigate(['/']);
        window.location.reload(); // 🔄 Recharge la page après la déconnexion complète
      }
      
    
    
    checkout() {
        // Implement checkout logic here
    }
}
