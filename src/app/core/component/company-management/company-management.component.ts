import {
  Component,
  OnInit,
  OnChanges,
  Input,
  SimpleChanges,
} from '@angular/core';
import { CompanyService } from '../../services/company.service';
import { BookingService } from '../../services/booking.service';

@Component({
  selector: 'app-company-management',
  templateUrl: './company-management.component.html',
  styleUrls: ['./company-management.component.scss'],
})
export class CompanyManagementComponent implements OnInit, OnChanges {
  /**
   * Id de la company en cours.
   * 👉 Tu peux le passer depuis le parent ou le récupérer
   * via ton AuthService et le setter ici plus tard.
   */
  @Input() companyId: string | null = null;

  company: any | null = null;
  loadingCompany = false;

  employees: any[] = [];
  loadingEmployees = false;

  // Stats crédits
  get totalCompanyCredit(): number {
    return this.company?.credit || 0;
  }

  get totalAllocatedCredit(): number {
    return this.employees.reduce(
      (sum, e: any) => sum + (Number(e.credit) || 0),
      0
    );
  }

  get remainingCredit(): number {
    return this.totalCompanyCredit - this.totalAllocatedCredit;
  }

  // Modal employés / bookings
  employeeModalOpen = false;
  selectedEmployee: any | null = null;
  employeeBookings: any[] = [];
  loadingBookings = false;

  // Modal création employé
  employeeCreateModalOpen = false;
  creatingEmployee = false;
  newEmployee: any = {
    firstname: '',
    lastname: '',
    email: '',
    phone: '',
    sex: 'female',
    credit: 0,
  };

  // Edition crédit entreprise
  editingCompanyCredit = false;
  editedCompanyCredit: number | null = null;
  savingCompanyCredit = false;

  constructor(
    private companyService: CompanyService,
    private bookingService: BookingService
  ) {}

  ngOnInit(): void {
    this.tryInit();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['companyId'] && !changes['companyId'].firstChange) {
      this.tryInit();
    }
  }

  private tryInit(): void {
    // Si pas encore d'id, on ne fait rien (tu pourras brancher ton Auth ici)
    if (!this.companyId) {
      return;
    }
    this.loadCompany();
    this.loadEmployees();
  }

  // --- Chargement company + employés ---

  loadCompany(): void {
    if (!this.companyId) return;

    this.loadingCompany = true;
    this.companyService.getById(this.companyId).subscribe({
      next: (company: any) => {
        this.company = company;
        this.loadingCompany = false;
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement de la company', err);
        this.loadingCompany = false;
      },
    });
  }

  loadEmployees(): void {
    if (!this.companyId) return;

    this.loadingEmployees = true;
    this.companyService.getCompanyEmployees(this.companyId).subscribe({
      next: (employees: any[]) => {
        this.employees = employees;
        this.loadingEmployees = false;
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des employés', err);
        this.loadingEmployees = false;
      },
    });
  }

  // --- Crédit entreprise ---

  startEditCompanyCredit(): void {
    if (!this.company) return;
    this.editedCompanyCredit = this.company.credit || 0;
    this.editingCompanyCredit = true;
  }

  cancelEditCompanyCredit(): void {
    this.editingCompanyCredit = false;
    this.editedCompanyCredit = null;
  }

  saveCompanyCredit(): void {
    if (!this.company || this.editedCompanyCredit == null) return;
    if (!this.companyId) return;

    this.savingCompanyCredit = true;

    const payload = { ...this.company, credit: this.editedCompanyCredit };

    // 👉 Ici on passe par CompanyService.update
    this.companyService.update(payload).subscribe({
      next: (updated: any) => {
        this.company = updated;
        this.savingCompanyCredit = false;
        this.editingCompanyCredit = false;
      },
      error: (err: any) => {
        console.error('Erreur lors de la mise à jour du crédit entreprise', err);
        this.savingCompanyCredit = false;
      },
    });
  }

  // --- Gestion crédits des employés ---

  onEmployeeCreditChange(emp: any, value: string): void {
    const num = Number(value);
    if (isNaN(num) || num < 0) return;
    emp.credit = num;
  }

  saveEmployeeCredit(emp: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    // 👉 Ici on pourrait appeler une route PUT /users/:id
    // Pour l'instant on log + TODO pour que tu puisses brancher ton backend
    console.log('TODO: appeler API update user credit', {
      userId: emp._id,
      credit: emp.credit,
    });
  }

  // --- Modal création employé ---

  openEmployeeCreateModal(): void {
    this.resetNewEmployee();
    this.employeeCreateModalOpen = true;
  }

  closeEmployeeCreateModal(): void {
    this.employeeCreateModalOpen = false;
  }

  resetNewEmployee(): void {
    this.newEmployee = {
      firstname: '',
      lastname: '',
      email: '',
      phone: '',
      sex: 'female',
      credit: 0,
    };
  }

  submitEmployee(): void {
    if (!this.companyId) return;
    if (this.creatingEmployee) return;

    this.creatingEmployee = true;

    const payload = {
      ...this.newEmployee,
      companyId: this.companyId,
      role: 'user', // ou "entreprise" selon ton modèle
    };

    console.log('TODO: créer employé via API', payload);
    // 👉 tu pourras remplacer ce console.log par un vrai appel
    // ex: this.userService.create(payload).subscribe(...)

    // pour l’instant, on simule le push local
    const fakeEmployee = {
      _id: 'temp-' + Date.now(),
      ...payload,
      totalBookings: 0,
    };
    this.employees = [fakeEmployee, ...this.employees];

    this.creatingEmployee = false;
    this.closeEmployeeCreateModal();
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

        // On garde le total à jour pour l'affichage
        if (this.selectedEmployee) {
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

  // --- Actions diverses sur employé ---

  resetEmployeePassword(emp: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    console.log('TODO: reset mot de passe pour', emp._id);
    // 👉 tu pourras ici appeler une route dédiée type POST /users/:id/reset-password
  }

  deactivateEmployee(emp: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    console.log('TODO: désactiver employé', emp._id);
    // 👉 même principe : tu ajouteras une route backend
  }

  // --- Helpers display ---

  getInitials(employee: any): string {
    const f = employee.firstname?.charAt(0) || '';
    const l = employee.lastname?.charAt(0) || '';
    return (f + l).toUpperCase();
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
}
