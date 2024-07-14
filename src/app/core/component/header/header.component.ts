import {
    Component,
    HostListener,
    Inject,
    Input,
    OnInit,
    Renderer2,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { AddressModalComponent } from '../address-modal/address-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { DrawerService } from '../../services/drawer.service';
import { WINDOW } from '../../services/windows.service';
import { SessionService } from '../../services/session.service';
import { CartService } from '../../services/cart.service';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
    @Input() page: string | undefined;
    @Input() connected: boolean | undefined;
    public darkHeader: boolean = false;
    public menuItems: any[] | undefined;
    public showClass: boolean = false;
    public showClass1: boolean = false;
    public scroll: number | undefined;
    public sections = 8;
    isDelivery: boolean = false;
    imgStorageUrl: string = environment.imgStorageUrl;
    // Inject Document object
    categories = [
        {
            name: 'Coiffure',
            icon: 'assets/images/svg/hairdresser.svg',
            filter: 'hairdresser',
        },
        {
            name: 'Manucure',
            icon: 'assets/images/svg/manicure.svg',
            filter: 'manucure',
        },
        {
            name: 'Maquillage',
            icon: 'assets/images/svg/makeup.svg',
            filter: 'maquillage',
        },
        {
            name: 'Russian Lips',
            icon: 'assets/images/svg/lips.svg',
            filter: 'hairdresser',
        },
        {
            name: 'Soins du Visage',
            icon: 'assets/images/svg/head-massage.svg',
            filter: 'visage',
        },
        {
            name: 'Épilation',
            icon: 'assets/images/svg/hairRemove.svg',
            filter: 'epilation',
        },
        {
            name: 'Massages',
            icon: 'assets/images/svg/massage.svg',
            filter: 'massage',
        },
        {
            name: 'Soins du Corps',
            icon: 'assets/images/svg/body.svg',
            filter: 'bodycare',
        },
        {
            name: 'Esthétique',
            icon: 'assets/images/svg/medical.svg',
            filter: 'esthetique',
        },
        {
            name: 'Bien-être',
            icon: 'assets/images/svg/fitness.svg',
            filter: 'wellcare',
        },
        {
            name: 'Stylisme',
            icon: 'assets/images/svg/clothes.svg',
            filter: 'style',
        },
    ];
    constructor(
        @Inject(DOCUMENT) private document: Document,
        @Inject(WINDOW) private window: Window,
        private renderer: Renderer2,
        private drawerService: DrawerService,
        private cartService: CartService,
        public dialog: MatDialog,
        private router: Router,
        public sessionService: SessionService
    ) {}

    ngOnInit() {
        // $.getScript('./assets/js/script.js');
        // $.getScript('./assets/js/tilt.js');

        this.renderer.listen(window, 'scroll', ($event) => {
            this.scroll = window.scrollY / this.sections;
        });
        console.log('connected', this.connected);
        this.darkHeader = this.connected ? true : false;
    }

    toggleDelivery(isChecked: boolean) {
        this.isDelivery = isChecked;
        console.log('isDelivery', this.isDelivery);
        // Autres actions à exécuter lors du basculement
    }

    openDrawer() {
        this.drawerService.openDrawer();
    }
    openCart() {
        this.cartService.openCart();
    }
    openAddressModal() {
        this.dialog.open(AddressModalComponent, {
            width: '400px',
        });
    }

    // @HostListener Decorator
    @HostListener('window:scroll', [])
    onWindowScroll() {
        if (this.connected) {
            return;
        }
        let number =
            this.window.pageYOffset ||
            this.document.documentElement.scrollTop ||
            this.document.body.scrollTop ||
            0;

        if (number >= 60) {
            this.darkHeader = true;
        } else {
            this.darkHeader = false;
        }
    }
    toLogin() {
        console.log('toLogin');
        this.router.navigate(['/sign-in']);
    }
}
