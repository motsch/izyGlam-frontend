import { Component, OnInit } from "@angular/core";
import { B2BLeadService } from "../../services/b2b-lead.service";

@Component({
  selector: "app-admin-b2b-lead-management",
  templateUrl: "./admin-b2b-lead-management.component.html",
  styleUrls: ["./admin-b2b-lead-management.component.scss"],
})
export class AdminB2bLeadManagementComponent implements OnInit {
  leads: any[] = [];
  filteredLeads: any[] = [];
  loading = false;
  savingId: string | null = null;
  enriching = false;
  searchTerm = "";
  filterHasEmail: "all" | "yes" | "no" = "all";
  hoveredLeadId: string | null = null;
  sendingEmailId: string | null = null;

  constructor(private b2bLeadService: B2BLeadService) {}

  ngOnInit(): void {
    this.loadLeads();
  }

  loadLeads(): void {
    this.loading = true;
    this.b2bLeadService.getLeads().subscribe({
      next: (leads) => {
        this.leads = leads;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des leads", err);
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();

    this.filteredLeads = this.leads.filter((lead) => {
      if (this.filterHasEmail === "yes" && !lead.contactEmail) return false;
      if (this.filterHasEmail === "no" && lead.contactEmail) return false;

      if (!term) return true;

      const haystack = [
        lead.companyName,
        lead.city,
        lead.postalCode,
        lead.website,
        lead.contactEmail,
        lead.contactPhone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }

  getNextEmailStep(lead: any): number | null {
    const currentStep = lead.dripStep || 0;
    if (currentStep >= 5) {
      return null;
    }
    return currentStep + 1;
  }

  sendNextEmail(lead: any): void {
    if (!lead.contactEmail) {
      console.warn("Ce lead n'a pas d'email de contact.");
      return;
    }

    const nextStep = this.getNextEmailStep(lead);

    if (!nextStep) {
      console.warn("Tous les emails de la séquence ont déjà été envoyés.");
      return;
    }

    this.sendingEmailId = lead._id;

    this.b2bLeadService.sendDripEmail(lead._id, nextStep).subscribe({
      next: (updated) => {
        const index = this.leads.findIndex((l) => l._id === lead._id);
        if (index !== -1) {
          this.leads[index] = { ...this.leads[index], ...updated };
        }
        this.applyFilters();
        this.sendingEmailId = null;
      },
      error: (err) => {
        console.error("Erreur lors de l'envoi de l'email", err);
        this.sendingEmailId = null;
      },
    });
  }

  onSearchChange(value: string): void {
    this.searchTerm = value;
    this.applyFilters();
  }

  onFilterHasEmailChange(value: "all" | "yes" | "no"): void {
    this.filterHasEmail = value;
    this.applyFilters();
  }

  showEmailsPopover(lead: any): void {
    this.hoveredLeadId = lead._id;
  }

  hideEmailsPopover(): void {
    this.hoveredLeadId = null;
  }

  hasBeenContacted(lead: any): boolean {
    return !!lead.lastContactAt;
  }

  markContacted(lead: any): void {
    this.savingId = lead._id;

    const payload: Partial<any> = {
      lastContactAt: new Date().toISOString(),
      status: lead.status === "new" ? "in_drip" : lead.status,
    };

    this.b2bLeadService.updateLead(lead._id, payload).subscribe({
      next: (updated) => {
        const index = this.leads.findIndex((l) => l._id === lead._id);
        if (index !== -1) {
          this.leads[index] = { ...this.leads[index], ...updated };
        }
        this.applyFilters();
        this.savingId = null;
      },
      error: (err) => {
        console.error("Erreur lors de la mise à jour du lead", err);
        this.savingId = null;
      },
    });
  }

  saveNotes(lead: any): void {
    this.savingId = lead._id;

    this.b2bLeadService.updateLead(lead._id, { notes: lead.notes }).subscribe({
      next: (updated) => {
        const index = this.leads.findIndex((l) => l._id === lead._id);
        if (index !== -1) {
          this.leads[index] = { ...this.leads[index], ...updated };
        }
        this.applyFilters();
        this.savingId = null;
      },
      error: (err) => {
        console.error("Erreur lors de l'enregistrement des notes", err);
        this.savingId = null;
      },
    });
  }

  triggerEnrichment(): void {
    this.enriching = true;
    this.b2bLeadService.triggerEmailEnrichment(20).subscribe({
      next: () => {
        this.enriching = false;
        this.loadLeads();
      },
      error: (err) => {
        console.error("Erreur lors de l'enrichissement des emails", err);
        this.enriching = false;
      },
    });
  }

  getStatusLabel(lead: any): string {
    switch (lead.status) {
      case "new":
        return "Nouveau";
      case "in_drip":
        return "Séquence email";
      case "meeting_scheduled":
        return "RDV prévu";
      case "proposal_sent":
        return "Devis envoyé";
      case "won":
        return "Signé";
      case "lost":
        return "Perdu";
      case "paused":
        return "En pause";
      default:
        return lead.status;
    }
  }

  // --------- ETAT DES EMAILS (UI) ---------

  getDripSentCount(lead: any): number {
    return [
      lead.email1Sent,
      lead.email2Sent,
      lead.email3Sent,
      lead.email4Sent,
      lead.email5Sent,
    ].filter(Boolean).length;
  }

  isEmailSent(lead: any, step: number): boolean {
    return lead[`email${step}Sent`] === true;
  }

  getEmailTooltip(lead: any, step: number): string {
    const label = `Email ${step}`;
    const sent = lead[`email${step}Sent`];
    const dateValue = lead[`email${step}SentAt`];

    if (!sent) {
      return `${label} : non envoyé`;
    }

    const date = dateValue ? new Date(dateValue).toLocaleDateString() : "";
    return `${label} : envoyé${date ? " le " + date : ""}`;
  }

  getDripWrapperClass(lead: any): string {
    const count = this.getDripSentCount(lead);

    if (count === 0) return "drip-none";
    if (count === 5) return "drip-full";
    return "drip-partial";
  }

  getDripMainLabel(lead: any): string {
    const count = this.getDripSentCount(lead);

    if (count === 0) return "Rien";
    if (count === 5) return "Terminée";
    return `En cours (${count}/5)`;
  }
}
