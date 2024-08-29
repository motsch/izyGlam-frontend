import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-credit-employee-modal',
  templateUrl: './credit-employee-modal.component.html',
  styleUrls: ['./credit-employee-modal.component.scss']
})
export class CreditEmployeeModalComponent {
  @Input() employee: any;
  amount: number = 0;

  constructor(public activeModal: NgbActiveModal) {}

  credit() {
    if (this.amount > 0) {
      this.activeModal.close(this.amount); // Renvoie le montant crédité
    }
  }

  close() {
    this.activeModal.dismiss(); // Ferme la modal sans renvoyer de valeur
  }
}
