import { Component, OnInit } from '@angular/core';
import { UserService } from '../../services/user.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CreditEmployeeModalComponent } from '../credit-employee-modal/credit-employee-modal.component';

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
export class CompanyManagementComponent implements OnInit {
    companyBalance: number = 10000; // Exemple de solde initial
    creditAmount: number = 0;

    employees: any[] = [];

    invoices: Invoice[] = [];

    constructor(
        private userService: UserService,
        private modalService: NgbModal
    ) {}

    ngOnInit(): void {
        this.userService.getMe().subscribe({
            next: (data: any) => {
                console.log(data);

                this.userService.getByCompanyId(data.companyId).subscribe({
                    next: (data: any) => {
                        console.log(data);
                        this.employees = data;
                        this.invoices = [
                            {
                                date: new Date(),
                                amount: 100,
                                employee: data[0],
                                description: 'Achat produit X',
                            },
                            {
                                date: new Date(),
                                amount: 200,
                                employee: data[1],
                                description: 'Achat service Y',
                            },
                        ];
                    },
                    error: (error: any) => {
                        console.log(error);
                    },
                });
            },
            error: (error: any) => {
                console.log(error);
            },
        });
    }

    createEmployee(): void {
        // Logique pour créer un nouvel employé
        console.log('Créer un nouvel employé');
    }

    creditEmployee(employee: any): void {
        const modalRef = this.modalService.open(CreditEmployeeModalComponent);
        modalRef.componentInstance.employee = employee;

        modalRef.result.then(
            (result) => {
                // Le résultat contient le montant à créditer
                if (result > 0) {
                    employee.credit += result;
                    this.companyBalance -= result;
                }
            },
            (reason) => {
                console.log('Modal dismissed: ', reason);
            }
        );
    }

    resetPassword(employee: any): void {
        // Logique pour réinitialiser le mot de passe de l'employé
        console.log('Réinitialiser le mot de passe pour', employee.name);
    }

    deleteEmployee(employee: any): void {
        // Logique pour supprimer un employé
        this.userService.delete(employee._id).subscribe({
            next: (data: any) => {
                console.log(data);
                console.log('Employé supprimé :', employee.name);
                this.employees = this.employees.filter(
                    (e) => e._id !== employee._id
                );
            },
            error: (error: any) => {
                console.log(error);
            },
        });
    }

    creditCompanyAccount(): void {
        // Logique pour créditer le compte de l'entreprise
        if (this.creditAmount > 0) {
            this.companyBalance += this.creditAmount;
            this.creditAmount = 0;
        }
    }
}
