import { Component, Input, OnInit } from '@angular/core';
import { BookingService } from '../../services/booking.service';
import { UserService } from '../../services/user.service';
import { ShopService } from '../../services/shop.service';
import { ProductService } from '../../services/product.service';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  @Input() me: any = {};

  // Section active (onglets UI)
  activeSection: string = 'account-info';

  // Utilisateur courant (copie de @Input pour plus de clarté)
  currentUser: any = {};

  // KPIs tableau de bord (valeurs par défaut)
  totalReservations: number = 0;
  totalRevenue: number = 1500;
  averageRating: number = 4.7;
  totalReviews: number = 0;

  // Top services
  popularServices: any[] = [];

  // Prochains rendez-vous
  upcomingAppointments: any[] = [];

  constructor(
    private bookingService: BookingService,
    private userService: UserService,
    private shopService: ShopService,
    private productService: ProductService,
    private translate: TranslateService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // Mémorisation de la section dans le menu
    localStorage.setItem('menu-param', 'dashboard');

    // On récupère l’utilisateur passé en @Input (si parent l’a injecté)
    this.currentUser = this.me;

    // 1) Charger tous les shops pour construire les métriques (avis/note moyenne)
    this.shopService.getAll().subscribe({
      next: (shops: any[]) => {
        // ✅ Correction: utiliser "===" et non "=" (bug logique)
        const myShops = shops.filter((x: any) => x.idUser === this.currentUser._id);

        let totalRating = 0;
        this.totalReviews = 0;

        myShops.forEach((item: any) => {
          const reviews = Array.isArray(item.reviews) ? item.reviews : [];
          this.totalReviews += reviews.length;

          const totalItemRating = reviews.reduce(
            (sum: number, review: any) => sum + (Number(review?.rating) || 0),
            0
          );
          totalRating += totalItemRating;
        });

        this.averageRating =
          this.totalReviews > 0 ? totalRating / this.totalReviews : 0;
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des boutiques :', err);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      },
    });

    // 2) Charger toutes les réservations pour KPI + RDV à venir + services populaires
    this.bookingService.getAll().subscribe({
      next: (bookings: any[]) => {
        // Filtre des réservations appartenant à l’utilisateur
        const allReservations = bookings.filter(
          (x: any) => x.user === this.currentUser._id
        );

        // Réservations terminées pour le chiffre d’affaires
        const allFinishedReservations = bookings.filter(
          (x: any) => x.user === this.currentUser._id && x.status === 'completed'
        );

        // KPI simples
        this.totalReservations = allReservations.length;
        this.totalRevenue = allFinishedReservations.reduce(
          (total: number, item: any) => total + (parseFloat(item?.price) || 0),
          0
        );

        // RDV à venir (3 prochains)
        const now = new Date();
        this.upcomingAppointments = this.getUpcomingReservations(
          allReservations,
          now,
          3
        );

        // --- Services populaires ---
        // Étape 1: Compter les occurrences de chaque service
        const serviceCountMap = bookings.reduce((acc: Record<string, number>, reservation: any) => {
          const serviceId = reservation?.service;
          if (serviceId) {
            acc[serviceId] = (acc[serviceId] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>);

        // Étape 2: Tableau trié par nb de réservations DESC
        const sortedServices = Object.entries(serviceCountMap)
          .map(([service, count]) => ({ name: service, reservations: count }))
          .sort((a: any, b: any) => b.reservations - a.reservations);

        // Étape 3: Top 3
        this.popularServices = sortedServices.slice(0, 3);

        // 3) Récupérer les noms des services via ProductService
        this.productService.getAll().subscribe({
          next: (products: any[]) => {
            // Mapper les IDs → noms lisibles
            for (const elem of this.popularServices) {
              const servicePopular = products.find((p: any) => p._id === elem.name);
              if (servicePopular) {
                elem._id = servicePopular._id;
                elem.name = servicePopular.name;
              }
            }
          },
          error: (error: any) => {
            console.error('Erreur lors de la récupération des produits :', error);
            this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
          },
        });

        // 4) Enrichir upcomingAppointments avec les noms des clients (UserService)
        this.userService.getAll().subscribe({
          next: (users: any[]) => {
            for (const elem of this.upcomingAppointments) {
              const userToFind = users.find((u: any) => u._id === elem.user);
              if (userToFind) {
                elem.clientName = `${userToFind.firstname} ${userToFind.lastname}`;
              }
            }
          },
          error: (error: any) => {
            console.error('Erreur lors de la récupération des utilisateurs :', error);
            this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
          },
        });
      },
      error: (error: any) => {
        console.error('Erreur lors de la récupération des réservations :', error);
        this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      },
    });
  }

  // --- UI onglets ---
  setActiveSection(section: string): void {
    this.activeSection = section;
  }

  isSectionActive(section: string): boolean {
    return this.activeSection === section;
  }

  // --- Utilitaire : 3 prochaines résas après "currentDate" ---
  getUpcomingReservations(reservations: any[], currentDate: Date, count: number) {
    return (reservations || [])
      .filter((reservation) => new Date(reservation.date) > currentDate)
      .sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )
      .slice(0, count);
  }

  // ---izyGlam: toasts unifiés ---
  private showCustomToast(message: string) {
    // Erreur stylisée (clé de traduction attendue : ERROR.GENERIC_ERROR)
    this.toastr.error(message);
  }

  private showSuccessToast(message: string) {
    // Succès (clé de traduction côté SUCCESS.*)
    this.toastr.success(message);
  }
}
