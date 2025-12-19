import {
  Component,
  OnInit,
  OnChanges,
  Input,
  SimpleChanges,
} from '@angular/core';
import { CompanyService } from '../../services/company.service';
import { BookingService } from '../../services/booking.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-company-management',
  templateUrl: './company-management.component.html',
  styleUrls: ['./company-management.component.scss'],
})
export class CompanyManagementComponent implements OnInit, OnChanges {
  @Input() companyId: string | null = null;

  company: any | null = null;
  loadingCompany = false;

  employees: any[] = [];
  loadingEmployees = false;
  // Stats crédits
  get totalCompanyCredit(): number {
    return this.company?.credit || 0;
  }

  // Company employee crédits
  get employeeCredit(): number {
    return this.company?.roleCreditConfig.employee || 0;
  }

  // Company employee crédits
  get managerCredit(): number {
    return this.company?.roleCreditConfig.manager || 0;
  }

  // Company employee crédits
  get executiveCredit(): number {
    return this.company?.roleCreditConfig.executive || 0;
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

  // Param mot de passe par défaut
  showPasswordSettings = false;
  passwordVisible = false;
  defaultPassword = 'izyGlam2026!'; // valeur par défaut UI (à adapter si tu veux la charger du back)

  constructor(
    private companyService: CompanyService,
    private bookingService: BookingService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.tryInit();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['companyId'] && !changes['companyId'].firstChange) {
      this.tryInit();
    }
  }

  private tryInit(): void {
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
        this.defaultPassword = company.defaultPassword;
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
        this.employees = employees || [];
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
    if (this.remainingCredit <= 0) return;
    if (!this.company || this.editedCompanyCredit == null) return;
    if (!this.companyId) return;

    this.savingCompanyCredit = true;

    const payload = { ...this.company, credit: this.editedCompanyCredit };

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



  changeEmployeeCompanyRole(emp: any, newRole: string): void {
    if (!this.companyId || !emp?._id) return;

    const allowed = ['employee', 'manager', 'executive'];
    if (!allowed.includes(newRole)) return;

    // Update optimiste
    const previous = emp.companyRole;
    emp.companyRole = newRole;

    this.companyService
      .updateEmployeeCompanyRole(this.companyId, emp._id, newRole)
      .subscribe({
        next: (res: any) => {
          const updatedEmployee = res.employee ?? res;

          this.employees = (this.employees || []).map((e: any) =>
            e._id === emp._id ? { ...e, ...updatedEmployee } : e
          );

          // Si ton backend renvoie aussi company : on la met à jour
          if (res.company) {
            this.company = { ...(res.company || this.company) };
          }
        },
        error: (err: any) => {
          console.error('Erreur lors de la mise à jour du rôle employé', err);
          // rollback si erreur
          emp.companyRole = previous;
        },
      });
  }



  // --- Bloc mot de passe par défaut ---

  togglePasswordSettings(): void {
    this.showPasswordSettings = !this.showPasswordSettings;
  }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  cancelPasswordEdit(): void {
    // reset à une valeur par défaut (tu peux la remplacer par celle venant du back)
    this.defaultPassword = 'izyGlam2026!';
    this.passwordVisible = false;
  }

  saveDefaultPassword(): void {
    // Ici tu pourras appeler une route type:
    // this.companyService.updateDefaultPassword(this.companyId, pwd).subscribe(...)
    this.company.defaultPassword = this.defaultPassword;
    this.companyService.update(this.company)
      .subscribe({
        next: (res: any) => {
          const updatedEmployee = res.employee;
          const updatedCompany = res.company;

          // maj liste employés
          this.employees = (this.employees || []).map((e: any) =>
            e._id === updatedEmployee._id ? { ...e, ...updatedEmployee } : e
          );

          // maj company
          this.company = { ...(updatedCompany || this.company) };
        },
        error: (err: any) => {
          console.error(
            'Erreur lors de la mise à jour du crédit employé',
            err
          );
        },
      });
  }

  // --- Gestion crédits des employés ---

  onEmployeeCreditChange(emp: any, value: string): void {

    if (this.remainingCredit <= 0) return;
    const num = Number(value);
    if (isNaN(num) || num < 0) return;
    emp.credit = num;
  }

  saveEmployeeCredit(emp: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }

    if (this.remainingCredit <= 0) {
      // optionnel: toast/info
      // this.showToast("Crédit épuisé. Paiement requis bientôt.", true);
      return;
    }
    if (!this.companyId) return;

    const newCredit = Number(emp.credit) || 0;

    this.companyService
      .updateEmployeeCurrentCredit(this.companyId, emp._id, newCredit)
      .subscribe({
        next: (res: any) => {
          const updatedEmployee = res.employee;
          const updatedCompany = res.company;

          // maj liste employés
          this.employees = (this.employees || []).map((e: any) =>
            e._id === updatedEmployee._id ? { ...e, ...updatedEmployee } : e
          );

          // maj company
          this.company = { ...(updatedCompany || this.company) };
        },
        error: (err: any) => {
          console.error(
            'Erreur lors de la mise à jour du crédit employé',
            err
          );
        },
      });
  }

  // --- Bouton rond 1 : reset allocations de tous les employés ---

  resetAllocations(): void {
    if (!this.companyId) return;

    this.loadingEmployees = true;

    this.companyService.resetCompanyAllocations(this.companyId).subscribe({
      next: (res: any) => {
        this.employees = res.employees || this.employees;
        this.company = { ...(res.company || this.company) };
        this.loadingEmployees = false;
      },
      error: (err: any) => {
        console.error('Erreur lors du reset des allocations', err);
        this.loadingEmployees = false;
      },
    });
  }

  // --- Bouton rond 2 : distribuer équitablement le crédit restant ---

  distributeRemainingCredit(): void {
    if (!this.companyId) return;

    const remaining = this.remainingCredit;
    if (remaining <= 0) return;

    const activeEmployees = (this.employees || []).filter(
      (e: any) => e.active !== false
    );
    if (!activeEmployees.length) return;

    const nb = activeEmployees.length;
    const share = Math.floor(remaining / nb);
    let remainder = remaining - share * nb;

    if (share <= 0 && remainder <= 0) return;

    const updateNext = (index: number) => {
      if (index >= activeEmployees.length) {
        // une fois fini, on recharge la liste pour être clean
        this.loadEmployees();
        this.loadCompany();
        return;
      }

      const emp = activeEmployees[index];
      const extra = remainder > 0 ? 1 : 0;
      if (remainder > 0) remainder--;

      const newCredit = (Number(emp.credit) || 0) + share + extra;

      this.companyService
        .updateEmployeeCurrentCredit(this.companyId!, emp._id, newCredit)
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
      companyRole: 'employee',
      lastname: '',
      email: '',
      phone: '',
      sex: 'female',
      password: this.defaultPassword,
      credit: this.employeeCredit,
    };
  }

  submitEmployee(): void {
    if (!this.companyId) return;
    if (this.creatingEmployee) return;
    this.editedCompanyCredit = this.totalCompanyCredit + this.employeeCredit;
    this.creatingEmployee = true;

    const payload = {
      ...this.newEmployee,
      companyId: this.companyId,
      role: 'user',
    };

    console.log('TODO: créer employé via API', payload);
    // À brancher avec ton vrai userService

    this.userService.create(payload).subscribe({
      next: (employee: any) => {
        console.log("RETOUR AJOUT EMPLOYEE");
        console.log(employee);

        // this.company = updated;
        this.employees = [employee, ...this.employees];

        const payloadCredit = { ...this.company, credit: this.editedCompanyCredit };

        this.companyService.update(payloadCredit).subscribe({
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
        this.creatingEmployee = false;
        this.closeEmployeeCreateModal();

      },
      error: (err: any) => {
        console.error('Erreur lors de la mise à jour du crédit entreprise', err);
        this.savingCompanyCredit = false;
      },
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
        this.employeeBookings = bookings || [];
        this.loadingBookings = false;
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
    emp.password = this.defaultPassword;
    this.userService.updatePassword(emp).subscribe({
      next: (employeeUpdated: any) => {
        console.log(employeeUpdated);
      },
      error: (err: any) => {
        console.error('Erreur lors de la mise à jour du mdp employé', err);
      },
    });

  }

  deactivateEmployee(emp: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    emp.active = !emp.active;
    console.log('TODO: désactiver employé', emp._id);
    // Idem : à brancher avec un update de statut côté backend

    this.userService.update(emp).subscribe({
      next: (employeeUpdated: any) => {
        console.log("RETOUR AJOUT EMPLOYEE");
        console.log(employeeUpdated);

      },
      error: (err: any) => {
        console.error('Erreur lors de la mise à jour du crédit entreprise', err);
        this.savingCompanyCredit = false;
      },
    });
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
