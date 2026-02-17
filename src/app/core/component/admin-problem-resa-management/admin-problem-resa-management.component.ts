import { Component, OnInit } from "@angular/core";
import { ProblemService, ProblemOutcome, ResolveProblemPayload } from "../../services/problem.service";

type UiProblem = any;

@Component({
  selector: "app-admin-problem-resa-management",
  templateUrl: "./admin-problem-resa-management.component.html",
  styleUrls: ["./admin-problem-resa-management.component.scss"],
})
export class AdminProblemResaManagementComponent implements OnInit {
  loading = false;
  resolvingIds = new Set<string>();
  errorMsg = "";

  problems: UiProblem[] = [];
  selectedProblem: UiProblem | null = null;

  adminNote = "";
  refund: "NONE" | "FULL" | "PARTIAL" = "NONE";
  penalty = false;

  constructor(private problemService: ProblemService) {}

  ngOnInit() {
    this.loadOpenProblems();
  }

  loadOpenProblems() {
    this.loading = true;
    this.errorMsg = "";
    this.selectedProblem = null;

    this.problemService.getOpenProblems().subscribe({
      next: (res: any) => {
        this.problems = (res?.problems || []).map((p: any) => ({
          ...p,
          // Dates UI
          reportedAtUi: p.reportedAt ? new Date(p.reportedAt) : null,
          bookingStartUi: p?.booking?.start ? new Date(p.booking.start) : (p.bookingStart ? new Date(p.bookingStart) : null),
          bookingEndUi: p?.booking?.end ? new Date(p.booking.end) : (p.bookingEnd ? new Date(p.bookingEnd) : null),
          orderDateUi: p?.booking?.orderDate ? new Date(p.booking.orderDate) : null,
        }));

        this.loading = false;
      },
      error: (e) => {
        this.loading = false;
        this.errorMsg = e?.error?.error || "Erreur lors du chargement des problèmes.";
        console.error(e);
      },
    });
  }

  selectProblem(p: UiProblem) {
    this.selectedProblem = p;

    // reset formulaire résolution
    this.adminNote = "";
    this.refund = "NONE";
    this.penalty = false;

    // preset intelligent selon le type
    // (si c'est un NO_SHOW report, tu peux précocher no-show-pro par défaut si tu veux pas)
  }

  // =========================
  // Helpers DATA (enrichi API)
  // =========================

  get booking(): any {
    return this.selectedProblem?.booking || null;
  }

  get client(): any {
    return this.selectedProblem?.client || null;
  }

  get pro(): any {
    return this.selectedProblem?.pro || null;
  }

  get shop(): any {
    return this.selectedProblem?.shop || null;
  }

  get service(): any {
    return this.selectedProblem?.service || null;
  }

  // ==============
  // Helpers contact
  // ==============

  getClientPhone(p: UiProblem): string {
    return p?.client?.phone || "";
  }

  getClientEmail(p: UiProblem): string {
    return p?.client?.email || "";
  }

  getProPhone(p: UiProblem): string {
    return p?.pro?.phone || "";
  }

  getProEmail(p: UiProblem): string {
    return p?.pro?.email || "";
  }

  getProPlanLabel(p: UiProblem): string {
    const pro = p?.pro;
    if (!pro) return "—";

    // priorité : subscription.plan si présent, sinon abonnement legacy
    const plan = pro?.subscription?.plan || pro?.abonnement;
    if (!plan) return "—";

    const map: any = {
      free: "FREE",
      basic: "BASIC",
      pro: "PRO",
      premium: "PREMIUM",
      custom: "CUSTOM",
    };
    return map[plan] || String(plan).toUpperCase();
  }

  getProSubscriptionStatus(p: UiProblem): string {
    const status = p?.pro?.subscription?.status;
    return status ? String(status).toUpperCase() : "—";
  }

  formatPrice(price: any): string {
    const n = parseFloat(String(price ?? "0"));
    if (Number.isNaN(n)) return "0.00";
    return n.toFixed(2);
  }

  // ==========
  // UI Actions
  // ==========

  call(phone: string) {
    if (!phone) return;
    window.open(`tel:${phone}`, "_self");
  }

  email(email: string) {
    if (!email) return;
    window.open(`mailto:${email}`, "_self");
  }

  copy(text: string) {
    if (!text) return;
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  openMaps(address: string) {
    if (!address) return;
    const encoded = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/search/?api=1&query=${encoded}`, "_blank");
  }

  // ======================
  // Presets verdict simple
  // ======================

  presetVerdict(outcome: ProblemOutcome) {
    if (outcome === "NO_SHOW_PRO") {
      this.refund = "FULL";
      this.penalty = true;
    } else if (outcome === "NO_SHOW_CLIENT") {
      this.refund = "NONE";
      this.penalty = false;
    } else if (outcome === "REFUND_FULL_NO_PENALTY") {
      this.refund = "FULL";
      this.penalty = false;
    } else {
      this.refund = "NONE";
      this.penalty = false;
    }
  }

  resolve(outcome: ProblemOutcome) {
    if (!this.selectedProblem?._id) return;

    const problemId = this.selectedProblem._id;
    this.resolvingIds.add(problemId);
    this.errorMsg = "";

    const payload: ResolveProblemPayload = {
      outcome,
      note: this.adminNote?.trim() || undefined,
      refund: this.refund,
      penalty: this.penalty,
    };

    this.problemService.resolveProblem(problemId, payload).subscribe({
      next: () => {
        this.resolvingIds.delete(problemId);
        this.loadOpenProblems();
      },
      error: (e) => {
        this.resolvingIds.delete(problemId);
        this.errorMsg = e?.error?.error || "Erreur lors de la résolution.";
        console.error(e);
      },
    });
  }

  isResolvingCurrent(): boolean {
    const id = this.selectedProblem?._id;
    return !!id && this.resolvingIds.has(id);
  }
}
