import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";
import { StripeService } from "src/app/core/services/stripe.service";
import { SessionService } from "src/app/core/services/session.service"; // adapte le chemin

@Component({
  selector: "app-thank-you",
  templateUrl: "./thank-you.component.html",
  styleUrls: ["./thank-you.component.scss"],
})
export class ThankYouComponent implements OnInit {
  imgStorageUrl = "assets/images/";
  periodEnd: Date | null = null;

  status: string | null = null;
  plan: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private stripeService: StripeService,
    private sessionService: SessionService
  ) {}

  ngOnInit(): void {
    const sessionId = this.route.snapshot.queryParamMap.get("session_id");

    if (!sessionId) {
      this.router.navigate(["/"]);
      return;
    }

    // ✅ Récupération userId (à adapter si tu as déjà un UserService.getMe())
    const userId =
      (this.sessionService as any)?.getUserId?.() ||
      localStorage.getItem("userId") ||
      "";

    if (!userId) {
      // si pas de userId, on peut quand même afficher la page sans infos
      this.periodEnd = null;
      return;
    }

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
  }

  goDashboard() {
    this.router.navigate(["/dashboard"]);
  }

  goBilling() {
    this.router.navigate(["/billing"]);
  }
}
