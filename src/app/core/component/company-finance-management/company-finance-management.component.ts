import { Component, Input, OnInit } from '@angular/core';
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
  selector: 'app-company-finance-management',
  templateUrl: './company-finance-management.component.html',
  styleUrls: ['./company-finance-management.component.scss']
})
export class CompanyFinanceManagementComponent implements OnInit {
  // 🔌 Entrées du parent
  @Input() myCompany: any = {};
  @Input() employees: any[] = [];

  // 💶 Montant saisi pour créditer l’entreprise
  creditAmount: number = 0;

  // 🧾 Copie locale immuable pour l’édition côté UI (si besoin)
  myCompanyCopy: any = {};

  // 📑 Liste des “factures” affichées (exemples)
  invoices: Invoice[] = [];

  constructor(
    // ⚠️ Garder ces services injectés si le template ou l’évolution future en a besoin
    private modalService: NgbModal,
    private companyService: CompanyService,
    private userService: UserService,

    // ✅izyGlam
    private translate: TranslateService,
    private toastr: ToastrService
  ) {}

  // ------------------------------------------------------------
  // ⏱️ Cycle de vie
  // ------------------------------------------------------------
  ngOnInit(): void {
    try {
      // Cloner l’objet reçu pour éviter les mutations surprises
      this.myCompanyCopy = { ...this.myCompany };

      // 🧪 Seed d’invoices de démonstration, avec garde si employees vide
      const emp0 = this.employees?.[0] || null;
      const emp1 = this.employees?.[1] || null;

      this.invoices = [
        {
          date: new Date(),
          amount: 100,
          employee: emp0,
          description: 'Achat produit X',
        },
        {
          date: new Date(),
          amount: 200,
          employee: emp1,
          description: 'Achat service Y',
        },
      ];
    } catch (err) {
      console.error('Erreur pendant ngOnInit de CompanyFinanceManagementComponent :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // ------------------------------------------------------------
  // 💳 Créditer le compte de l’entreprise
  // ------------------------------------------------------------
  creditCompanyAccount(): void {
    try {
      // Validation basique du montant
      const amount = Number(this.creditAmount);
      if (isNaN(amount) || amount <= 0) {
        // Message clair pour l’utilisateur
        this.showCustomToast(this.translate.instant('ERROR.INVALID_AMOUNT') || 'Montant invalide.');
        return;
      }

      // Garantir un champ numérique pour le crédit actuel
      const currentCredit = Number(this.myCompany?.credit) || 0;

      // Mise à jour du solde local (si l’API doit être appelée, brancher ici)
      this.myCompany.credit = currentCredit + amount;

      // Reset champ UI
      this.creditAmount = 0;

      // ✅ Feedback succès
      this.showSuccessToast(
        this.translate.instant('SUCCESS.COMPANY_CREDITED') || 'Solde crédité avec succès.'
      );

      // 👉 Si besoin d’enregistrer côté serveur :
      // this.companyService.update(this.myCompany).subscribe({
      //   next: (updated: any) => {
      //     this.myCompany = updated;
      //     this.myCompanyCopy = { ...updated };
      //     this.showSuccessToast(this.translate.instant('SUCCESS.COMPANY_CREDITED'));
      //   },
      //   error: (err) => {
      //     console.error('Erreur lors de la sauvegarde du crédit entreprise :', err);
      //     this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
      //   }
      // });

    } catch (err) {
      console.error('Erreur lors du crédit du compte entreprise :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // ------------------------------------------------------------
  // 🧰 (exemple) Ouvrir une modale de créditer un employé
  // ------------------------------------------------------------
  // openCreditEmployeeModal(employee: any): void {
  //   try {
  //     const ref = this.modalService.open(CreditEmployeeModalComponent, { size: 'md' });
  //     ref.componentInstance.employee = employee;
  //     ref.result.then(
  //       (result) => {
  //         // Traiter le résultat si besoin
  //       },
  //       () => {} // Dismiss
  //     );
  //   } catch (err) {
  //     console.error('Erreur à l’ouverture de la modale de crédit employé :', err);
  //     this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
  //   }
  // }

  // ------------------------------------------------------------
  // ✨ ToastsizyGlam
  // ------------------------------------------------------------
  private showCustomToast(message: string) {
    // Erreurs → .error()
    this.toastr.error(message);
  }

  private showSuccessToast(message: string) {
    // Succès → .success()
    this.toastr.success(message);
  }
}
