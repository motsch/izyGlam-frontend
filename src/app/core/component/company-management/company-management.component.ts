import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { UserService } from '../../services/user.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreditEmployeeModalComponent } from '../credit-employee-modal/credit-employee-modal.component';
import { CompanyService } from '../../services/company.service';

// ✅izyGlam: traductions & toasts
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

interface Invoice {
  date: Date;
  amount: number;
  employee: any;
  description: string;
}

@Component({
  selector: 'app-company-management',
  templateUrl: './company-management.component.html',
  styleUrls: ['./company-management.component.scss'],
})
export class CompanyManagementComponent implements OnInit, OnChanges {
  // 🔌 Données reçues du parent
  @Input() myCompany: any = {};
  @Input() employees: any[] = [];

  // 🧾 Copie locale pour manipuler sans muter directement l’@Input
  myCompanyCopy: any = {};

  // 📑 Démo de liste de “factures” si besoin d’affichage
  invoices: Invoice[] = [];

  constructor(
    private userService: UserService,
    private modalService: NgbModal,

    // (non utilisé ici mais gardé si besoin d’API côté entreprise)
    private companyService: CompanyService,

    // ✅izyGlam
    private translate: TranslateService,
    private toastr: ToastrService
  ) { }

  // ------------------------------------------------------------
  // ⏱️ Cycle de vie
  // ------------------------------------------------------------
  ngOnInit(): void {
    try {
      localStorage.setItem('menu-param', 'company');

      // Si les inputs sont déjà fournis à l'init
      this.updateCompany();
      this.updateEmployees();
    } catch (err) {
      console.error('Erreur pendant ngOnInit CompanyManagementComponent :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    try {
      // Mise à jour si la société change
      if (changes['myCompany'] && changes['myCompany'].currentValue) {
        this.updateCompany();
      }
      // Mise à jour si la liste d’employés change
      if (changes['employees'] && changes['employees'].currentValue) {
        this.updateEmployees();
      }
    } catch (err) {
      console.error('Erreur pendant ngOnChanges CompanyManagementComponent :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // ------------------------------------------------------------
  // 🏢 MAJ données entreprise (copie locale)
  // ------------------------------------------------------------
  private updateCompany(): void {
    try {
      console.log('CompanyManagementComponent.myCompany', this.myCompany);
      this.myCompanyCopy = { ...this.myCompany };

      // Garde-fou sur le crédit pour éviter NaN
      if (typeof this.myCompanyCopy.credit !== 'number') {
        const parsed = Number(this.myCompanyCopy.credit);
        this.myCompanyCopy.credit = isNaN(parsed) ? 0 : parsed;
      }
    } catch (err) {
      console.error('Erreur updateCompany :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // ------------------------------------------------------------
  // 👥 MAJ liste employé·e·s (on garde ton comportement)
  // ⚠️ Note: le code d’origine remplaçait myCompanyCopy par employees,
  // je conserve le comportement pour ne rien casser.
  // ------------------------------------------------------------
  private updateEmployees(): void {
    try {
      console.log('CompanyManagementComponent.employees', this.employees);
      this.myCompanyCopy = { ...this.employees };
    } catch (err) {
      console.error('Erreur updateEmployees :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // ------------------------------------------------------------
  // ➕ Créer un employé (placeholder)
  // ------------------------------------------------------------
  createEmployee(): void {
    try {
      console.log('Créer un nouvel employé');
      // Ici tu brancheras ton flux de création (modale, formulaire, etc.)
    } catch (err) {
      console.error('Erreur createEmployee :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // ------------------------------------------------------------
  // 💳 Créditer un employé via modale
  // ------------------------------------------------------------
  creditEmployee(employee: any): void {
    try {
      const modalRef = this.modalService.open(CreditEmployeeModalComponent);
      modalRef.componentInstance.employee = employee;

      modalRef.result.then(
        (result) => {
          // Le résultat contient le montant à créditer
          if (result > 0) {
            const employeeCurrentCredit = Number(employee?.credit) || 0;
            const companyCurrentCredit = Number(this.myCompany?.credit) || 0;

            // Garde: ne pas passer sous zéro si tu veux l’empêcher
            if (companyCurrentCredit < result) {
              this.showCustomToast(this.translate.instant('ERROR.INSUFFICIENT_COMPANY_CREDIT'));
              return;
            }

            employee.credit = employeeCurrentCredit + Number(result);
            this.myCompany.credit = companyCurrentCredit - Number(result);

            // ✅ Optionnel: toast succès
            this.toastr.success(this.translate.instant('SUCCESS.EMPLOYEE_CREDITED'));
          }
        },
        (reason) => {
          console.log('Modal dismissed: ', reason);
        }
      );
    } catch (err) {
      console.error('Erreur creditEmployee :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // ------------------------------------------------------------
  // 🔑 Réinitialiser le mot de passe d’un employé
  // ------------------------------------------------------------
  resetPassword(employee: any): void {
    try {
      console.log('Réinitialiser le mot de passe pour', employee?.name);

      // Définit le mot de passe au mot de passe par défaut de l’entreprise
      employee.password = this.myCompany?.defaultPassword;

      this.userService.updatePassword(employee).subscribe({
        next: (data: any) => {
          console.log('Mot de passe réinitialisé:', data);
          // ✅ Optionnel: toast succès
          // this.toastr.success(this.translate.instant('SUCCESS.PASSWORD_RESET'));
        },
        error: (error: any) => {
          console.error('Erreur lors de la réinitialisation du mot de passe:', error);
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        },
      });
    } catch (err) {
      console.error('Erreur resetPassword :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // ------------------------------------------------------------
  // 🗑️ Supprimer un employé
  // ------------------------------------------------------------
  deleteEmployee(employee: any): void {
    try {
      this.userService.delete(employee?._id).subscribe({
        next: (data: any) => {
          console.log('Employé supprimé :', employee?.name, data);
          this.employees = this.employees.filter((e) => e._id !== employee._id);
          // ✅ Optionnel: toast succès
          // this.toastr.success(this.translate.instant('SUCCESS.EMPLOYEE_DELETED'));
        },
        error: (error: any) => {
          console.error('Erreur lors de la suppression de l’employé :', error);
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        },
      });
    } catch (err) {
      console.error('Erreur deleteEmployee :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // ------------------------------------------------------------
  // ✨ ToastizyGlam centralisé
  // ------------------------------------------------------------
  private showCustomToast(message: string) {
    this.toastr.error(message);
  }
}
