import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'app-new-shop-modal',
    templateUrl: './new-shop-modal.component.html',
    styleUrl: './new-shop-modal.component.scss',
})
export class NewShopModalComponent {
    @Input() shops: any[] = [];
    amount: number = 0;
    categories: any[] = [];

    constructor(
        public activeModal: NgbActiveModal,
        private categoryService: CategoryService
    ) {}

    ngOnInit() {
        console.log(this.employee);
        this.categoryService.getAll().subscribe({
            next: (data: any[]) => {
                console.log(data);
                this.categories = data;
            },
            error: (error: any) => {
                console.log(error);
            },
        });
    }

    credit() {
        if (this.amount > 0) {
            this.activeModal.close(this.amount); // Renvoie le montant crédité
        }
    }

    close() {
        this.activeModal.dismiss(); // Ferme la modal sans renvoyer de valeur
    }
}
