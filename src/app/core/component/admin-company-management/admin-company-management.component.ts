import { AfterViewInit, Component, OnInit } from '@angular/core';
import { CompanyService } from '../../services/company.service';
import { BookingService } from '../../services/booking.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-admin-company-management',
  templateUrl: './admin-company-management.component.html',
  styleUrls: ['./admin-company-management.component.scss'],
})
export class AdminCompanyManagementComponent implements OnInit, AfterViewInit {
  companies: any[] = [];
  loadingCompanies = false;

  expandedCompanyId: string | null = null;

  // --- employés par entreprise ---
  companyEmployees: { [companyId: string]: any[] | undefined } = {};
  loadingEmployees: { [companyId: string]: boolean } = {};

  // --- mot de passe par défaut (par entreprise, côté UI uniquement pour l’instant) ---
  showPasswordSettings: { [companyId: string]: boolean } = {};
  passwordVisible: { [companyId: string]: boolean } = {};
  defaultCompanyPassword: { [companyId: string]: string } = {};

  // Modal employé (liste de bookings)
  employeeModalOpen = false;
  selectedEmployee: any | null = null;
  employeeBookings: any[] = [];
  loadingBookings = false;

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
    credit: 0,
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
    // placeholder si besoin
  }

  // --- Chargement des entreprises ---
  loadCompanies(): void {
    this.loadingCompanies = true;
    this.companyService.getAll().subscribe({
      next: (companies: any[]) => {
        this.companies = companies || [];
        this.loadingCompanies = false;
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des entreprises', err);
        this.loadingCompanies = false;
      },
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
        this.companyEmployees[companyId] = employees || [];

        const idx = this.companies.findIndex((c: any) => c._id === companyId);
        if (idx !== -1) {
          this.companies[idx] = {
            ...this.companies[idx],
            employeesCount: employees.length,
          };
        }

        // init valeurs UI pour le bloc mot de passe si besoin
        if (!this.defaultCompanyPassword[companyId]) {
          this.defaultCompanyPassword[companyId] = 'izyGlam2026!';
        }

        this.loadingEmployees[companyId] = false;
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des employés', err);
        this.loadingEmployees[companyId] = false;
      },
    });
  }

  // --- Helpers budget par entreprise ---
  getCompanyTotalCredit(company: any): number {
    // tu peux adapter la logique si tu as un champ dédié
    return (
      Number(company?.contractAmount) ||
      Number(company?.totalCredit) ||
      Number(company?.credit) ||
      0
    );
  }

  getCompanyAllocatedCredit(company: any): number {
    const list = this.companyEmployees[company._id] || [];
    return list.reduce((sum, emp: any) => sum + (Number(emp.credit) || 0), 0);
  }

  getCompanyRemainingCredit(company: any): number {
    const total = this.getCompanyTotalCredit(company);
    const allocated = this.getCompanyAllocatedCredit(company);
    const remaining = total - allocated;
    return remaining > 0 ? remaining : 0;
  }

  // --- Edition du crédit total (placeholder pour l’instant) ---
  openCompanyCreditEdit(company: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    // TODO: ouvrir une modal / formulaire dédié si tu veux rendre ça éditable
    console.log('Ouverture édition crédit entreprise', company?._id);
  }

  // --- Gestion du bloc mot de passe par défaut ---
  togglePasswordSettings(company: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const companyId = company?._id;
    if (!companyId) return;

    this.showPasswordSettings[companyId] = !this.showPasswordSettings[companyId];

    if (!this.defaultCompanyPassword[companyId]) {
      this.defaultCompanyPassword[companyId] = 'izyGlam2026!';
    }
  }

  togglePasswordVisibility(company: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const companyId = company?._id;
    if (!companyId) return;

    this.passwordVisible[companyId] = !this.passwordVisible[companyId];
  }

  cancelPasswordEdit(company: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const companyId = company?._id;
    if (!companyId) return;

    this.defaultCompanyPassword[companyId] = 'izyGlam2026!';
    this.passwordVisible[companyId] = false;
  }

  saveDefaultPassword(company: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const companyId = company?._id;
    if (!companyId) return;

    const pwd = this.defaultCompanyPassword[companyId] || '';
    // Pour l’instant c’est uniquement un paramètre UI
    // Tu pourras plus tard faire un this.companyService.updateDefaultPassword(companyId, pwd)
    console.log('Mot de passe par défaut pour la société', companyId, ':', pwd);
  }

  // --- Modal création employé ---
  openEmployeeCreateModal(company: any, event?: Event): void {
    if (event) event.stopPropagation();
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
      credit: 0,
    };
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
        this.employeeBookings = bookings || [];
        this.loadingBookings = false;

        if (this.selectedEmployee) {
          const companyId = this.selectedEmployee.companyId;
          const employees = this.companyEmployees[companyId];

          if (employees && employees.length) {
            const index = employees.findIndex((e: any) => e._id === employeeId);
            if (index !== -1) {
              employees[index] = {
                ...employees[index],
                totalBookings: bookings.length,
              };
            }
          }

          this.selectedEmployee = {
            ...this.selectedEmployee,
            totalBookings: bookings.length,
          };
        }
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des bookings', err);
        this.loadingBookings = false;
      },
    });
  }

  // --- Helpers --- //
  getInitials(employee: any): string {
    const f = employee?.firstname?.charAt(0) || '';
    const l = employee?.lastname?.charAt(0) || '';
    return (f + l).toUpperCase();
  }

  getCompanyCity(company: any): string {
    if (company?.city) return company.city;
    if (company?.address) {
      const parts = String(company.address).split(',');
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
      'no-show-pro': 'No show pro',
    };
    return map[status] || status;
  }

  // -----------------------------
  // Crédit employé (champ editable)
  // -----------------------------
  saveEmployeeCredit(emp: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const companyId = emp?.companyId || this.expandedCompanyId;
    if (!companyId) return;

    const newCredit = Number(emp.credit) || 0;

    this.companyService
      .updateEmployeeCurrentCredit(companyId, emp._id, newCredit)
      .subscribe({
        next: (res: any) => {
          const updatedEmployee = res.employee;
          const updatedCompany = res.company;

          const employees = this.companyEmployees[companyId] || [];
          this.companyEmployees[companyId] = employees.map((e: any) =>
            e._id === updatedEmployee._id ? { ...e, ...updatedEmployee } : e
          );

          const idx = this.companies.findIndex((c: any) => c._id === companyId);
          if (idx !== -1) {
            this.companies[idx] = { ...updatedCompany };
          }
        },
        error: (err: any) => {
          console.error(
            'Erreur lors de la mise à jour du crédit employé',
            err
          );
        },
      });
  }

  // -----------------------------
  // Création d’un employé rattaché
  // -----------------------------
  submitEmployee(): void {
    if (this.creatingEmployee || !this.employeeCompanyContext) return;

    this.creatingEmployee = true;
    const companyId = this.employeeCompanyContext._id;

    const payload = {
      firstname: this.newEmployee.firstname,
      lastname: this.newEmployee.lastname,
      email: this.newEmployee.email,
      phone: this.newEmployee.phone,
      sex: this.newEmployee.sex,
      initialCredit: this.newEmployee.credit || 0,
      companyRole: 'employee',
    };

    this.companyService.createCompanyEmployee(companyId, payload).subscribe({
      next: (res: any) => {
        const created = res.employee;
        const updatedCompany = res.company;

        if (!this.companyEmployees[companyId]) {
          this.companyEmployees[companyId] = [];
        }

        this.companyEmployees[companyId] = [
          created,
          ...this.companyEmployees[companyId]!,
        ];

        const idx = this.companies.findIndex((c: any) => c._id === companyId);
        if (idx !== -1) {
          this.companies[idx] = { ...updatedCompany };
        }

        this.creatingEmployee = false;
        this.closeEmployeeCreateModal();
      },
      error: (err: any) => {
        console.error("Erreur lors de la création de l'employé", err);
        this.creatingEmployee = false;
      },
    });
  }

  // -----------------------------
  // Activer / désactiver un employé
  // -----------------------------
  deactivateEmployee(emp: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    const companyId = emp?.companyId || this.expandedCompanyId;
    if (!companyId) return;

    const newStatus = !emp.active; // toggle

    this.companyService
      .updateEmployeeStatus(companyId, emp._id, newStatus)
      .subscribe({
        next: (res: any) => {
          const updatedEmployee = res.employee;
          const updatedCompany = res.company;

          const employees = this.companyEmployees[companyId] || [];
          this.companyEmployees[companyId] = employees.map((e: any) =>
            e._id === updatedEmployee._id ? { ...e, ...updatedEmployee } : e
          );

          const idx = this.companies.findIndex((c: any) => c._id === companyId);
          if (idx !== -1) {
            this.companies[idx] = { ...updatedCompany };
          }
        },
        error: (err: any) => {
          console.error('Erreur lors du changement de statut employé', err);
        },
      });
  }

  // -----------------------------
  // Reset des allocations de tous les employés d’une entreprise
  // -----------------------------
  resetAllocations(company?: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const companyId = company?._id || this.expandedCompanyId;
    if (!companyId) return;

    this.loadingEmployees[companyId] = true;

    this.companyService.resetCompanyAllocations(companyId).subscribe({
      next: (res: any) => {
        this.companyEmployees[companyId] = res.employees;

        const idx = this.companies.findIndex((c: any) => c._id === companyId);
        if (idx !== -1) {
          this.companies[idx] = { ...res.company };
        }

        this.loadingEmployees[companyId] = false;
      },
      error: (err: any) => {
        console.error('Erreur lors du reset des allocations', err);
        this.loadingEmployees[companyId] = false;
      },
    });
  }

  // -----------------------------
  // Distribution du crédit restant entre employés actifs
  // -----------------------------
  distributeRemainingCredit(company: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (!company?._id) return;

    const companyId = company._id;
    const remaining = this.getCompanyRemainingCredit(company);
    if (remaining <= 0) return;

    const employees = (this.companyEmployees[companyId] || []).filter(
      (e: any) => e.active !== false
    );
    if (!employees.length) return;

    const nb = employees.length;
    const share = Math.floor(remaining / nb);
    let remainder = remaining - share * nb;

    if (share <= 0 && remainder <= 0) return;

    // On applique la répartition côté front en série pour éviter trop de requêtes simultanées
    const updateNext = (index: number) => {
      if (index >= employees.length) {
        // on recharge la liste pour être sûr
        this.loadCompanyEmployees(companyId);
        return;
      }

      const emp = employees[index];
      const extra = remainder > 0 ? 1 : 0;
      if (remainder > 0) remainder--;

      const newCredit = (Number(emp.credit) || 0) + share + extra;

      this.companyService
        .updateEmployeeCurrentCredit(companyId, emp._id, newCredit)
        .subscribe({
          next: () => updateNext(index + 1),
          error: (err: any) => {
            console.error(
              'Erreur lors de la mise à jour du crédit employé (distribution)',
              err
            );
            updateNext(index + 1);
          },
        });
    };

    updateNext(0);
  }


  changeEmployeeCompanyRole(companyId: string, emp: any, newRole: string): void {
  if (!companyId || !emp?._id) return;

  // Update optimiste (optionnel mais agréable)
  const previous = emp.companyRole;
  emp.companyRole = newRole;

  this.companyService.updateEmployeeCompanyRole(companyId, emp._id, newRole).subscribe({
    next: (res: any) => {
      const updatedEmployee = res.employee ?? res; // selon ta réponse backend
      const employees = this.companyEmployees[companyId] || [];

      this.companyEmployees[companyId] = employees.map((e: any) =>
        e._id === emp._id ? { ...e, ...updatedEmployee } : e
      );
    },
    error: (err: any) => {
      console.error('Erreur lors de la mise à jour du rôle employé', err);
      // rollback si erreur
      emp.companyRole = previous;
    },
  });
}




  // -----------------------------
  // Reset du mot de passe employé
  // -----------------------------
  resetEmployeePassword(emp: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (!emp?._id) return;

    this.userService.resetEmployeePassword(emp._id).subscribe({
      next: () => {
        console.log(
          "Mot de passe réinitialisé pour l'employé",
          emp._id.toString()
        );
        // TODO: toast de succès
      },
      error: (err: any) => {
        console.error(
          'Erreur lors du reset du mot de passe employé',
          err
        );
        // TODO: toast d'erreur
      },
    });
  }
}
