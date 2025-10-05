import { Component, Input, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreditEmployeeModalComponent } from '../credit-employee-modal/credit-employee-modal.component';
import { CompanyService } from '../../services/company.service';

// ✅ IzyGlam: traductions & toasts
import { TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';

interface Invoice {
  date: Date;
  amount: number;
  employee: any;
  description: string;
}

@Component({
  selector: 'app-company-set-default-password',
  templateUrl: './company-set-default-password.component.html',
  styleUrls: ['./company-set-default-password.component.scss'],
})
export class CompanySetDefaultPasswordComponent implements OnInit {
  // 🔌 Donnée reçue du parent (profil de l’entreprise)
  @Input() myCompany: any = {};

  // 🧾 Copie locale pour modifications sans muter l’@Input
  myCompanyCopy: any = {};

  // 🔑 Nouveau mot de passe par défaut saisi dans le formulaire
  defaultPassword: string = '';

  // (Présent dans le fichier d’origine — conservé)
  invoices: Invoice[] = [];

  constructor(
    private userService: UserService,          // gardé si besoin futur
    private companyService: CompanyService,     // utilisé pour sauvegarder le mot de passe
    private translate: TranslateService,        // ✅ I18n
    private toastr: ToastrService               // ✅ Toasts IzyGlam
  ) {}

  // ------------------------------------------------------------
  // ⏱️ Cycle de vie
  // ------------------------------------------------------------
  ngOnInit(): void {
    try {
      localStorage.setItem('menu-param', 'company');

      // Cloner l’objet pour édition locale
      this.myCompanyCopy = { ...this.myCompany };

      // Pré-remplir le champ avec la valeur existante si présente
      this.defaultPassword = (this.myCompanyCopy && this.myCompanyCopy.defaultPassword) || '';
    } catch (err) {
      console.error('Erreur pendant ngOnInit CompanySetDefaultPasswordComponent :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // ------------------------------------------------------------
  // 🔒 Définir / Mettre à jour le mot de passe par défaut société
  // ------------------------------------------------------------
  setDefaultPassword(): void {
    try {
      // ✅ Validations simples côté front
      if (!this.defaultPassword || !this.defaultPassword.trim()) {
        // Message i18n: ERROR.INVALID_PASSWORD
        this.showCustomToast(
          this.translate.instant('ERROR.INVALID_PASSWORD') || 'Mot de passe invalide.'
        );
        return;
      }

      if (this.defaultPassword.length < 8) {
        // Message i18n: ERROR.PASSWORD_TOO_SHORT
        this.showCustomToast(
          this.translate.instant('ERROR.PASSWORD_TOO_SHORT') || 'Le mot de passe doit contenir au moins 8 caractères.'
        );
        return;
      }

      // Mettre à jour la copie locale
      this.myCompanyCopy.defaultPassword = this.defaultPassword;

      // 👉 Appel API : on persiste tout l’objet (adapter si tu as un endpoint dédié)
      //   - Si tu as un endpoint spécifique : companyService.updateDefaultPassword(companyId, defaultPassword)
      //   - Ici on utilise update(this.myCompanyCopy) pour rester générique
      this.companyService.update(this.myCompanyCopy).subscribe({
        next: (updated: any) => {
          // Met à jour l’état local confirmé par le backend
          this.myCompany = updated;
          this.myCompanyCopy = { ...updated };

          // ✅ Toast succès IzyGlam
          this.showSuccessToast(
            this.translate.instant('SUCCESS.DEFAULT_PASSWORD_UPDATED') || 'Mot de passe par défaut mis à jour.'
          );
        },
        error: (error: any) => {
          console.error('Erreur lors de la mise à jour du mot de passe par défaut :', error);
          this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
        }
      });
    } catch (err) {
      console.error('Erreur setDefaultPassword :', err);
      this.showCustomToast(this.translate.instant('ERROR.GENERIC_ERROR'));
    }
  }

  // ------------------------------------------------------------
  // ✨ Toasts IzyGlam
  // ------------------------------------------------------------
  private showCustomToast(message: string) {
    this.toastr.error(message); // erreurs → .error()
  }

  private showSuccessToast(message: string) {
    this.toastr.success(message); // succès → .success()
  }
}
