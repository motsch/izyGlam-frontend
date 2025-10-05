import { Component, Input, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs/operators';
import { UserService } from 'src/app/core/services/user.service';

@Component({
  selector: 'app-shop-employees',
  templateUrl: './shop-employees.component.html',
  styleUrls: ['./shop-employees.component.scss']
})
export class ShopEmployeesComponent implements OnInit {
  /** Boss connecté (porté par le parent) */
  @Input() me: any = {};

  /** Liste des employés du boss */
  employees: any[] = [];

  /** Formulaire simple d’ajout */
  newEmployee: any = { email: '', firstname: '', lastname: '' };

  /** États UI */
  loading = false;        // chargement des employés
  isSubmitting = false;   // envoi du formulaire d’ajout
  feedbackMessage = '';   // message UX legacy (on garde, mais on privilégie les toasts)

  constructor(
    private userService: UserService,
    private translate: TranslateService,
    private toastr: ToastrService
  ) {}

  // -----------------------------
  // Utils i18n + Toasts
  // -----------------------------

  /** Raccourci i18n avec fallback sur la clé si manquante */
  private t(key: string): string {
    try {
      const tr = this.translate.instant(key);
      return tr && tr !== key ? tr : key;
    } catch {
      return key;
    }
  }

  /** Toast centralisé, success par défaut */
  private showCustomToast(message: string, type: 'success'|'error' = 'success'): void {
    try {
      if (type === 'success') this.toastr.success(message);
      else this.toastr.error(message);
    } catch (err) {
      // En cas d’échec Toastr, on ne casse pas l’UX
      console.warn('[ShopEmployees] showCustomToast WARN:', err, message);
    }
  }

  /** Validation email simple */
  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || '').trim());
  }

  // -----------------------------
  // Lifecycle
  // -----------------------------

  ngOnInit(): void {
    try {
      this.fetchEmployees();
    } catch (err) {
      console.error('[ShopEmployees] ngOnInit FATAL:', err);
      this.showCustomToast(this.t('ERROR.GENERIC_ERROR'), 'error');
    }
  }

  // -----------------------------
  // Actions
  // -----------------------------

  /**
   * Récupère les employés rattachés au boss
   */
  fetchEmployees(): void {
    try {
      this.loading = true;
      this.userService.getMyEmployees()
        .pipe(finalize(() => (this.loading = false)))
        .subscribe({
          next: (users: any[]) => {
            this.employees = users || [];
          },
          error: (err) => {
            console.error('[ShopEmployees] fetchEmployees ERROR:', err);
            this.showCustomToast(this.t('EMPLOYEES.FETCH_ERROR') || this.t('ERROR.GENERIC_ERROR'), 'error');
          }
        });
    } catch (err) {
      console.error('[ShopEmployees] fetchEmployees FATAL:', err);
      this.loading = false;
      this.showCustomToast(this.t('ERROR.GENERIC_ERROR'), 'error');
    }
  }

  /**
   * Ajoute un nouvel employé et l’attache au boss
   */
  addEmployee(): void {
    try {
      // —— validations front basiques
      if (!this.newEmployee.email || !this.newEmployee.firstname || !this.newEmployee.lastname) {
        this.feedbackMessage = this.t('EMPLOYEES.HAVE_TO');
        this.showCustomToast(this.feedbackMessage, 'error');
        return;
      }
      if (!this.isValidEmail(this.newEmployee.email)) {
        const msg = this.t('EMPLOYEES.EMAIL_INVALID') || 'Email invalide.';
        this.feedbackMessage = msg;
        this.showCustomToast(msg, 'error');
        return;
      }

      this.isSubmitting = true;
      this.feedbackMessage = '';

      this.userService
        .createAndAddEmployeeToBoss(this.newEmployee)
        .pipe(finalize(() => (this.isSubmitting = false)))
        .subscribe({
          next: (createdUser: any) => {
            // Ajout local optimiste réussi (la réponse contient généralement { employee: ... })
            const employee = createdUser?.employee || createdUser;
            if (employee) this.employees.push(employee);

            // Reset form
            this.newEmployee = { email: '', firstname: '', lastname: '' };

            // Feedback
            const okMsg = this.t('EMPLOYEES.EMPLOYEE_OK');
            this.feedbackMessage = okMsg;
            this.showCustomToast(okMsg, 'success');
          },
          error: (err) => {
            console.error('[ShopEmployees] addEmployee ERROR:', err);
            const msg = err?.error?.message || this.t('EMPLOYEES.ADD_EMPLOYEE_ERROR');
            this.feedbackMessage = msg;
            this.showCustomToast(msg, 'error');
          }
        });
    } catch (err) {
      console.error('[ShopEmployees] addEmployee FATAL:', err);
      this.isSubmitting = false;
      this.showCustomToast(this.t('ERROR.GENERIC_ERROR'), 'error');
    }
  }

  /**
   * Retire l’employé du boss (dissociation/suppression selon backend)
   * @param employeeId id de l’employé
   */
  removeEmployee(employeeId: string): void {
    try {
      if (!employeeId) {
        console.warn('[ShopEmployees] removeEmployee: missing employeeId');
        return;
      }

      this.userService.removeEmployeeFromBoss(employeeId).subscribe({
        next: () => {
          // MAJ liste locale
          this.employees = this.employees.filter(e => e._id !== employeeId);
          this.showCustomToast(this.t('EMPLOYEES.REMOVE_OK') || 'Employé retiré.', 'success');
        },
        error: (err) => {
          console.error('[ShopEmployees] removeEmployee ERROR:', err);
          this.showCustomToast(this.t('EMPLOYEES.REMOVE_ERROR') || this.t('ERROR.GENERIC_ERROR'), 'error');
        }
      });
    } catch (err) {
      console.error('[ShopEmployees] removeEmployee FATAL:', err);
      this.showCustomToast(this.t('ERROR.GENERIC_ERROR'), 'error');
    }
  }
}
