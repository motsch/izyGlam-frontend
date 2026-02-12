import { Component, OnInit } from "@angular/core";
import { CountryService } from "../../services/country.service";

@Component({
  selector: "app-admin-country-management",
  templateUrl: "./admin-country-management.component.html",
  styleUrls: ["./admin-country-management.component.scss"],
})
export class AdminCountryManagementComponent implements OnInit {
  countries: any[] = [];
  loading = false;

  constructor(private countryService: CountryService) {}

  ngOnInit() {
    this.loadCountries();
  }

  loadCountries() {
    this.loading = true;
    this.countryService.getAll().subscribe(
      (data: any[]) => {
        this.countries = data ?? [];
        this.loading = false;
      },
      (error: any) => {
        console.error("Erreur lors du chargement des pays", error);
        this.loading = false;
      }
    );
  }

  toggleActive(country: any, event: any) {
    const checked = !!event?.detail?.checked;

    // Optimistic UI (optionnel mais agréable)
    const prev = country.active;
    country.active = checked;

    this.countryService.setActive(country._id, checked).subscribe(
      (updated: any) => {
        const idx = this.countries.findIndex((c) => c._id === updated._id);
        if (idx !== -1) this.countries[idx] = updated;
      },
      (error: any) => {
        console.error("Erreur lors du changement d'état du pays", error);
        // rollback
        country.active = prev;
      }
    );
  }

  trackById(_index: number, item: any) {
    return item._id;
  }
}
