import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { StripeService } from "src/app/core/services/stripe.service";
import { SessionService } from "src/app/core/services/session.service"; // adapte le chemin
import { UserService } from "src/app/core/services/user.service";

@Component({
  selector: "app-thank-you",
  templateUrl: "./thank-you.component.html",
  styleUrls: ["./thank-you.component.scss"],
})
export class ThankYouComponent implements OnInit {
  imgStorageUrl = "assets/images/";
  periodEnd: Date | null = null;
  me: any | null = null;
  status: string | null = null;
  plan: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private stripeService: StripeService,
    private sessionService: SessionService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    const sessionId = this.route.snapshot.queryParamMap.get("session_id");
    const alreadyActive = this.route.snapshot.queryParamMap.get("alreadyActive") === "1";
    this.userService.getMe().subscribe({
      next: (user: any) => {
        this.me = user;
        const userId = this.me?._id || localStorage.getItem("userId") || "";

        // Si pas de userId => page ok mais sans détails
        if (!userId) {
          this.periodEnd = null;
          this.status = null;
          this.plan = null;
          return;
        }

        // ✅ Cas A : on a un sessionId => on récupère via Stripe
        if (sessionId) {
          this.stripeService.getPremiumCheckoutStatus(sessionId, userId).subscribe({
            next: (res: any) => {
              this.status = res?.status || null;
              this.plan = res?.plan || "premium";
              this.periodEnd = res?.currentPeriodEnd ? new Date(res.currentPeriodEnd) : null;
            },
            error: () => {
              this.periodEnd = null;
            },
          });
          return;
        }

        // ✅ Cas B : pas de sessionId (déjà premium / accès direct)
        this.stripeService.getPremiumSubscription(userId).subscribe({
          next: (res: any) => {
            this.status = res?.status || null;
            this.plan = res?.plan || "premium";
            this.periodEnd = res?.currentPeriodEnd ? new Date(res.currentPeriodEnd) : null;
          },
          error: () => {
            this.periodEnd = null;
          },
        });
      },
      error: (error: any) => {
        console.error('Erreur lors de la récupération des données utilisateur :', error);
      }
    })
  }


  goDashboard() {
    this.router.navigate(["/profile"]);
  }

  goBilling() {
    this.router.navigate(["/billing"]);
  }
}
