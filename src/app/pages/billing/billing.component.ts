import { Component, OnDestroy, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { Subscription as RxSub } from "rxjs";
import { SharedService } from "src/app/core/services/shared.service";
import { UserService } from "src/app/core/services/user.service";
import { StripeService } from "src/app/core/services/stripe.service";

@Component({
  selector: "app-billing",
  templateUrl: "./billing.component.html",
  styleUrls: ["./billing.component.scss"],
})
export class BillingComponent implements OnInit, OnDestroy {
  imgStorageUrl = "assets/images/";
  loading = true;
  actionLoading = false;

  me: any = null;

  // subscription UI fields
  plan: string | null = null;
  status: string | null = null;
  cancelAtPeriodEnd = false;
  periodEnd: Date | null = null;

  private sub?: RxSub;

  constructor(
    private sharedService: SharedService,
    private userService: UserService,
    private stripeService: StripeService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 1) On écoute me$ (source unique dans ton app)
    this.sub = this.sharedService.me$.subscribe((m) => {
      if (m) {
        this.me = m;
        this.applyMeToUi(m);
        this.loading = false;
      }
    });

    // 2) Sécurité : si me$ vide au moment de l’arrivée sur la page -> on fetch
    this.userService.getMe().subscribe({
      next: (m) => {
        this.sharedService.updateMe(m); // alimente le flux global
        this.me = m;
        this.applyMeToUi(m);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private applyMeToUi(m: any) {
    const sub = m?.subscription;

    this.plan = sub?.plan || m?.abonnement || null;
    this.status = sub?.status || null;
    this.cancelAtPeriodEnd = !!sub?.cancelAtPeriodEnd;
    this.periodEnd = sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;
  }

  // -----------------------
  // Actions Stripe
  // -----------------------

  openPortal() {
    if (!this.me?._id) return;

    this.actionLoading = true;
    this.stripeService.openCustomerPortal(this.me._id).subscribe({
      next: (res: any) => {
        this.actionLoading = false;
        if (res?.url) window.location.href = res.url;
      },
      error: () => {
        this.actionLoading = false;
      },
    });
  }

  cancelSubscription() {
    if (!this.me?._id) return;

    this.actionLoading = true;
    this.stripeService.cancelPremium(this.me._id).subscribe({
      next: (res: any) => {
        this.actionLoading = false;

        // refresh me (important)
        this.userService.getMe().subscribe((m) => this.sharedService.updateMe(m));
      },
      error: () => {
        this.actionLoading = false;
      },
    });
  }

  resumeSubscription() {
    if (!this.me?._id) return;

    this.actionLoading = true;
    this.stripeService.resumePremium(this.me._id).subscribe({
      next: () => {
        this.actionLoading = false;

        // refresh me (important)
        this.userService.getMe().subscribe((m) => this.sharedService.updateMe(m));
      },
      error: () => {
        this.actionLoading = false;
      },
    });
  }

  goDashboard() {
    this.router.navigate(["/dashboard"]);
  }

  // Helpers UI
  get isActiveOrTrialing(): boolean {
    return this.status === "active" || this.status === "trialing";
  }

  get mainAddress(): any {
    const addresses = this.me?.address || [];
    return addresses.find((a: any) => a.main) || addresses[0] || null;
  }
}
