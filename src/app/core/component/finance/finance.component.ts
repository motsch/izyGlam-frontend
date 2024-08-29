import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
    selector: 'app-finance',
    templateUrl: './finance.component.html',
    styleUrls: ['./finance.component.scss'],
})
export class FinanceComponent implements OnInit {
    totalGenerated: number = 5000; // Exemple de chiffre d'affaires total généré
    commission: number = 500; // Exemple de commission prélevée
    netToPay: number = 4500; // Montant restant après déduction de la commission

    withdrawalForm: FormGroup;
    transactions = [
        { date: new Date(), amount: 1000, status: 'En attente' },
        {
            date: new Date(new Date().setDate(new Date().getDate() - 10)),
            amount: 2000,
            status: 'Traité',
        },
        {
            date: new Date(new Date().setDate(new Date().getDate() - 30)),
            amount: 1500,
            status: 'Traité',
        },
    ];

    constructor(private fb: FormBuilder) {
        this.withdrawalForm = this.fb.group({
            amount: ['', [Validators.required, Validators.min(1)]],
            accountDetails: ['', Validators.required],
        });
    }

    ngOnInit(): void {}

    requestWithdrawal(): void {
        if (this.withdrawalForm.valid) {
            const request = this.withdrawalForm.value;
            console.log('Demande de virement soumise:', request);
            // Logique pour traiter la demande de virement, comme un appel API
            // Ajout de la demande à l'historique (exemple)
            this.transactions.unshift({
                date: new Date(),
                amount: request.amount,
                status: 'En attente',
            });
            this.netToPay -= request.amount;
            this.withdrawalForm.reset();
        }
    }
}
