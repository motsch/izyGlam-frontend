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
    selector: 'app-company-set-default-password',
    templateUrl: './company-set-default-password.component.html',
    styleUrls: ['./company-set-default-password.component.scss'],
})
export class CompanySetDefaultPasswordComponent implements OnInit {
    @Input() myCompany: any = {};
    myCompanyCopy: any = {};
    defaultPassword: string = '';

    invoices: Invoice[] = [];

    constructor(
        private userService: UserService,
        private companyService: CompanyService
    ) {}

    ngOnInit(): void {
        this.myCompanyCopy = {...this.myCompany}
        this.defaultPassword = {...this.myCompany}.defaultPassword
    }

    setDefaultPassword() {
        console.log();
    }
}
