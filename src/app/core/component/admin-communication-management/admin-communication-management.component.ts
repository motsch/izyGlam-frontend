import { AfterViewInit, Component, OnInit } from '@angular/core';
import { CompanyService } from '../../services/company.service';
import { BookingService } from '../../services/booking.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-admin-communication-management',
  templateUrl: './admin-communication-management.component.html',
  styleUrls: ['./admin-communication-management.component.scss']
})
export class AdminCommunicationManagementComponent implements OnInit, AfterViewInit {

  companies: any[] = [];
  loadingCompanies = false;

  expandedCompanyId: string | null = null;
  companyEmployees: { [companyId: string]: any[] } = {};
  loadingEmployees: { [companyId: string]: boolean } = {};

  // Modal employé (liste de bookings)
  employeeModalOpen = false;
  selectedEmployee: any | null = null;
  employeeBookings: any[] = [];
  loadingBookings = false;

  // Modal création entreprise
  companyCreateModalOpen = false;
  creatingCompany = false;
  newCompany: any = {
    name: '',
    siret: '',
    email: '',
    phone: '',
    address: '',
    industry: '',
    credit: 0,
    website: ''
  };

  // Modal création employé
  employeeCreateModalOpen = false;
  creatingEmployee = false;
  employeeCompanyContext: any | null = null;
  newEmployee: any = {
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    sex: 'female',
    credit: 0
  };

  constructor(
    private companyService: CompanyService,
    private bookingService: BookingService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadCompanies();
  }

  ngAfterViewInit(): void {
    // placeholder si besoin d'animations plus tard
  }

  // --- Chargement des entreprises ---
  loadCompanies(): void {
    this.loadingCompanies = true;
    this.companyService.getAll().subscribe({
      next: (companies: any[]) => {
        this.companies = companies;
        this.loadingCompanies = false;
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des entreprises', err);
        this.loadingCompanies = false;
      }
    });
  }

  // --- Gestion du volet entreprise ---
  toggleCompany(company: any): void {
    if (this.expandedCompanyId === company._id) {
      this.expandedCompanyId = null;
      return;
    }

    this.expandedCompanyId = company._id;

    if (!this.companyEmployees[company._id]) {
      this.loadCompanyEmployees(company._id);
    }
  }

  loadCompanyEmployees(companyId: string): void {
    this.loadingEmployees[companyId] = true;
    this.companyService.getCompanyEmployees(companyId).subscribe({
      next: (employees: any[]) => {
        this.companyEmployees[companyId] = employees;

        // 🔢 MAJ du nombre d'employés sur la ligne entreprise
        const idx = this.companies.findIndex((c: any) => c._id === companyId);
        if (idx !== -1) {
          this.companies[idx] = {
            ...this.companies[idx],
            employeesCount: employees.length
          };
        }

        this.loadingEmployees[companyId] = false;
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des employés', err);
        this.loadingEmployees[companyId] = false;
      }
    });
  }

  // --- Modal création entreprise ---
  openCompanyModal(): void {
    this.resetNewCompany();
    this.companyCreateModalOpen = true;
  }

  closeCompanyModal(): void {
    this.companyCreateModalOpen = false;
  }

  resetNewCompany(): void {
    this.newCompany = {
      name: '',
      siret: '',
      email: '',
      phone: '',
      address: '',
      industry: '',
      credit: 0,
      website: ''
    };
  }

  submitCompany(): void {
    if (this.creatingCompany) {
      return;
    }

    this.creatingCompany = true;

    const payload = {
      ...this.newCompany
      // adminId éventuel à rajouter ici
    };

    this.companyService.create(payload).subscribe({
      next: (company: any) => {
        this.companies = [company, ...this.companies];
        this.creatingCompany = false;
        this.closeCompanyModal();
      },
      error: (err: any) => {
        console.error('Erreur lors de la création de l\'entreprise', err);
        this.creatingCompany = false;
      }
    });
  }

  // --- Modal création employé ---
  openEmployeeCreateModal(company: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.employeeCompanyContext = company;
    this.resetNewEmployee();
    this.employeeCreateModalOpen = true;
  }

  closeEmployeeCreateModal(): void {
    this.employeeCreateModalOpen = false;
    this.employeeCompanyContext = null;
  }

  resetNewEmployee(): void {
    this.newEmployee = {
      firstname: '',
      lastname: '',
      email: '',
      phone: '',
      sex: 'female',
      companyId: this.employeeCompanyContext?._id,
      credit: 0
    };
  }

  submitEmployee(): void {
    if (this.creatingEmployee || !this.employeeCompanyContext) {
      return;
    }

    this.creatingEmployee = true;
    const companyId = this.employeeCompanyContext._id;

    const payload = {
      ...this.newEmployee
    };

    this.userService.create(payload).subscribe({
      next: (employee: any) => {
        if (!this.companyEmployees[companyId]) {
          this.companyEmployees[companyId] = [];
        }
        this.companyEmployees[companyId] = [employee, ...this.companyEmployees[companyId]];

        // MAJ immédiate du compteur côté ligne entreprise
        const idx = this.companies.findIndex((c: any) => c._id === companyId);
        if (idx !== -1) {
          this.companies[idx] = {
            ...this.companies[idx],
            employeesCount: (this.companies[idx].employeesCount || 0) + 1
          };
        }

        this.creatingEmployee = false;
        this.closeEmployeeCreateModal();
      },
      error: (err: any) => {
        console.error('Erreur lors de la création de l\'employé', err);
        this.creatingEmployee = false;
      }
    });
  }

  // --- Modal employé / bookings ---
  openEmployeeModal(employee: any): void {
    this.selectedEmployee = employee;
    this.employeeModalOpen = true;
    this.loadEmployeeBookings(employee._id);
  }

  closeEmployeeModal(): void {
    this.employeeModalOpen = false;
    this.selectedEmployee = null;
    this.employeeBookings = [];
  }

  loadEmployeeBookings(employeeId: string): void {
    this.loadingBookings = true;
    this.bookingService.getBookingByClient(employeeId).subscribe({
      next: (bookings: any[]) => {
        this.employeeBookings = bookings;
        this.loadingBookings = false;

        // Optionnel : garder le compteur à jour si des bookings changent
        if (this.selectedEmployee) {
          const companyId = this.selectedEmployee.companyId;
          const employees = this.companyEmployees[companyId];

          if (employees && employees.length) {
            const index = employees.findIndex((e: any) => e._id === employeeId);
            if (index !== -1) {
              employees[index] = {
                ...employees[index],
                totalBookings: bookings.length
              };
            }
          }

          this.selectedEmployee = {
            ...this.selectedEmployee,
            totalBookings: bookings.length
          };
        }
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des bookings', err);
        this.loadingBookings = false;
      }
    });
  }

  // --- Helpers d'affichage ---
  getInitials(employee: any): string {
    const f = employee.firstname?.charAt(0) || '';
    const l = employee.lastname?.charAt(0) || '';
    return (f + l).toUpperCase();
  }

  getCompanyCity(company: any): string {
    if (company.city) return company.city;
    if (company.address) {
      const parts = company.address.split(',');
      return parts[parts.length - 1]?.trim() || '';
    }
    return '';
  }

  getStatusLabel(status: string): string {
    const map: any = {
      pending: 'En attente',
      refused: 'Refusée',
      accepted: 'Acceptée',
      deleted: 'Supprimée',
      cancelled: 'Annulée',
      finished: 'Terminée',
      'no-show-client': 'No show client',
      'no-show-pro': 'No show pro'
    };
    return map[status] || status;
  }
}
