import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
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
    selector: 'app-company-management',
    templateUrl: './company-management.component.html',
    styleUrls: ['./company-management.component.scss'],
})
export class CompanyManagementComponent implements OnInit, OnChanges {
    @Input() myCompany: any = {};
    @Input() employees: any[] = [];
    myCompanyCopy: any = {};
    invoices: Invoice[] = [];

    constructor(
        private userService: UserService,
        private modalService: NgbModal
    ) {}

    ngOnInit(): void {
        // Si 'me' est déjà disponible
        this.updateCompany();
        this.updateEmployees();
    }

    ngOnChanges(changes: SimpleChanges) {
        // Si 'me' est fourni après l'initialisation
        if (changes['myCompany'] && changes['myCompany'].currentValue) {
            this.updateCompany();
        }
        // Si 'me' est fourni après l'initialisation
        if (changes['employees'] && changes['employees'].currentValue) {
            this.updateEmployees();
        }
    }

    private updateCompany(): void {
        console.log(this.myCompany);
        this.myCompanyCopy = {...this.myCompany};
    }

    private updateEmployees(): void {
        console.log(this.employees);
        this.myCompanyCopy = {...this.employees};
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
                    this.myCompany.credit -= result;
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
        employee.password = this.myCompany.defaultPassword;
        this.userService.updatePassword(employee).subscribe({
            next: (data: any) => {
                console.log(data);
            },
            error: (error: any) => {
                console.log(error);
            },
        });
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
}
