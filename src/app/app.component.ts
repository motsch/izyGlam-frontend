import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DrawerService } from './core/services/drawer.service';
import { SessionService } from './core/services/session.service';
import { UserService } from './core/services/user.service';
import { Router } from '@angular/router';
import { CartService } from './core/services/cart.service';
import { environment } from 'src/environments/environment';
import { MatDialog } from '@angular/material/dialog';
import { ChatModalComponent } from './core/component/chat-modal/chat-modal.component';
import { GeoLocationService } from './core/services/geolocation.service';
import { SharedService } from './core/services/shared.service';
import { MatDrawer } from '@angular/material/sidenav';
import { AdminService } from './core/services/admin.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  today: number = Date.now();
  me$ = this.sharedService.me$; // 👉 flux unique pour toute l’app
  drawerOpen = false;
  cartOpen = false;
  currentYear: number = new Date().getFullYear();
  settings: any = {};
  imgStorageUrl: string = environment.imgStorageUrl;
  aPIimgStorageUrl: string = environment.APIimgStorageUrl;
  backgroundImages = "";
  me: any = {};
  imageNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

  constructor(
    private sharedService: SharedService,
    public translate: TranslateService,
    public sessionService: SessionService,
    public userService: UserService,
    public drawerService: DrawerService,
    private cartService: CartService,
    private router: Router,
    public dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private adminService: AdminService,
    private geoLocationService: GeoLocationService
  ) {
    translate.addLangs([
      'ar','be','bn','ca','da','de','en','es','et','eu','fa','fi','fr','gl','hi',
      'id','it','ja','ko','ku','ms','nl','pl','pt','ro','ru','so','sq','sv','th',
      'tl','tr','uk','vi','zh'
    ]);

    const sessionLangue = this.sessionService.getLang();
    translate.setDefaultLang(sessionLangue ? sessionLangue : 'fr');

    this.userService.getMe().subscribe(user => {
      this.me = user;
    });
  }

  ngOnInit() {
    // si tu veux une valeur initiale depuis la session au boot :
    const bootMe = this.sessionService.getCurrentUser();
    if (bootMe) this.sharedService.updateMe(bootMe);
    this.sharedService.me$.subscribe((data) => {
      this.me = data ?? this.sessionService.getCurrentUser();
    });

    this.adminService.getAdminSettings().subscribe((data) => {
      this.settings = data;
    });

    this.geoLocationService.checkAndRedirect(['SY', 'KP', 'RU', 'IR', 'GB', 'CN']);
    this.backgroundImages = this.aPIimgStorageUrl + 'uploads/images/creation/15/14.png';

    this.cartService.getCartState().subscribe((isOpen) => {
      this.cartOpen = isOpen;
    });

    // État du drawer centralisé (venant du service)
    this.drawerService.getDrawerState().subscribe((isOpen) => {
      this.drawerOpen = isOpen;
      this.cdr.detectChanges();
    });
  }

  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }

  getBackgroundStyle() {
    return { 'background-image': `url(${this.backgroundImages})` };
  }

  openChat(): void {
    this.dialog.open(ChatModalComponent, {
      width: '400px',
      height: '600px',
      position: { bottom: '20px', right: '20px' },
      panelClass: 'custom-modalbox',
    });
  }

  onDrawerStateChange(isOpen: boolean) {
    console.log('Drawer state changed:', isOpen);
  }

  toggleDrawer() {
    this.drawerService.toggleDrawer();
  }

  closeDrawer() {
    this.drawerService.closeDrawer();
  }

  goTo(name: string) {
    this.drawerService.closeDrawer();
    this.router.navigate([name]);
  }

  async logout() {
    this.drawerService.closeDrawer();
    await this.sessionService.destroy();
    await this.router.navigate(['/']);
    window.location.reload();
  }
}
