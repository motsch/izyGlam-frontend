import { Component, Input, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreditEmployeeModalComponent } from '../credit-employee-modal/credit-employee-modal.component';
import { CompanyService } from '../../services/company.service';

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
  // companyBalance: number = 10000; // Exemple de solde initial
  @Input() myCompany: any = {};
  @Input() employees: any[] = [];
  creditAmount: number = 0;
  myCompanyCopy: any = {};

  invoices: Invoice[] = [];

  constructor() {}

  ngOnInit(): void {
    this.myCompanyCopy = { ...this.myCompany };
    
    this.invoices = [
        {
            date: new Date(),
            amount: 100,
            employee: this.employees[0],
            description: 'Achat produit X',
        },
        {
            date: new Date(),
            amount: 200,
            employee: this.employees[1],
            description: 'Achat service Y',
        },
    ];
  }

  creditCompanyAccount(): void {
      // Logique pour créditer le compte de l'entreprise
      if (this.creditAmount > 0) {
          this.myCompany.credit += this.creditAmount;
          this.creditAmount = 0;
      }
  }
}
