import { Component, ElementRef, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { RdvModalComponent } from 'src/app/core/component/rdv-modal/rdv-modal.component';
import { SessionService } from 'src/app/core/services/session.service';
import { environment } from 'src/environments/environment';

@Component({
    selector: 'app-shop',
    templateUrl: './shop.component.html',
    styleUrls: ['./shop.component.scss'],
})
export class ShopComponent {
    imgStorageUrl: string = environment.imgStorageUrl;
    activeTab = 'home';
    @ViewChild('scrollContainerCategory')
    private scrollContainerCategory: ElementRef | undefined;
    @ViewChild('scrollContainerAround')
    private scrollContainerAround: ElementRef | undefined;
    @ViewChild('scrollContainerPromo') private scrollContainerPromo:
        | ElementRef
        | undefined;
    @ViewChild('scrollContainerTop10') private scrollContainerTop10:
        | ElementRef
        | undefined;
    categoriesFilter = [
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
    shopItems = [
        {
            name: 'Mama coiff 0',
            image: 'assets/images/ubertest.webp',
            note: '4.3',
            price: '50',
            description:
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
            monayType: '€',
            nbAvis: '2,000',
            picture: 'shopIllustration/coiffeur10.png',
            minimumDelay: '30',
            delayScale: 'minutes',
            type: 'hairdresser',
        },
        {
            name: 'Mama coiff 1',
            image: 'assets/images/ubertest.webp',
            note: '4.3',
            price: '50',
            description:
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
            monayType: '€',
            nbAvis: '2,000',
            picture: 'shopIllustration/coiffeur10.png',
            minimumDelay: '30',
            delayScale: 'minutes',
            type: 'hairdresser',
        },
        {
            name: 'Mama coiff 2',
            image: 'assets/images/ubertest.webp',
            note: '4.3',
            price: '50',
            description:
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
            monayType: '€',
            nbAvis: '2,000',
            picture: 'shopIllustration/coiffeur10.png',
            minimumDelay: '30',
            delayScale: 'minutes',
            type: 'hairdresser',
        },
        {
            name: 'Mama coiff 3',
            image: 'assets/images/ubertest.webp',
            note: '4.3',
            price: '50',
            description:
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
            monayType: '€',
            nbAvis: '2,000',
            picture: 'shopIllustration/coiffeur10.png',
            minimumDelay: '30',
            delayScale: 'minutes',
            type: 'hairdresser',
        },
        {
            name: 'Mama coiff 4',
            image: 'assets/images/ubertest.webp',
            note: '4.3',
            price: '50',
            description:
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
            monayType: '€',
            nbAvis: '2,000',
            picture: 'shopIllustration/coiffeur10.png',
            minimumDelay: '30',
            delayScale: 'minutes',
            type: 'hairdresser',
        },
        {
            name: 'Mama coiff 5',
            image: 'assets/images/ubertest.webp',
            note: '4.3',
            price: '50',
            description:
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
            monayType: '€',
            nbAvis: '2,000',
            picture: 'shopIllustration/coiffeur10.png',
            minimumDelay: '30',
            delayScale: 'minutes',
            type: 'hairdresser',
        },
        {
            name: 'Mama coiff 6',
            image: 'assets/images/ubertest.webp',
            note: '4.3',
            price: '50',
            description:
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
            monayType: '€',
            nbAvis: '2,000',
            picture: 'shopIllustration/coiffeur10.png',
            minimumDelay: '30',
            delayScale: 'minutes',
            type: 'hairdresser',
        },
        {
            name: 'Mama coiff 7',
            image: 'assets/images/ubertest.webp',
            note: '4.3',
            price: '50',
            description:
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
            monayType: '€',
            nbAvis: '2,000',
            picture: 'shopIllustration/coiffeur10.png',
            minimumDelay: '30',
            delayScale: 'minutes',
            type: 'hairdresser',
        },
        {
            name: 'Ophé touff',
            image: 'assets/images/ubertest.webp',
            note: '4.5',
            price: '50',
            description:
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
            monayType: '€',
            nbAvis: '2,000',
            picture: 'shopIllustration/coiffeur10.png',
            minimumDelay: '1',
            delayScale: 'jours',
            type: 'manucure',
        },
        {
            name: 'Manu coupe',
            image: 'assets/images/ubertest.webp',
            note: '4.0',
            price: '50',
            description:
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
            monayType: '€',
            nbAvis: '2,000',
            picture: 'shopIllustration/coiffeur10.png',
            minimumDelay: '30',
            delayScale: 'minutes',
            type: 'maquillage',
        },
        {
            name: 'Obélix',
            image: 'assets/images/ubertest.webp',
            note: '3.8',
            price: '50',
            description:
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
            monayType: '€',
            nbAvis: '2,000',
            picture: 'shopIllustration/coiffeur10.png',
            minimumDelay: '30',
            delayScale: 'minutes',
            type: 'visage',
        },
        {
            name: 'Tintin',
            image: 'assets/images/ubertest.webp',
            note: '2.9',
            price: '50',
            description:
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
            monayType: '€',
            nbAvis: '2,000',
            picture: 'shopIllustration/coiffeur10.png',
            minimumDelay: '30',
            delayScale: 'minutes',
            type: 'epilation',
        },
        {
            name: 'Toto',
            image: 'assets/images/ubertest.webp',
            note: '5.0',
            price: '50',
            description:
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
            monayType: '€',
            nbAvis: '2,000',
            picture: 'shopIllustration/coiffeur10.png',
            minimumDelay: '2',
            delayScale: 'jours',
            type: 'massage',
        },
    ];

    constructor(
        private router: Router,
        public sessionService: SessionService,
        public dialog: MatDialog
    ) {}

    openDialog() {
        this.dialog.open(RdvModalComponent);
    }
    scrollLeft(type: any) {
        switch (type) {
            case 'category':
                this.scrollContainerCategory!.nativeElement.scrollBy({
                    left: -this.calculateScrollAmount(),
                    behavior: 'smooth',
                });
                break;
            case 'around':
                this.scrollContainerAround!.nativeElement.scrollBy({
                    left: -this.calculateScrollAmount(),
                    behavior: 'smooth',
                });
                break;
            case 'promo':
                this.scrollContainerPromo!.nativeElement.scrollBy({
                    left: -this.calculateScrollAmount(),
                    behavior: 'smooth',
                });
                break;
            case 'top10':
                this.scrollContainerTop10!.nativeElement.scrollBy({
                    left: -this.calculateScrollAmount(),
                    behavior: 'smooth',
                });
                break;
        }
    }

    setActiveTab(tab: string): void {
        this.activeTab = tab;
    }
    scrollRight(type: any) {
        switch (type) {
            case 'category':
                this.scrollContainerCategory!.nativeElement.scrollBy({
                    left: this.calculateScrollAmount(),
                    behavior: 'smooth',
                });
                break;
            case 'around':
                this.scrollContainerAround!.nativeElement.scrollBy({
                    left: this.calculateScrollAmount(),
                    behavior: 'smooth',
                });
                break;
            case 'promo':
                this.scrollContainerPromo!.nativeElement.scrollBy({
                    left: this.calculateScrollAmount(),
                    behavior: 'smooth',
                });
                break;
            case 'top10':
                this.scrollContainerTop10!.nativeElement.scrollBy({
                    left: this.calculateScrollAmount(),
                    behavior: 'smooth',
                });
                break;
        }
    }

    private calculateScrollAmount(): number {
        // Taille hypothétique d'un 'app-card' plus la marge
        return (300 + 20) * 4;
    }

    toProfilePage() {
        this.router.navigate(['/profile']);
    }
}
