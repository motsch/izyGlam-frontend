import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { StripeService } from "src/app/core/services/stripe.service";

@Component({
  selector: "app-billing",
  templateUrl: "./billing.component.html",
  styleUrls: ["./billing.component.scss"],
})
export class BillingComponent implements OnInit {
  imgStorageUrl = "assets/images/";

  loading = true;
  actionLoading = false;

  plan: string | null = null;
  status: string | null = null;
  periodEnd: Date | null = null;
  cancelAtPeriodEnd = false;

  // ⚠️ Adapte : chez toi tu as probablement déjà me via /api/me
  me: any;

  constructor(private router: Router, private stripeService: StripeService) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    const userId = this.me?._id || localStorage.getItem("userId") || "";
    if (!userId) {
      this.loading = false;
      return;
    }

    this.loading = true;
    this.stripeService.getPremiumSubscription(userId).subscribe({
      next: (res: any) => {
        this.plan = res?.plan || null;
        this.status = res?.status || null;
        this.cancelAtPeriodEnd = !!res?.cancelAtPeriodEnd;
        this.periodEnd = res?.currentPeriodEnd ? new Date(res.currentPeriodEnd) : null;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  goDashboard() {
    this.router.navigate(["/dashboard"]);
  }

  async cancelSubscription() {
    if (this.actionLoading) return;

    const ok = confirm(
      "Souhaites-tu annuler ton abonnement Premium ?\n\nIl restera actif jusqu’à la fin de la période en cours."
    );
    if (!ok) return;

    const userId = this.me?._id || localStorage.getItem("userId") || "";
    if (!userId) return;

    this.actionLoading = true;
    this.stripeService.cancelPremium(userId).subscribe({
      next: () => {
        this.actionLoading = false;
        this.load();
      },
      error: () => {
        this.actionLoading = false;
      },
    });
  }

  resumeSubscription() {
    if (this.actionLoading) return;

    const userId = this.me?._id || localStorage.getItem("userId") || "";
    if (!userId) return;

    this.actionLoading = true;
    this.stripeService.resumePremium(userId).subscribe({
      next: () => {
        this.actionLoading = false;
        this.load();
      },
      error: () => {
        this.actionLoading = false;
      },
    });
  }

  openPortal() {
    const userId = this.me?._id || localStorage.getItem("userId") || "";
    if (!userId) return;

    this.actionLoading = true;
    this.stripeService.openCustomerPortal(userId).subscribe({
      next: (res: any) => {
        this.actionLoading = false;
        if (res?.url) window.location.href = res.url;
      },
      error: () => {
        this.actionLoading = false;
      },
    });
  }
}
