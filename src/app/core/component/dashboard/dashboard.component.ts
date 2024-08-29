import { Component, OnInit } from '@angular/core';
import { BookingService } from '../../services/booking.service';
import { UserService } from '../../services/user.service';
import { ShopService } from '../../services/shop.service';
import { ProductService } from '../../services/product.service';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
    activeSection: string = 'account-info';
    currentUser: any = {};
    // Données fictives pour le tableau de bord
    totalReservations: number = 0;
    totalRevenue: number = 1500;
    averageRating: number = 4.7;
    totalReviews: number = 0;
    popularServices: any[] = [];

    upcomingAppointments: any[] = [];

    constructor(
        private bookingService: BookingService,
        private userService: UserService,
        private shopService: ShopService,
        private productService: ProductService
    ) {}

    ngOnInit(): void {
        this.userService.getMe().subscribe(
            (data: any) => {
                this.currentUser = data;
                this.shopService.getAll().subscribe({
                    next: (shops: any[]) => {
                        let myShops = shops.filter((x: any) => {
                            return (x.professionnel = this.currentUser._id);
                        });
                        let totalRating = 0;
                        myShops.forEach((item: any) => {
                            const reviews = item.reviews;
                            this.totalReviews += reviews.length;
                            const totalItemRating = reviews.reduce(
                                (sum: any, review: any) => sum + review.rating,
                                0
                            );
                            totalRating += totalItemRating;
                        });
                        this.averageRating = totalRating / this.totalReviews;
                    },
                });
                this.bookingService.getAll().subscribe({
                    next: (data: any) => {
                        console.log(data);
                        let allReservations = data.filter((x: any) => {
                            return x.user === this.currentUser._id;
                        });
                        let allFinishedReservations = data.filter((x: any) => {
                            return (
                                x.user === this.currentUser._id &&
                                x.status === 'completed'
                            );
                        });
                        this.totalReservations = allReservations.length;
                        this.totalRevenue = allFinishedReservations.reduce(
                            (total: number, item: any) => {
                                return total + parseFloat(item.price);
                            },
                            0
                        );
                        // Obtenir la date actuelle
                        const currentDate: any = new Date();
                        // Obtenir les 3 prochaines réservations
                        this.upcomingAppointments =
                            this.getUpcomingReservations(data, currentDate, 3);
                        /** Récupérer les reservations les plus populaires */
                        // Étape 1: Compter les occurrences de chaque service
                        const serviceCountMap = data.reduce(
                            (acc: any, reservation: any) => {
                                const serviceId = reservation.service;
                                acc[serviceId] = (acc[serviceId] || 0) + 1;
                                return acc;
                            },
                            {} as Record<string, number>
                        );
                        // Étape 2: Convertir la map en un tableau et trier par ordre décroissant d'occurrences
                        const sortedServices = Object.entries(serviceCountMap)
                            .map(([service, count]) => ({
                                name: service,
                                reservations: count,
                            }))
                            .sort(
                                (a: any, b: any) =>
                                    b.reservations - a.reservations
                            );
                        // Étape 3: Extraire les trois services les plus populaires
                        this.popularServices = sortedServices.slice(0, 3);
                        this.productService.getAll().subscribe({
                            next: (products:any) => {
                                console.log(products);
                                for(let elem of this.popularServices) {
                                    console.log(elem)
                                    let servicePopular = products.find((x:any) => {
                                        return x._id === elem.name;
                                    })
                                    elem._id = servicePopular._id;
                                    elem.name = servicePopular.name;
                                }
                                console.log(this.popularServices)
                            },
                            error: (error:any) => {
                                console.log("toto");
                            }
                        })
                        // Résultat pour Angular (à utiliser dans votre composant)
                        console.log(this.popularServices);
                        this.userService.getAll().subscribe({
                            next: (users: any) => {
                                for (let elem of this.upcomingAppointments) {
                                    let userTofind = users.find((x: any) => {
                                        return x._id === elem.user;
                                    });
                                    if (userTofind) {
                                        elem.clientName =
                                            userTofind.firstname +
                                            ' ' +
                                            userTofind.lastname;
                                    }
                                }
                            },
                            error: (error: any) => {
                                console.log(error);
                            },
                        });
                        console.log(this.upcomingAppointments);
                    },
                    error: (error: any) => {
                        console.error(
                            'Erreur lors de la récupération des bookings:',
                            error
                        );
                    },
                });
            },
            (error: any) => {
                console.log(error);
            }
        );
    }

    setActiveSection(section: string): void {
        this.activeSection = section;
    }

    isSectionActive(section: string): boolean {
        return this.activeSection === section;
    }
    // Fonction pour obtenir les 3 prochaines réservations
    getUpcomingReservations(
        reservations: any[],
        currentDate: Date,
        count: number
    ) {
        return reservations
            .filter((reservation) => new Date(reservation.date) > currentDate)
            .sort(
                (a, b) =>
                    new Date(a.date).getTime() - new Date(b.date).getTime()
            )
            .slice(0, count);
    }
}
