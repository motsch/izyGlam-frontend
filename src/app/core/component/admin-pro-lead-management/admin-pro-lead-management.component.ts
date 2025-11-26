import { Component, OnInit } from "@angular/core";
import { ProLeadService } from "../../services/pro-lead.service";

@Component({
  selector: 'app-admin-pro-lead-management',
  templateUrl: './admin-pro-lead-management.component.html',
  styleUrls: ['./admin-pro-lead-management.component.scss']
})
export class AdminProLeadManagementComponent implements OnInit {
  leads: any[] = [];
  filteredLeads: any[] = [];

  loading = false;
  savingId: string | null = null;

  searchTerm = "";
  filterHasEmail: "all" | "yes" | "no" = "all";
  filterStatus: string | "all" = "all";

  constructor(private proLeadService: ProLeadService) {}

  ngOnInit(): void {
    this.loadLeads();
  }

  loadLeads(): void {
    this.loading = true;
    this.proLeadService.getLeads().subscribe({
      next: (leads) => {
        this.leads = leads;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error("Erreur lors du chargement des pro leads", err);
        this.loading = false;
      },
    });
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();

    this.filteredLeads = this.leads.filter((lead) => {
      if (this.filterHasEmail === "yes" && !lead.contactEmail) return false;
      if (this.filterHasEmail === "no" && lead.contactEmail) return false;

      if (this.filterStatus !== "all" && lead.status !== this.filterStatus) {
        return false;
      }

      if (!term) return true;

      const haystack = [
        lead.name,
        lead.city,
        lead.postalCode,
        lead.website,
        lead.contactEmail,
        lead.contactPhone,
        lead.categoryName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
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

  onFilterStatusChange(value: string | "all"): void {
    this.filterStatus = value;
    this.applyFilters();
  }

  hasBeenContacted(lead: any): boolean {
    return !!lead.lastContactAt;
  }

  markContacted(lead: any): void {
    this.savingId = lead._id;

    const payload: Partial<any> = {
      lastContactAt: new Date().toISOString(),
      status: lead.status === "new" ? "contacted" : lead.status,
    };

    this.proLeadService.updateLead(lead._id, payload).subscribe({
      next: (updated) => {
        const index = this.leads.findIndex((l) => l._id === lead._id);
        if (index !== -1) {
          this.leads[index] = { ...this.leads[index], ...updated };
        }
        this.applyFilters();
        this.savingId = null;
      },
      error: (err) => {
        console.error("Erreur lors de la mise à jour du pro lead", err);
        this.savingId = null;
      },
    });
  }

  saveNotes(lead: any): void {
    this.savingId = lead._id;

    this.proLeadService
      .updateLead(lead._id, { notes: lead.notes })
      .subscribe({
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

  getStatusLabel(lead: any): string {
    switch (lead.status) {
      case "new":
        return "Nouveau";
      case "contacted":
        return "Contacté";
      case "qualified":
        return "Qualifié";
      case "onboarded":
        return "Onboardé";
      case "rejected":
        return "Rejeté";
      default:
        return lead.status;
    }
  }
}